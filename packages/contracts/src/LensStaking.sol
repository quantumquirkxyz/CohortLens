// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILensStaking} from "./interfaces/ILensStaking.sol";

/// @title LensStaking
/// @notice Stake LENS to earn rewards. Base APY is 5% (ADR 008); locking the
///         stake for 30/90/180 days adds up to 5% bonus APY. Rewards accrue
///         per-second on the current principal, so a stake is fully liquid
///         (principal + rewards) once its lock has ended.
contract LensStaking is ILensStaking, Ownable {
    using SafeERC20 for IERC20;

    /// @dev Base 5% APY in basis points (ADR 008).
    uint256 public constant BASE_APY_BPS = 500;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    /// @dev Reward precision multiplier to avoid rounding dust on short timespans.
    uint256 public constant PRECISION = 1e12;

    IERC20 public immutable lensToken;

    mapping(address => StakeInfo) private _stakes;
    uint256 public override totalStaked;

    event Staked(address indexed staker, uint256 amount, uint256 lockDays);
    event Withdrawn(address indexed staker, uint256 amount);
    event RewardsClaimed(address indexed staker, uint256 rewards);

    constructor(address lensToken_) Ownable(msg.sender) {
        lensToken = IERC20(lensToken_);
    }

    /// @notice Stake `amount` LENS. `lockDays` must be 0, 30, 90 or 180; a lock
    ///         extends the current lock end (if any) and sets the bonus APY.
    ///         Rewards already accrued before this call are kept.
    function stake(uint256 amount, uint256 lockDays) external override {
        require(amount > 0, "LensStaking: zero amount");
        require(_validLock(lockDays), "LensStaking: invalid lock duration");

        StakeInfo storage s = _stakes[msg.sender];
        _accrue(msg.sender);

        lensToken.safeTransferFrom(msg.sender, address(this), amount);
        s.amount += amount;
        totalStaked += amount;

        if (lockDays > 0) {
            uint256 lockEnd = block.timestamp + lockDays * 1 days;
            s.lockEnd = lockEnd > s.lockEnd ? lockEnd : s.lockEnd;
        }
        s.bonusApyBps = _bonusForLock(s.lockEnd);

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
        s.bonusApyBps = _bonusForLock(s.lockEnd);
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

        uint256 elapsed = block.timestamp - s.lastUpdate;
        uint256 annualRateBps = BASE_APY_BPS + s.bonusApyBps;
        return s.rewards + (s.amount * annualRateBps * elapsed * PRECISION) / (10000 * SECONDS_PER_YEAR * PRECISION);
    }

    function getStake(address staker) external view override returns (StakeInfo memory) {
        return _stakes[staker];
    }

    /// @notice Bonus APY (bps) for a lock end: 30d -> 1%, 90d -> 3%, 180d -> 5%.
    function bonusApyForLock(uint256 lockEnd) public view returns (uint256) {
        return _bonusForLock(lockEnd);
    }

    function _accrue(address staker) private {
        StakeInfo storage s = _stakes[staker];
        if (s.amount == 0) {
            s.lastUpdate = block.timestamp;
            return;
        }
        s.rewards += _computeRewards(s, block.timestamp - s.lastUpdate);
        s.lastUpdate = block.timestamp;
    }

    function _computeRewards(StakeInfo storage s, uint256 elapsed) private view returns (uint256) {
        uint256 annualRateBps = BASE_APY_BPS + s.bonusApyBps;
        return (s.amount * annualRateBps * elapsed * PRECISION) / (10000 * SECONDS_PER_YEAR * PRECISION);
    }

    function _bonusForLock(uint256 lockEnd) private view returns (uint256) {
        // forge-lint: disable-next-line(block-timestamp) -- remaining-lock bonus tiering, standard for time-based staking
        if (lockEnd == 0 || block.timestamp >= lockEnd) return 0;
        uint256 daysLocked = (lockEnd - block.timestamp) / 1 days;
        if (daysLocked >= 180) return 500;
        if (daysLocked >= 90) return 300;
        if (daysLocked >= 30) return 100;
        return 0;
    }

    function _validLock(uint256 lockDays) private pure returns (bool) {
        return lockDays == 0 || lockDays == 30 || lockDays == 90 || lockDays == 180;
    }
}
