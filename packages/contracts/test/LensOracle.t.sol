// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {LensToken} from "../src/LensToken.sol";
import {LensRegistry} from "../src/LensRegistry.sol";
import {LensOracle} from "../src/LensOracle.sol";
import {ILensOracle} from "../src/interfaces/ILensOracle.sol";

contract LensOracleTest is Test {
    LensToken internal token;
    LensRegistry internal registry;
    LensOracle internal oracle;
    address internal treasury = address(0xFEE);

    address internal provider = address(0xAAA);
    address internal requester = address(0xBBB);

    uint256 internal constant PRICE = 10e18;

    function setUp() public {
        token = new LensToken();
        registry = new LensRegistry();
        oracle = new LensOracle(address(registry), address(token), treasury);

        // Fund requester and approve the oracle.
        assertTrue(token.transfer(requester, 100e18));
        vm.prank(requester);
        token.approve(address(oracle), type(uint256).max);
    }

    function _registerActiveLens() internal returns (uint256 lensId) {
        vm.prank(provider);
        lensId = registry.registerLens("high-risk-wallets", "", PRICE);
    }

    function _submit() internal returns (bytes32 queryId) {
        vm.prank(requester);
        queryId = oracle.submitQuery(1, abi.encode("wallet-1"));
    }

    function test_submitQueryChargesAndStores() public {
        uint256 lensId = _registerActiveLens();
        bytes32 expectedQueryId = keccak256(abi.encode(lensId, abi.encode("wallet-1"), requester, uint256(0)));

        vm.expectEmit(true, true, true, true, address(oracle));
        emit LensOracle.QuerySubmitted(expectedQueryId, lensId, requester, PRICE);

        vm.prank(requester);
        bytes32 queryId = oracle.submitQuery(lensId, abi.encode("wallet-1"));
        assertEq(queryId, expectedQueryId);

        // Requester paid, oracle holds the price.
        assertEq(token.balanceOf(requester), 90e18);
        assertEq(token.balanceOf(address(oracle)), PRICE);

        ILensOracle.Query memory q = oracle.getQuery(queryId);
        assertEq(q.lensId, lensId);
        assertEq(q.requester, requester);
        assertEq(q.provider, provider);
        assertEq(q.pricePerQuery, PRICE);
        assertFalse(q.executed);
    }

    function test_submitQueryRejectsInactiveLens() public {
        uint256 lensId = _registerActiveLens();
        vm.prank(provider);
        registry.setActive(lensId, false);

        vm.prank(requester);
        vm.expectRevert("LensOracle: lens not active");
        oracle.submitQuery(lensId, abi.encode("wallet-1"));
    }

    function test_submitQueryRequiresApproval() public {
        _registerActiveLens();

        address noApproval = address(0xCCC);
        assertTrue(token.transfer(noApproval, 10e18));
        vm.prank(noApproval);
        vm.expectRevert();
        oracle.submitQuery(1, abi.encode("wallet-1"));
    }

    function test_executeQueryPaysProviderAndTreasury() public {
        _registerActiveLens();
        bytes32 queryId = _submit();

        uint256 providerBefore = token.balanceOf(provider);
        uint256 treasuryBefore = token.balanceOf(treasury);

        vm.prank(provider);
        oracle.executeQuery(queryId, abi.encode("0.87"));

        // 5% fee (ADR 008): provider gets 9.5 LENS, treasury 0.5 LENS.
        assertEq(token.balanceOf(provider) - providerBefore, PRICE - (PRICE * 500) / 10000);
        assertEq(token.balanceOf(treasury) - treasuryBefore, (PRICE * 500) / 10000);
        assertEq(token.balanceOf(address(oracle)), 0);

        ILensOracle.Query memory q = oracle.getQuery(queryId);
        assertTrue(q.executed);
        assertEq(abi.decode(q.result, (string)), "0.87");
    }

    function test_executeQueryOnlyProvider() public {
        _registerActiveLens();
        bytes32 queryId = _submit();

        vm.prank(requester);
        vm.expectRevert("LensOracle: only provider");
        oracle.executeQuery(queryId, abi.encode("0.87"));
    }

    function test_executeQueryRevertsDoubleExecution() public {
        _registerActiveLens();
        bytes32 queryId = _submit();

        vm.prank(provider);
        oracle.executeQuery(queryId, abi.encode("0.87"));

        vm.prank(provider);
        vm.expectRevert("LensOracle: already executed");
        oracle.executeQuery(queryId, abi.encode("0.88"));
    }

    function test_executeQueryRevertsUnknown() public {
        vm.expectRevert("LensOracle: query not found");
        oracle.executeQuery(bytes32(uint256(42)), abi.encode("x"));
    }

    function test_queryIdsAreUniquePerRequester() public {
        _registerActiveLens();

        vm.prank(requester);
        bytes32 q1 = oracle.submitQuery(1, abi.encode("wallet-1"));
        vm.prank(requester);
        bytes32 q2 = oracle.submitQuery(1, abi.encode("wallet-1"));

        assertTrue(q1 != q2);
    }

    function test_setFeeBps() public {
        oracle.setFeeBps(1000);
        assertEq(oracle.feeBps(), 1000);
    }

    function test_setFeeBpsOnlyOwner() public {
        vm.prank(address(0xBAD));
        vm.expectRevert();
        oracle.setFeeBps(1000);
    }

    function test_setTreasury() public {
        address newTreasury = address(0xABC);
        oracle.setTreasury(newTreasury);
        assertEq(oracle.treasury(), newTreasury);
    }

    function test_setTreasuryRejectsZero() public {
        vm.expectRevert("LensOracle: zero treasury");
        oracle.setTreasury(address(0));
    }
}
