// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentPoolDistributor} from "../src/AgentPoolDistributor.sol";

contract DeployScript is Script {
    // ─── Base Sepolia addresses ──────────────────────────────────────────────────

    // ERC-8004 Identity Registry (Base Sepolia)
    address constant IDENTITY_REGISTRY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;

    // Superfluid GDA v1 Forwarder (Base Sepolia) —
    address constant GDA_FORWARDER = 0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08;

    // Super Token (Base Sepolia) —
    address constant SUPER_TOKEN = 0xFd62b398DD8a233ad37156690631fb9515059d6A;

    // Claim fee: 0.0001 ETH
    uint256 constant JOIN_FEE = 0.0001 ether;

    function run() external {
        address deployer = _startBroadcast();

        console.log("Deployer:", deployer);
        console.log("Identity Registry:", IDENTITY_REGISTRY);
        console.log("GDA Forwarder:", GDA_FORWARDER);
        console.log("Super Token:", SUPER_TOKEN);
        console.log("Join Fee:", JOIN_FEE);

        AgentPoolDistributor distributor = new AgentPoolDistributor(
            IDENTITY_REGISTRY,
            GDA_FORWARDER,
            SUPER_TOKEN,
            deployer, // fee collector = deployer for now
            JOIN_FEE
        );

        console.log("AgentPoolDistributor deployed at:", address(distributor));
        console.log("GDA Pool:", address(distributor.pool()));

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
