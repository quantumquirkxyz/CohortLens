// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILensRegistry {
    struct Lens {
        string name;
        string description;
        address provider;
        uint256 pricePerQuery;
        bool active;
        uint256 createdAt;
    }

    function registerLens(string memory name, string memory description, uint256 pricePerQuery)
        external
        returns (uint256 lensId);

    function setPrice(uint256 lensId, uint256 pricePerQuery) external;

    function setActive(uint256 lensId, bool active) external;

    function getLens(uint256 lensId) external view returns (Lens memory);

    function lensCount() external view returns (uint256);
}
