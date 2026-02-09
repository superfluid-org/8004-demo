// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IIdentityRegistry} from "./interfaces/IIdentityRegistry.sol";
import {ISuperfluidPool, IGDAv1Forwarder, PoolConfig} from "./interfaces/ISuperfluid.sol";

/// @title AgentPoolDistributor
/// @notice Connects ERC-8004 registered agents to a Superfluid GDA pool.
///         Agents register with the Identity Registry, then call joinPool() to receive
///         pool units. Streams to the pool auto-distribute to all members.
///         Agents pay a small ETH fee when joining the pool. Claims are free.
/// @dev The contract creates and administers a GDA pool. Only verified agent owners
///      (checked against the Identity Registry) can join or leave.
contract AgentPoolDistributor is Ownable {
    // ─── State ───────────────────────────────────────────────────────────────────

    IIdentityRegistry public immutable identityRegistry;
    IGDAv1Forwarder public immutable gdaForwarder;
    ISuperfluidPool public immutable pool;

    uint128 public constant UNITS_PER_AGENT = 1;
    uint256 public joinFee;
    address public feeCollector;

    mapping(uint256 agentId => bool joined) public hasJoined;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event AgentJoined(uint256 indexed agentId, address indexed agentWallet);
    event AgentLeft(uint256 indexed agentId, address indexed agentWallet);
    event SUPClaimed(address indexed claimant);
    event JoinFeeUpdated(uint256 newFee);
    event FeeCollectorUpdated(address newFeeCollector);

    // ─── Errors ──────────────────────────────────────────────────────────────────

    error NotAgentOwner();
    error AlreadyJoined();
    error NotMember();
    error AgentNotRegistered();
    error InsufficientFee();
    error FeeTransferFailed();
    error PoolCreationFailed();

    // ─── Constructor ─────────────────────────────────────────────────────────────

    /// @param _identityRegistry ERC-8004 Identity Registry address
    /// @param _gdaForwarder     Superfluid GDA v1 Forwarder address
    /// @param _superToken       Super Token that the pool distributes
    /// @param _feeCollector     Address that receives ETH join fees
    /// @param _joinFee          Initial join fee in wei
    constructor(
        address _identityRegistry,
        address _gdaForwarder,
        address _superToken,
        address _feeCollector,
        uint256 _joinFee
    ) Ownable(msg.sender) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        gdaForwarder = IGDAv1Forwarder(_gdaForwarder);
        feeCollector = _feeCollector;
        joinFee = _joinFee;

        // Create GDA pool with this contract as admin
        PoolConfig memory config = PoolConfig({
            transferabilityForUnitsOwner: false,
            distributionFromAnyAddress: true
        });

        (bool success, ISuperfluidPool _pool) =
            gdaForwarder.createPool(_superToken, address(this), config);
        if (!success) revert PoolCreationFailed();
        pool = _pool;
    }

    // ─── Core ────────────────────────────────────────────────────────────────────

    /// @notice Join the GDA pool with an existing ERC-8004 agent identity.
    ///         Caller must own the agent NFT. The agent's verified wallet receives pool units.
    ///         Requires paying the join fee in ETH.
    /// @param agentId The ERC-8004 agent identity token ID
    function joinPool(uint256 agentId) external payable {
        if (msg.value < joinFee) revert InsufficientFee();
        if (identityRegistry.ownerOf(agentId) != msg.sender) revert NotAgentOwner();
        if (hasJoined[agentId]) revert AlreadyJoined();

        address agentWallet = identityRegistry.getAgentWallet(agentId);
        if (agentWallet == address(0)) revert AgentNotRegistered();

        // Forward fee to collector
        (bool sent,) = feeCollector.call{value: msg.value}("");
        if (!sent) revert FeeTransferFailed();

        pool.updateMemberUnits(agentWallet, UNITS_PER_AGENT);
        hasJoined[agentId] = true;

        emit AgentJoined(agentId, agentWallet);
    }

    /// @notice Claim accumulated tokens from the GDA pool.
    /// @dev    The caller must be a pool member (i.e., their address has units).
    function claimSUP() external {
        // Claim accumulated distributions for the caller
        gdaForwarder.claimAll(pool, msg.sender, "");

        emit SUPClaimed(msg.sender);
    }

    /// @notice Leave the GDA pool. Sets the agent's pool units to zero.
    /// @param agentId The ERC-8004 agent identity token ID
    function leavePool(uint256 agentId) external {
        if (identityRegistry.ownerOf(agentId) != msg.sender) revert NotAgentOwner();
        if (!hasJoined[agentId]) revert NotMember();

        address agentWallet = identityRegistry.getAgentWallet(agentId);
        if (agentWallet == address(0)) {
            agentWallet = msg.sender;
        }

        pool.updateMemberUnits(agentWallet, 0);
        hasJoined[agentId] = false;

        emit AgentLeft(agentId, agentWallet);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────────

    /// @notice Update the ETH fee required to join the pool
    function setJoinFee(uint256 _joinFee) external onlyOwner {
        joinFee = _joinFee;
        emit JoinFeeUpdated(_joinFee);
    }

    /// @notice Update the address that receives join fees
    function setFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);
    }
}
