//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface ICloneFactory {
    function getImplementation() external view returns (address);
}