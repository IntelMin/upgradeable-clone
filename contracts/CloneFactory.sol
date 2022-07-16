//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./interfaces/ICloneFactory.sol";
import "./CustomProxy.sol";

contract CloneFactory is Ownable, ICloneFactory {
    address internal implementation;
    address internal proxySample;

    event ImplUpgraded(address indexed oldImpl, address indexed newImpl);
    event ProxyCloned(address indexed proxy);

    constructor(address _impl) {
        implementation = _impl;
        proxySample = address(new CustomProxy());

        emit ImplUpgraded(address(0), _impl);
    }

    function clone() onlyOwner external {
        address clonedProxy = Clones.clone(proxySample);

        CustomProxy(payable(clonedProxy)).setFactory(address(this));

        emit ProxyCloned(clonedProxy);
    }

    function upgradeImplementation(address _newImpl) onlyOwner public {
        assert(implementation != _newImpl);

        address oldImpl = implementation;
        implementation = _newImpl;

        emit ImplUpgraded(oldImpl, _newImpl);
    }

    function getImplementation() external view override returns (address) {
        return implementation;
    }
}