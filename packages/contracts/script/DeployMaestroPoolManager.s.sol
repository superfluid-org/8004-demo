// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MaestroPoolManager} from "../src/MaestroPoolManager.sol";
import {NetworkConfig} from "./config/NetworkConfig.sol";

contract DeployMaestroPoolManagerScript is Script {
    function run() external {
        NetworkConfig.DeploymentConfig memory config = NetworkConfig.getNetworkConfig(block.chainid);
        address deployer = _startBroadcast();

        console.log("Deployer           :", deployer);
        console.log("Identity Registry  :", config.identityRegistry);
        console.log("GDA Forwarder      :", config.gdaForwarder);
        console.log("Super Token        :", config.supToken);
        console.log("Owner              :", deployer);
        console.log("Fee Collector      :", config.treasury);

        MaestroPoolManager manager = new MaestroPoolManager(
            config.identityRegistry,
            config.gdaForwarder,
            config.supToken,
            deployer,
            config.treasury
        );

        console.log("MaestroPoolManager deployed at :", address(manager));
        console.log("Reward GDA Pool deployed at    :", address(manager.pool()));

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
