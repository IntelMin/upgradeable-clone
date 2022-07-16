//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/utils/StorageSlot.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/ICloneFactory.sol";

contract CustomProxy is Proxy {

    /**
     * @dev Storage slot with the address of the current factory contract.
     * This is the keccak-256 hash of "massless.customproxy.factory" subtracted by 1, and is
     * validated in the constructor.
     */
    bytes32 internal constant _FACTORY_SLOT = 0x6d31471ff8e0862bd65e4aa5ef38e37765c059fd8af86c342fb92451fcd68a57;

    constructor() {
        assert(_FACTORY_SLOT == bytes32(uint256(keccak256("massless.customproxy.factory")) - 1));
    }

    modifier onlyFactory() {
        address factory = _getFactory();
        require(factory == address(0) || factory == msg.sender, "CustomProxy: caller is not a factory");
        _;
    }

    function setFactory(address _factory) onlyFactory external {
        require(Address.isContract(_factory), "CustomProxy: factory is not a contract");

        StorageSlot.getAddressSlot(_FACTORY_SLOT).value = _factory;
    }

    function _getFactory() internal view returns (address) {
        return StorageSlot.getAddressSlot(_FACTORY_SLOT).value;
    }

    function _implementation() internal view override returns (address) {
        return ICloneFactory(_getFactory()).getImplementation();
    }
}
