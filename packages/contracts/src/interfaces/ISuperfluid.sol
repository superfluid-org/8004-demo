// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISuperfluidPool
/// @notice Minimal interface for a Superfluid GDA pool.
///         The pool admin can update member units; tokens distribute proportionally.
interface ISuperfluidPool {
    /// @notice Update the units for a pool member. Only callable by the pool admin.
    function updateMemberUnits(address memberAddr, uint128 newUnits) external returns (bool);

    /// @notice Get the current units for a pool member
    function getUnits(address memberAddr) external view returns (uint128);

    /// @notice Get the total units across all pool members
    function getTotalUnits() external view returns (uint128);
}

/// @notice Configuration for creating a GDA pool
struct PoolConfig {
    /// @dev Whether unit holders can transfer their units
    bool transferabilityForUnitsOwner;
    /// @dev Whether anyone can distribute tokens through the pool (not just the admin)
    bool distributionFromAnyAddress;
}

/// @title IGDAv1Forwarder
/// @notice Minimal interface for the Superfluid GDA v1 Forwarder.
///         Used to create pools and claim accumulated distributions.
interface IGDAv1Forwarder {
    /// @notice Create a new GDA pool for the given Super Token
    function createPool(
        address token,
        address admin,
        PoolConfig memory config
    ) external returns (bool success, ISuperfluidPool pool);

    /// @notice Claim all accumulated distributions for a pool member
    function claimAll(
        ISuperfluidPool pool,
        address memberAddr,
        bytes memory userData
    ) external returns (bool success);

    /// @notice Connect msg.sender to a pool to start receiving real-time distributions
    function connectPool(ISuperfluidPool pool, bytes memory userData)
        external
        returns (bool success);
}
