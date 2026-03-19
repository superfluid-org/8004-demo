// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IIdentityRegistry} from "./interfaces/IIdentityRegistry.sol";
import {ISuperfluidPool, IGDAv1Forwarder, PoolConfig} from "./interfaces/ISuperfluid.sol";
import {Lib8004ScoreCCIPViewer} from "poc-ccip-8004/src/Lib8004ScoreCCIPViewer.sol";

/// @title MaestroPoolManager
/// @notice Superfluid GDA pool that gates membership on a minimum 8004 classifier score.
///         Uses EIP-3668 (CCIP Read) via Lib8004ScoreCCIPViewer to fetch scores offchain,
///         verified onchain with an EIP-712 signature from the trusted 8004 gateway.
///
/// @dev Integration pattern:
///      1. Agent owner calls `requestMembership(agentId)` — always reverts with OffchainLookup
///      2. Client (Viem) catches the revert, queries the 8004 gateway
///      3. Client calls `membershipCallback(response, extraData)` with the signed score
///      4. If score >= MIN_SCORE, agent is added to the Superfluid pool
///
///      This contract is a reference integration of Lib8004ScoreCCIPViewer.
///      The library handles all CCIP Read + EIP-712 logic — this contract just acts on the result.
contract MaestroPoolManager is Ownable {
    // ─── Constants ───────────────────────────────────────────────────────────────

    /// @notice Pool units awarded to each qualifying agent
    uint128 public constant UNITS_PER_AGENT = 10;

    /// @notice Minimum 8004 score required to join the pool (scaled by 100, e.g. 5000 = 50.00)
    uint256 public constant MIN_SCORE = 5000;

    /// @notice Maximum age of a gateway-signed score (1 hour)
    uint64 public constant MAX_SCORE_AGE = 1 hours;

    // ─── Immutables ──────────────────────────────────────────────────────────────

    IIdentityRegistry public immutable identityRegistry;
    IGDAv1Forwarder public immutable gdaForwarder;
    ISuperfluidPool public immutable pool;

    // ─── State ───────────────────────────────────────────────────────────────────

    mapping(uint256 agentId => bool joined) public hasJoined;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event AgentJoined(uint256 indexed agentId, address indexed agentWallet, uint256 score);
    event AgentLeft(uint256 indexed agentId, address indexed agentWallet);
    event AgentRejected(uint256 indexed agentId, uint256 score, uint256 minScore);

    // ─── Errors ──────────────────────────────────────────────────────────────────

    error NotAgentOwner();
    error AlreadyJoined();
    error NotMember();
    error AgentNotRegistered();
    error ScoreBelowMinimum(uint256 score, uint256 minScore);
    error PoolCreationFailed();

    // ─── Constructor ─────────────────────────────────────────────────────────────

    /// @param _identityRegistry ERC-8004 Identity Registry address
    /// @param _gdaForwarder     Superfluid GDA v1 Forwarder address
    /// @param _superToken       Super Token that the pool distributes
    /// @param _owner            Contract owner (admin)
    constructor(
        address _identityRegistry,
        address _gdaForwarder,
        address _superToken,
        address _owner
    ) Ownable(_owner) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        gdaForwarder = IGDAv1Forwarder(_gdaForwarder);

        PoolConfig memory config =
            PoolConfig({transferabilityForUnitsOwner: false, distributionFromAnyAddress: true});

        (bool success, ISuperfluidPool _pool) =
            gdaForwarder.createPool(_superToken, address(this), config);
        if (!success) revert PoolCreationFailed();
        pool = _pool;
    }

    // ─── EIP-3668: Request (always reverts) ──────────────────────────────────────

    /// @notice Initiate the CCIP Read flow to fetch the agent's 8004 score.
    /// @dev Always reverts with OffchainLookup. The client catches this, queries the
    ///      8004 gateway, and calls membershipCallback with the signed response.
    /// @param agentId The ERC-8004 agent identity token ID
    function requestMembership(uint256 agentId) external view {
        if (identityRegistry.ownerOf(agentId) != msg.sender) revert NotAgentOwner();
        if (hasJoined[agentId]) revert AlreadyJoined();

        // Triggers OffchainLookup — client will call membershipCallback
        Lib8004ScoreCCIPViewer.requestScore(msg.sender, agentId, this.membershipCallback.selector);
    }

    // ─── EIP-3668: Callback (verify + gate) ──────────────────────────────────────

    /// @notice Callback invoked after the 8004 gateway returns a signed score.
    /// @dev Verifies the EIP-712 signature and checks score >= MIN_SCORE.
    ///      If qualified, adds the agent's wallet to the Superfluid pool.
    /// @param response   ABI-encoded gateway response (requester, agentId, score, computedAt, sig)
    /// @param extraData  Original request data for cross-check (requester, agentId)
    function membershipCallback(bytes calldata response, bytes calldata extraData) external {
        (address requester, uint256 agentId, uint256 score,) =
            Lib8004ScoreCCIPViewer.verifyAndDecodeScore(response, extraData, MAX_SCORE_AGE);

        // Verify ownership again in callback (requester came from signed payload)
        if (identityRegistry.ownerOf(agentId) != requester) revert NotAgentOwner();

        // Score gate
        if (score < MIN_SCORE) {
            emit AgentRejected(agentId, score, MIN_SCORE);
            revert ScoreBelowMinimum(score, MIN_SCORE);
        }

        address agentWallet = identityRegistry.getAgentWallet(agentId);
        if (agentWallet == address(0)) revert AgentNotRegistered();

        pool.increaseMemberUnits(agentWallet, UNITS_PER_AGENT);
        hasJoined[agentId] = true;

        emit AgentJoined(agentId, agentWallet, score);
    }

    // ─── Leave ───────────────────────────────────────────────────────────────────

    /// @notice Leave the pool. Removes the agent's units.
    /// @param agentId The ERC-8004 agent identity token ID
    function leavePool(uint256 agentId) external {
        if (identityRegistry.ownerOf(agentId) != msg.sender) revert NotAgentOwner();
        if (!hasJoined[agentId]) revert NotMember();

        address agentWallet = identityRegistry.getAgentWallet(agentId);
        if (agentWallet == address(0)) agentWallet = msg.sender;

        pool.decreaseMemberUnits(agentWallet, UNITS_PER_AGENT);
        hasJoined[agentId] = false;

        emit AgentLeft(agentId, agentWallet);
    }

    // ─── View ────────────────────────────────────────────────────────────────────

    /// @notice Returns the minimum score required (human-readable, 2 decimals)
    /// @return The minimum score scaled by 100 (e.g. 5000 = 50.00)
    function minScore() external pure returns (uint256) {
        return MIN_SCORE;
    }
}
