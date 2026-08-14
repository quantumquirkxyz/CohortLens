// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {LensToken} from "../src/LensToken.sol";

contract LensTokenTest is Test {
    LensToken internal token;
    address internal owner;

    function setUp() public {
        owner = address(this);
        token = new LensToken();
    }

    function test_metadata() public view {
        assertEq(token.name(), "Lens Token");
        assertEq(token.symbol(), "LENS");
        assertEq(token.decimals(), 18);
    }

    function test_maxSupplyMintedToDeployer() public view {
        assertEq(token.MAX_SUPPLY(), 1_000_000_000 * 1e18);
        assertEq(token.totalSupply(), token.MAX_SUPPLY());
        assertEq(token.balanceOf(owner), token.MAX_SUPPLY());
    }

    function test_mintRevertsBeyondCap() public {
        // Cap is already reached at construction, so any mint must revert.
        vm.expectRevert("LensToken: max supply exceeded");
        token.mint(address(0xBEEF), 1);
    }

    function test_mintOnlyOwner() public {
        vm.prank(address(0xCAFE));
        vm.expectRevert();
        token.mint(address(0xBEEF), 1);
    }

    function test_transferWorks() public {
        address recipient = address(0xBEEF);
        uint256 amount = 100 * 1e18;
        assertTrue(token.transfer(recipient, amount));
        assertEq(token.balanceOf(recipient), amount);
        assertEq(token.balanceOf(owner), token.MAX_SUPPLY() - amount);
    }
}
