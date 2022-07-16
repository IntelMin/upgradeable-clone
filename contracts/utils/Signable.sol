// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./Signature.sol";

abstract contract Signable is Ownable, Signature
{
    error ZeroSignerAddress();

    constructor(address _signer) Signature(_signer) {
       
    }

    modifier checkSignerAddress(address _signerAddress) {
        if (_signerAddress == address(0)){
            revert ZeroSignerAddress();
        }
        _;
    }
    
    function setSignerAddress(address _signerAddress) public onlyOwner checkSignerAddress(_signerAddress) {
        _setSignerAddress(_signerAddress);
    }
}
