// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {LensToken} from "../src/LensToken.sol";
import {LensStaking} from "../src/LensStaking.sol";
import {ILensStaking} from "../src/interfaces/ILensStaking.sol";

contract LensStakingTest is Test {
    LensToken internal token;
    LensStaking internal staking;
    address internal staker = address(0xAAA);

    uint256 internal constant STAKE = 1000e18;

    function setUp() public {
        token = new LensToken();
        staking = new LensStaking(address(token));

        assertTrue(token.transfer(staker, 10_000e18));
        vm.startPrank(staker);
        token.approve(address(staking), type(uint256).max);
    }

    function test_stake() public {
        staking.stake(STAKE, 0);

        ILensStaking.StakeInfo memory s = staking.getStake(staker);
        assertEq(s.amount, STAKE);
        assertEq(s.lockEnd, 0);
        assertEq(staking.totalStaked(), STAKE);
        assertEq(token.balanceOf(address(staking)), STAKE);
    }

    function test_stakeInvalidLockReverts() public {
        vm.expectRevert("LensStaking: invalid lock duration");
        staking.stake(STAKE, 15);
    }

    function test_stakeZeroReverts() public {
        vm.expectRevert("LensStaking: zero amount");
        staking.stake(0, 0);
    }

    function test_pendingRewardsFivePercentPerYear() public {
        staking.stake(STAKE, 0);

        vm.warp(block.timestamp + 365 days);
        uint256 pending = staking.pendingRewards(staker);

        // 5% base APY on 1000 LENS after one year.
        assertApproxEqRel(pending, (STAKE * 5) / 100, 0.001e18);
    }

    function test_claimRewards() public {
        staking.stake(STAKE, 0);
        vm.warp(block.timestamp + 180 days);

        uint256 before = token.balanceOf(staker);
        staking.claimRewards();

        // 5% APY for 180 days on 1000 LENS.
        uint256 expectedRewards = (STAKE * 500 * 180 days) / (10000 * 365 days);
        assertApproxEqRel(token.balanceOf(staker) - before, expectedRewards, 0.001e18);
        assertEq(staking.pendingRewards(staker), 0);
        assertEq(staking.getStake(staker).amount, STAKE);
    }

    function test_claimRewardsNothingReverts() public {
        vm.expectRevert("LensStaking: nothing to claim");
        staking.claimRewards();
    }

    function test_withdrawWhileLockedReverts() public {
        staking.stake(STAKE, 30);

        vm.expectRevert("LensStaking: locked");
        staking.withdraw(STAKE);
    }

    function test_withdrawAfterLock() public {
        staking.stake(STAKE, 30);
        vm.warp(block.timestamp + 30 days + 1);

        uint256 before = token.balanceOf(staker);
        staking.withdraw(STAKE);

        assertEq(token.balanceOf(staker), before + STAKE);
        assertEq(staking.totalStaked(), 0);
        assertEq(staking.getStake(staker).amount, 0);
    }

    function test_withdrawTooMuchReverts() public {
        staking.stake(STAKE, 0);
        vm.expectRevert("LensStaking: insufficient stake");
        staking.withdraw(STAKE + 1);
    }

    function test_bonusApyForLockTiers() public view {
        assertEq(staking.bonusApyForLock(0), 0);

        uint256 current = block.timestamp;
        assertEq(staking.bonusApyForLock(current + 30 days), 100);
        assertEq(staking.bonusApyForLock(current + 90 days), 300);
        assertEq(staking.bonusApyForLock(current + 180 days), 500);
    }

    function test_longLockEarnsTenPercentPerYear() public {
        staking.stake(STAKE, 180);
        vm.warp(block.timestamp + 365 days);

        // 5% base + 5% bonus = 10% APY.
        assertApproxEqRel(staking.pendingRewards(staker), (STAKE * 10) / 100, 0.001e18);
    }

    function test_restakeExtendsLock() public {
        staking.stake(STAKE, 30);

        vm.warp(block.timestamp + 10 days);
        staking.stake(STAKE, 180);

        ILensStaking.StakeInfo memory s = staking.getStake(staker);
        // 180-day lock from the second stake overrides the shorter remaining one.
        assertEq(s.bonusApyBps, 500);
        assertGe(s.lockEnd, block.timestamp + 180 days);
    }
}
