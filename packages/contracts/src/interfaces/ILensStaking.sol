// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILensStaking {
    struct StakeInfo {
        uint256 amount;
        uint256 rewards;
        uint256 lastUpdate;
        uint256 lockEnd;
        uint256 bonusApyBps;
    }

    function stake(uint256 amount, uint256 lockDays) external;

    function withdraw(uint256 amount) external;

    function claimRewards() external;

    function pendingRewards(address staker) external view returns (uint256);

    function getStake(address staker) external view returns (StakeInfo memory);

    function totalStaked() external view returns (uint256);
}
