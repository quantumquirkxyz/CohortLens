// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {LensToken} from "../src/LensToken.sol";
import {LensRegistry} from "../src/LensRegistry.sol";
import {LensOracle} from "../src/LensOracle.sol";
import {LensStaking} from "../src/LensStaking.sol";

/// @notice Deploys and wires the four Lens contracts.
///         Usage (local/anvil):
///         forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
contract Deploy is Script {
    function run() external returns (LensToken token, LensRegistry registry, LensOracle oracle, LensStaking staking) {
        address deployer = msg.sender;
        address treasury = vm.envOr("LENS_TREASURY", deployer);

        vm.startBroadcast();

        token = new LensToken();
        registry = new LensRegistry();
        oracle = new LensOracle(address(registry), address(token), treasury);
        staking = new LensStaking(address(token));

        vm.stopBroadcast();

        console2.log("LensToken   deployed at:", address(token));
        console2.log("LensRegistry deployed at:", address(registry));
        console2.log("LensOracle  deployed at:", address(oracle));
        console2.log("LensStaking deployed at:", address(staking));
        console2.log("Treasury:", treasury);
    }
}
