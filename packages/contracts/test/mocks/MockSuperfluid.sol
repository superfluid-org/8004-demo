// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISuperfluidPool, IGDAv1Forwarder, PoolConfig} from "../../src/interfaces/ISuperfluid.sol";

/// @notice Mock Superfluid GDA pool for testing. Tracks units per member.
contract MockSuperfluidPool is ISuperfluidPool {
    address public admin;
    mapping(address => uint128) private _units;
    uint128 private _totalUnits;

    // Track "claimable" balances for testing
    mapping(address => uint256) public claimable;
    // Track claimed amounts for assertions
    mapping(address => uint256) public totalClaimed;

    constructor(address _admin) {
        admin = _admin;
    }

    function updateMemberUnits(address memberAddr, uint128 newUnits) external returns (bool) {
        require(msg.sender == admin, "not pool admin");
        uint128 oldUnits = _units[memberAddr];
        _totalUnits = _totalUnits - oldUnits + newUnits;
        _units[memberAddr] = newUnits;
        return true;
    }

    function increaseMemberUnits(address memberAddr, uint128 addedUnits) external returns (bool) {
        require(msg.sender == admin, "not pool admin");
        _units[memberAddr] += addedUnits;
        _totalUnits += addedUnits;
        return true;
    }

    function decreaseMemberUnits(address memberAddr, uint128 subtractedUnits) external returns (bool) {
        require(msg.sender == admin, "not pool admin");
        require(_units[memberAddr] >= subtractedUnits, "underflow");
        _units[memberAddr] -= subtractedUnits;
        _totalUnits -= subtractedUnits;
        return true;
    }

    function getUnits(address memberAddr) external view returns (uint128) {
        return _units[memberAddr];
    }

    function getTotalUnits() external view returns (uint128) {
        return _totalUnits;
    }

    // ─── Test helpers ────────────────────────────────────────────────────────────

    /// @dev Simulate accumulated distributions for a member
    function setClaimable(address memberAddr, uint256 amount) external {
        claimable[memberAddr] = amount;
    }

    /// @dev Called by the mock forwarder to simulate claiming
    function mockClaim(address memberAddr) external {
        uint256 amount = claimable[memberAddr];
        claimable[memberAddr] = 0;
        totalClaimed[memberAddr] += amount;
    }
}

/// @notice Mock GDA v1 Forwarder for testing. Creates MockSuperfluidPool instances.
contract MockGDAv1Forwarder is IGDAv1Forwarder {
    MockSuperfluidPool public lastCreatedPool;

    function createPool(address, /* token */ address admin, PoolConfig memory /* config */ )
        external
        returns (bool success, ISuperfluidPool pool)
    {
        MockSuperfluidPool mockPool = new MockSuperfluidPool(admin);
        lastCreatedPool = mockPool;
        return (true, ISuperfluidPool(address(mockPool)));
    }

    function claimAll(ISuperfluidPool pool, address memberAddr, bytes memory /* userData */ )
        external
        returns (bool success)
    {
        MockSuperfluidPool(address(pool)).mockClaim(memberAddr);
        return true;
    }

    function connectPool(ISuperfluidPool, /* pool */ bytes memory /* userData */ )
        external
        pure
        returns (bool success)
    {
        return true;
    }
}
