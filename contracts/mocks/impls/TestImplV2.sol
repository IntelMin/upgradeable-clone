//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract TestImplV2 is ERC721Upgradeable {
    uint256 public totalSupply;

    event Mint(uint256 tokenId);

    function setUp(
        string memory _name, 
        string memory _symbol
    ) initializer external {
        __ERC721_init(_name, _symbol);
    }

    function mint() external {
        for (uint256 i = 0; i < 5; i++) {
            _mint(msg.sender, totalSupply);

            emit Mint(totalSupply);

            totalSupply ++;
        }
    }
}