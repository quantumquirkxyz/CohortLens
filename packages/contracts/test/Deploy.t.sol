// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {LensToken} from "../src/LensToken.sol";
import {LensRegistry} from "../src/LensRegistry.sol";
import {LensOracle} from "../src/LensOracle.sol";
import {LensStaking} from "../src/LensStaking.sol";

contract DeployTest is Test {
    function test_deployScriptWiresContracts() public {
        Deploy deploy = new Deploy();
        (LensToken token, LensRegistry registry, LensOracle oracle, LensStaking staking) = deploy.run();

        assertTrue(address(token) != address(0));
        assertTrue(address(registry) != address(0));
        assertTrue(address(oracle) != address(0));
        assertTrue(address(staking) != address(0));

        // Oracle is wired to the registry and token; default 5% fee.
        assertEq(address(oracle.registry()), address(registry));
        assertEq(address(oracle.lensToken()), address(token));
        assertEq(oracle.feeBps(), 500);
        // Staking is wired to the token; treasury defaults to the deployer.
        assertEq(address(staking.lensToken()), address(token));
        assertTrue(oracle.treasury() != address(0));
    }
}
