// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILensRegistry} from "./interfaces/ILensRegistry.sol";
import {ILensOracle} from "./interfaces/ILensOracle.sol";

/// @title LensOracle
/// @notice Collects LENS payments for Lens queries and settles them with the
///         provider. The protocol keeps a 5% fee (default) that goes to the
///         treasury (ADR 008).
contract LensOracle is ILensOracle, Ownable {
    using SafeERC20 for IERC20;

    /// @dev Protocol fee in basis points. 500 == 5% (ADR 008).
    uint256 public constant DEFAULT_FEE_BPS = 500;

    ILensRegistry public immutable registry;
    IERC20 public immutable lensToken;
    uint256 public override feeBps;
    address public override treasury;

    mapping(bytes32 => Query) private _queries;
    /// @dev Per-sender nonce so query ids are deterministic and collision-free.
    mapping(address => uint256) public nonces;

    event QuerySubmitted(bytes32 indexed queryId, uint256 indexed lensId, address indexed requester, uint256 price);
    event QueryExecuted(bytes32 indexed queryId, uint256 indexed lensId, address indexed provider, bytes result);
    event FeeUpdated(uint256 feeBps);
    event TreasuryUpdated(address treasury);

    constructor(address registry_, address lensToken_, address treasury_) Ownable(msg.sender) {
        registry = ILensRegistry(registry_);
        lensToken = IERC20(lensToken_);
        feeBps = DEFAULT_FEE_BPS;
        treasury = treasury_;
    }

    /// @notice Pay the Lens price and open a query. The requester must have
    ///         approved the Oracle to spend LENS.
    function submitQuery(uint256 lensId, bytes memory params) external override returns (bytes32 queryId) {
        ILensRegistry.Lens memory lens = registry.getLens(lensId);
        require(lens.active, "LensOracle: lens not active");

        uint256 price = lens.pricePerQuery;
        lensToken.safeTransferFrom(msg.sender, address(this), price);

        queryId = keccak256(abi.encode(lensId, params, msg.sender, nonces[msg.sender]++));
        _queries[queryId] = Query({
            lensId: lensId,
            params: params,
            requester: msg.sender,
            provider: lens.provider,
            pricePerQuery: price,
            result: "",
            executed: false
        });

        emit QuerySubmitted(queryId, lensId, msg.sender, price);
    }

    /// @notice Fulfil a query with the result. Only the Lens provider may
    ///         execute; the provider is paid price minus the protocol fee and
    ///         the fee goes to the treasury.
    function executeQuery(bytes32 queryId, bytes memory result) external override {
        Query storage query = _queries[queryId];
        require(query.provider != address(0), "LensOracle: query not found");
        require(!query.executed, "LensOracle: already executed");
        require(msg.sender == query.provider, "LensOracle: only provider");

        query.result = result;
        query.executed = true;

        uint256 providerShare = query.pricePerQuery - (query.pricePerQuery * feeBps) / 10000;
        if (providerShare > 0) {
            lensToken.safeTransfer(query.provider, providerShare);
        }
        lensToken.safeTransfer(treasury, query.pricePerQuery - providerShare);

        emit QueryExecuted(queryId, query.lensId, query.provider, result);
    }

    function getQuery(bytes32 queryId) external view override returns (Query memory) {
        return _queries[queryId];
    }

    /// @notice Set the protocol fee in basis points (owner only).
    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 10000, "LensOracle: fee out of bounds");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    /// @notice Set the treasury address (owner only).
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "LensOracle: zero treasury");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }
}
