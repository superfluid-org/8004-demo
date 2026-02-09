// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentPoolDistributor} from "../src/AgentPoolDistributor.sol";

contract DeployScript is Script {
    // ─── Base Sepolia addresses ──────────────────────────────────────────────────

    // ERC-8004 Identity Registry (Base Sepolia)
    address constant IDENTITY_REGISTRY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;

    // Superfluid GDA v1 Forwarder (Base Sepolia) — TODO: replace with actual address
    address constant GDA_FORWARDER = address(0x1);

    // Super Token (Base Sepolia) — TODO: replace with actual/dummy SUP token address
    address constant SUPER_TOKEN = address(0x2);

    // Claim fee: 0.001 ETH
    uint256 constant CLAIM_FEE = 0.001 ether;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Identity Registry:", IDENTITY_REGISTRY);
        console.log("GDA Forwarder:", GDA_FORWARDER);
        console.log("Super Token:", SUPER_TOKEN);
        console.log("Claim Fee:", CLAIM_FEE);

        vm.startBroadcast(deployerPrivateKey);

        AgentPoolDistributor distributor = new AgentPoolDistributor(
            IDENTITY_REGISTRY,
            GDA_FORWARDER,
            SUPER_TOKEN,
            deployer, // fee collector = deployer for now
            CLAIM_FEE
        );

        console.log("AgentPoolDistributor deployed at:", address(distributor));
        console.log("GDA Pool:", address(distributor.pool()));

        vm.stopBroadcast();
    }
}
