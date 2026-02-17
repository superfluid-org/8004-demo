// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentPoolDistributor} from "../src/AgentPoolDistributor.sol";
import {NetworkConfig} from "./config/NetworkConfig.sol";

contract DeployScript is Script {
    function run() external {
        NetworkConfig.DeploymentConfig memory config = NetworkConfig.getNetworkConfig(block.chainid);
        address deployer = _startBroadcast();

        console.log("Deployer           :", deployer);
        console.log("Identity Registry  :", config.identityRegistry);
        console.log("GDA Forwarder      :", config.gdaForwarder);
        console.log("Super Token        :", config.supToken);
        console.log("Fee Collector      :", config.treasury);
        console.log("Join Fee           :", config.joinFee);

        AgentPoolDistributor distributor = new AgentPoolDistributor(
            config.identityRegistry,
            config.gdaForwarder,
            config.supToken,
            config.treasury,
            config.joinFee
        );

        console.log("AgentPoolDistributor deployed at   :", address(distributor));
        console.log("Reward GDA Pool deployed at        :", address(distributor.pool()));

        _stopBroadcast();
    }

    function _startBroadcast() internal returns (address deployer) {
        vm.startBroadcast();

        (, deployer,) = vm.readCallers();
    }

    function _stopBroadcast() internal {
        vm.stopBroadcast();
    }
}
