// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IIdentityRegistry
/// @notice Minimal interface for the ERC-8004 Identity Registry.
///         The full contract is an ERC-721 (AgentIdentity / AGENT) with metadata and wallet management.
///         See: https://github.com/erc-8004/erc-8004-contracts
interface IIdentityRegistry {
    /// @notice Emitted when a new agent is registered
    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);

    /// @notice Register a new agent identity (mints ERC-721 to msg.sender)
    function register() external returns (uint256 agentId);

    /// @notice Register with a URI
    function register(string memory agentURI) external returns (uint256 agentId);

    /// @notice Returns the owner of the agent NFT (ERC-721 ownerOf)
    function ownerOf(uint256 agentId) external view returns (address);

    /// @notice Returns the verified wallet address for an agent.
    ///         Set to msg.sender on registration. Cleared on NFT transfer.
    function getAgentWallet(uint256 agentId) external view returns (address);
}
