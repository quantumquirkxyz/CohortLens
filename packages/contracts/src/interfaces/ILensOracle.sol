// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILensOracle {
    struct Query {
        uint256 lensId;
        bytes params;
        address requester;
        address provider;
        uint256 pricePerQuery;
        bytes result;
        bool executed;
    }

    function submitQuery(uint256 lensId, bytes memory params) external returns (bytes32 queryId);

    function executeQuery(bytes32 queryId, bytes memory result) external;

    function getQuery(bytes32 queryId) external view returns (Query memory);

    function feeBps() external view returns (uint256);

    function treasury() external view returns (address);
}
