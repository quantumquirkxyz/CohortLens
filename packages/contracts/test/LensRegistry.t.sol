// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {LensRegistry} from "../src/LensRegistry.sol";
import {ILensRegistry} from "../src/interfaces/ILensRegistry.sol";

contract LensRegistryTest is Test {
    LensRegistry internal registry;
    address internal provider = address(0xAAA);

    function setUp() public {
        registry = new LensRegistry();
    }

    function test_registerLens() public {
        vm.expectEmit(true, true, false, true, address(registry));
        emit LensRegistry.LensRegistered(1, "high-risk-wallets", provider, 1e18);

        vm.prank(provider);
        uint256 lensId = registry.registerLens("high-risk-wallets", "Risk signal over the CFG", 1e18);

        assertEq(lensId, 1);
        assertEq(registry.lensCount(), 1);

        ILensRegistry.Lens memory lens = registry.getLens(lensId);
        assertEq(lens.name, "high-risk-wallets");
        assertEq(lens.provider, provider);
        assertEq(lens.pricePerQuery, 1e18);
        assertTrue(lens.active);
    }

    function test_registerIncrementsIds() public {
        vm.prank(provider);
        registry.registerLens("lens-a", "", 0.5e18);
        vm.prank(provider);
        uint256 lensId = registry.registerLens("lens-b", "", 0.5e18);
        assertEq(lensId, 2);
    }

    function test_registerRevertsEmptyName() public {
        vm.prank(provider);
        vm.expectRevert("LensRegistry: empty name");
        registry.registerLens("", "desc", 1e18);
    }

    function test_registerRevertsBelowMinPrice() public {
        uint256 tooLow = registry.MIN_PRICE() - 1;
        vm.expectRevert("LensRegistry: price out of bounds");
        registry.registerLens("cheap", "", tooLow);
    }

    function test_registerRevertsAboveMaxPrice() public {
        uint256 tooHigh = registry.MAX_PRICE() + 1;
        vm.expectRevert("LensRegistry: price out of bounds");
        registry.registerLens("expensive", "", tooHigh);
    }

    function test_setPrice() public {
        vm.startPrank(provider);
        uint256 lensId = registry.registerLens("lens", "", 1e18);
        registry.setPrice(lensId, 2.5e18);
        vm.stopPrank();

        assertEq(registry.getLens(lensId).pricePerQuery, 2.5e18);
    }

    function test_setPriceOnlyProvider() public {
        vm.prank(provider);
        uint256 lensId = registry.registerLens("lens", "", 1e18);

        vm.prank(address(0xBEEF));
        vm.expectRevert("LensRegistry: not provider");
        registry.setPrice(lensId, 2e18);
    }

    function test_setActive() public {
        vm.startPrank(provider);
        uint256 lensId = registry.registerLens("lens", "", 1e18);
        registry.setActive(lensId, false);
        vm.stopPrank();

        assertFalse(registry.getLens(lensId).active);
    }

    function test_getLensRevertsUnknownId() public {
        vm.expectRevert("LensRegistry: lens not found");
        registry.getLens(1);
    }
}
