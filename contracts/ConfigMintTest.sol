// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./utils/Signable.sol";

error ExpiredSignature();

contract ConfigMintTest is ERC721A, Signable{
    error EthPaymentFailed();
    error Erc20PaymentFailed();
    error HoldingsFailed();

    struct TokenData {
        uint32 originalId;
        uint32 level;
        uint32 category;
        uint32 ref;
        uint128 extended; 
    }

    mapping(address => mapping(uint256 => uint256)) public tokenStatus;

    address[] public holdingContracts;
    address[] public erc20Contracts;

    uint256 public validTokenStatus;
    uint256 public config;

    constructor(uint256 config_, address[] memory erc20Contracts_, address[] memory holdingContracts_, address signer_) Signable(signer_) ERC721A("ConfigMintTest", "ERC721A"){
        config = config_;
        erc20Contracts = erc20Contracts_;
        holdingContracts = holdingContracts_;
    }

    function mint(
        bytes calldata signature_, 
        bytes32 salt_, 
        uint256 ethValue_, 
        uint256[] calldata erc20Values_,  
        uint256[][] calldata tokenIds_, 
        uint256 tokenStatus_,
        uint256 quantity_,
        uint256 expireAt_) 
        public 
        payable
        onlySignedTx(
            keccak256(
                abi.encode(
                    msg.sender,
                    salt_, 
                    ethValue_, 
                    erc20Values_, 
                    tokenIds_,
                    tokenStatus_, 
                    quantity_,
                    expireAt_)
                    ), 
            signature_
        ) 
    {
        if (block.timestamp >= expireAt_)
            revert ExpiredSignature();

        if (!validateEth(ethValue_)) revert EthPaymentFailed();
        if (!validateERC20(erc20Values_)) revert Erc20PaymentFailed();
        if (!validateHoldings(tokenIds_, tokenStatus_)) revert HoldingsFailed();

        _mint(msg.sender, quantity_);
    }

    function validateERC20(uint256[] calldata erc20Values_) internal returns (bool erc20Verified) {
        if (erc20Contracts.length == 0) return true;
        else if (erc20Contracts.length != erc20Values_.length) return false;

        for (uint256 i; i < erc20Contracts.length; i++) {
            if (!IERC20(erc20Contracts[i]).transferFrom(msg.sender, address(this), erc20Values_[i])) {
                return false;
            }
        }

        return true;
    }


    function validateEth(uint256 _ethValue) internal view returns (bool ethVerified) {
        ethVerified = msg.value == _ethValue;
    }

    function validateHoldings(uint256[][] memory _tokenIds, uint256 status) internal returns (bool holdingsVerified) {
        if (_tokenIds.length == 0) return true;
        else if (holdingContracts.length != _tokenIds.length) return false;

        for (uint256 i; i < holdingContracts.length; i++) {
            for (uint256 j; j < _tokenIds[i].length; j++) {
                if (IERC721(holdingContracts[i]).ownerOf(_tokenIds[i][j]) != msg.sender) {
                    return false;
                }

                if (config > 0) {
                    if (checkTokenStatus(holdingContracts[i], _tokenIds[i][j])) {
                        setTokenStatus(holdingContracts[i], _tokenIds[i][j], status);
                    } else {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    function checkTokenStatus(address holdingContract, uint256 tokenId) internal view returns(bool) {
        return tokenStatus[holdingContract][tokenId] == validTokenStatus;
    }

    function setTokenStatus(address holdingContract, uint256 tokenId, uint256 status) internal {
        tokenStatus[holdingContract][tokenId] |= status;
    }
}