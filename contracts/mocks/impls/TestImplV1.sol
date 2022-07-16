//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract TestImplV1 is ERC721Upgradeable {
    uint256 public totalSupply;

    function setUp(
        string memory _name, 
        string memory _symbol
    ) initializer external {
        __ERC721_init(_name, _symbol);
    }

    function mint() external {
        _mint(msg.sender, totalSupply);
        totalSupply ++;
    }
}