// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ILensRegistry} from "./interfaces/ILensRegistry.sol";

/// @title LensRegistry
/// @notice On-chain registry of available Lenses. Anyone can register a Lens
///         as provider and set its price within the ADR 008 bounds
///         (min 0.1 LENS, max 1000 LENS per query).
contract LensRegistry is ILensRegistry {
    /// @dev Price bounds in wei (1e18 == 1 LENS), per ADR 008.
    uint256 public constant MIN_PRICE = 0.1e18;
    uint256 public constant MAX_PRICE = 1000e18;

    mapping(uint256 => Lens) private _lenses;
    uint256 public override lensCount;

    event LensRegistered(uint256 indexed lensId, string name, address indexed provider, uint256 pricePerQuery);
    event LensPriceUpdated(uint256 indexed lensId, uint256 pricePerQuery);
    event LensActiveUpdated(uint256 indexed lensId, bool active);

    /// @notice Register a new Lens, returning its id (1-based).
    function registerLens(string memory name, string memory description, uint256 pricePerQuery)
        external
        override
        returns (uint256 lensId)
    {
        require(bytes(name).length > 0, "LensRegistry: empty name");
        require(_validPrice(pricePerQuery), "LensRegistry: price out of bounds");

        lensId = ++lensCount;
        _lenses[lensId] = Lens({
            name: name,
            description: description,
            provider: msg.sender,
            pricePerQuery: pricePerQuery,
            active: true,
            createdAt: block.timestamp
        });

        emit LensRegistered(lensId, name, msg.sender, pricePerQuery);
    }

    /// @notice Update a Lens price (provider only), within the ADR 008 bounds.
    function setPrice(uint256 lensId, uint256 pricePerQuery) external override {
        require(_validPrice(pricePerQuery), "LensRegistry: price out of bounds");
        Lens storage lens = _requireLens(lensId);
        require(lens.provider == msg.sender, "LensRegistry: not provider");

        lens.pricePerQuery = pricePerQuery;
        emit LensPriceUpdated(lensId, pricePerQuery);
    }

    /// @notice Activate/deactivate a Lens (provider only).
    function setActive(uint256 lensId, bool active) external override {
        Lens storage lens = _requireLens(lensId);
        require(lens.provider == msg.sender, "LensRegistry: not provider");

        lens.active = active;
        emit LensActiveUpdated(lensId, active);
    }

    /// @notice Full Lens metadata; reverts if the id does not exist.
    function getLens(uint256 lensId) external view override returns (Lens memory) {
        return _requireLens(lensId);
    }

    function _requireLens(uint256 lensId) private view returns (Lens storage lens) {
        require(lensId != 0 && lensId <= lensCount, "LensRegistry: lens not found");
        lens = _lenses[lensId];
    }

    function _validPrice(uint256 price) private pure returns (bool) {
        return price >= MIN_PRICE && price <= MAX_PRICE;
    }
}
