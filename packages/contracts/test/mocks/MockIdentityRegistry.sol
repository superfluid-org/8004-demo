// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IIdentityRegistry} from "../../src/interfaces/IIdentityRegistry.sol";

/// @notice Minimal mock of the ERC-8004 Identity Registry for testing.
///         Simulates register(), ownerOf(), and getAgentWallet().
contract MockIdentityRegistry is IIdentityRegistry {
    uint256 private _nextId = 1;

    mapping(uint256 => address) private _owners;
    mapping(uint256 => address) private _wallets;

    function register() external returns (uint256 agentId) {
        agentId = _nextId++;
        _owners[agentId] = msg.sender;
        _wallets[agentId] = msg.sender;
        emit Registered(agentId, "", msg.sender);
    }

    function register(string memory agentURI) external returns (uint256 agentId) {
        agentId = _nextId++;
        _owners[agentId] = msg.sender;
        _wallets[agentId] = msg.sender;
        emit Registered(agentId, agentURI, msg.sender);
    }

    function ownerOf(uint256 agentId) external view returns (address) {
        address owner = _owners[agentId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _wallets[agentId];
    }

    // ─── Test helpers ────────────────────────────────────────────────────────────

    /// @dev Force-clear the agent wallet (simulates NFT transfer behavior)
    function clearAgentWallet(uint256 agentId) external {
        _wallets[agentId] = address(0);
    }
}
