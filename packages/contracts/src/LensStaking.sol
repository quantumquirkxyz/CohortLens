// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILensStaking} from "./interfaces/ILensStaking.sol";

/// @title LensStaking
/// @notice Stake LENS to earn rewards. Base APY is 5% (ADR 008); committing a
///         30/90/180-day lock earns a tier bonus (up to 5% APY) for the locked
///         period. Rewards accrue per-second: base APY always, bonus APY only
///         while a lock is active, so the tier is fixed by the commitment and
///         is never affected by unrelated stake/withdraw events.
contract LensStaking is ILensStaking, Ownable {
    using SafeERC20 for IERC20;

    /// @dev Base 5% APY in basis points (ADR 008).
    uint256 public constant BASE_APY_BPS = 500;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    IERC20 public immutable lensToken;

    mapping(address => StakeInfo) private _stakes;
    uint256 public override totalStaked;

    event Staked(address indexed staker, uint256 amount, uint256 lockDays);
    event Withdrawn(address indexed staker, uint256 amount);
    event RewardsClaimed(address indexed staker, uint256 rewards);

    constructor(address lensToken_) Ownable(msg.sender) {
        lensToken = IERC20(lensToken_);
    }

    /// @notice Stake `amount` LENS. `lockDays` must be 0, 30, 90 or 180. A lock
    ///         extends the current lock end and sets the committed bonus tier
    ///         (kept if a later tier is lower); rewards accrued before this
    ///         call are preserved.
    function stake(uint256 amount, uint256 lockDays) external override {
        require(amount > 0, "LensStaking: zero amount");
        (uint256 tierBonus, bool valid) = _lockTier(lockDays);
        require(lockDays == 0 || valid, "LensStaking: invalid lock duration");

        StakeInfo storage s = _stakes[msg.sender];
        _accrue(msg.sender);

        lensToken.safeTransferFrom(msg.sender, address(this), amount);
        s.amount += amount;
        totalStaked += amount;

        if (lockDays > 0) {
            uint256 lockEnd = block.timestamp + lockDays * 1 days;
            s.lockEnd = lockEnd > s.lockEnd ? lockEnd : s.lockEnd;
            // The committed tier never regresses from unrelated events.
            if (tierBonus > s.bonusApyBps) s.bonusApyBps = tierBonus;
        } else if (s.lockEnd == 0 || _lockExpired(s.lockEnd)) {
            // No lock in force: clear any stale committed bonus.
            s.bonusApyBps = 0;
        }

        emit Staked(msg.sender, amount, lockDays);
    }

    /// @notice Withdraw staked principal. Not allowed while a lock is active.
    function withdraw(uint256 amount) external override {
        require(amount > 0, "LensStaking: zero amount");

        StakeInfo storage s = _stakes[msg.sender];
        _accrue(msg.sender);
        // forge-lint: disable-next-line(block-timestamp) -- lock expiry check, standard for time-based staking
        require(block.timestamp >= s.lockEnd, "LensStaking: locked");
        require(s.amount >= amount, "LensStaking: insufficient stake");

        s.amount -= amount;
        totalStaked -= amount;
        // Withdrawing requires the lock to have ended, so no bonus remains.
        s.bonusApyBps = 0;
        lensToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Claim accrued rewards without touching the principal.
    function claimRewards() external override {
        StakeInfo storage s = _stakes[msg.sender];
        _accrue(msg.sender);

        uint256 rewards = s.rewards;
        require(rewards > 0, "LensStaking: nothing to claim");
        s.rewards = 0;
        lensToken.safeTransfer(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    /// @notice Rewards accrued up to now without mutating state.
    function pendingRewards(address staker) public view override returns (uint256) {
        StakeInfo storage s = _stakes[staker];
        // Accrued-but-unclaimed rewards must survive a full withdrawal.
        if (s.amount == 0) return s.rewards;
        return s.rewards + _computeRewards(s, s.lastUpdate, block.timestamp);
    }

    function getStake(address staker) external view override returns (StakeInfo memory) {
        return _stakes[staker];
    }

    /// @notice Bonus APY (bps) for a lock duration: 30d -> 1%, 90d -> 3%,
    ///         180d -> 5% (ADR 008). Reverts for unsupported durations.
    function lockBonusBps(uint256 lockDays) public pure returns (uint256) {
        (uint256 bonusBps, bool valid) = _lockTier(lockDays);
        require(valid, "LensStaking: invalid lock duration");
        return bonusBps;
    }

    function _accrue(address staker) private {
        StakeInfo storage s = _stakes[staker];
        if (s.amount == 0) {
            s.lastUpdate = block.timestamp;
            return;
        }
        s.rewards += _computeRewards(s, s.lastUpdate, block.timestamp);
        s.lastUpdate = block.timestamp;
    }

    /// @dev Base rewards for the whole [from, to] window plus the committed
    ///      tier bonus only for the part of the window inside an active lock.
    function _computeRewards(StakeInfo storage s, uint256 from, uint256 to) private view returns (uint256) {
        uint256 base = (s.amount * BASE_APY_BPS * (to - from)) / (10000 * SECONDS_PER_YEAR);

        uint256 bonusEnd = s.lockEnd;
        if (bonusEnd <= from || bonusEnd > to) {
            bonusEnd = bonusEnd > to ? to : from;
        }
        uint256 bonus = (s.amount * s.bonusApyBps * (bonusEnd - from)) / (10000 * SECONDS_PER_YEAR);

        return base + bonus;
    }

    function _lockExpired(uint256 lockEnd) private view returns (bool) {
        // forge-lint: disable-next-line(block-timestamp) -- lock expiry check, standard for time-based staking
        return lockEnd != 0 && block.timestamp >= lockEnd;
    }

    /// @dev Single source of truth for lock tiers (ADR 008). Unsupported
    ///      durations return valid=false instead of a bonus.
    function _lockTier(uint256 lockDays) private pure returns (uint256 bonusBps, bool valid) {
        if (lockDays == 30) return (100, true);
        if (lockDays == 90) return (300, true);
        if (lockDays == 180) return (500, true);
        return (0, false);
    }
}
