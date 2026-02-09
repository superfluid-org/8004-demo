// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AgentPoolDistributor} from "../src/AgentPoolDistributor.sol";
import {ISuperfluidPool} from "../src/interfaces/ISuperfluid.sol";
import {MockIdentityRegistry} from "./mocks/MockIdentityRegistry.sol";
import {MockGDAv1Forwarder, MockSuperfluidPool} from "./mocks/MockSuperfluid.sol";

contract AgentPoolDistributorTest is Test {
    AgentPoolDistributor public distributor;
    MockIdentityRegistry public registry;
    MockGDAv1Forwarder public forwarder;
    MockSuperfluidPool public pool;

    address public deployer = makeAddr("deployer");
    address public feeCollector = makeAddr("feeCollector");
    address public agentA = makeAddr("agentA");
    address public agentB = makeAddr("agentB");
    address public agentC = makeAddr("agentC");
    address public stranger = makeAddr("stranger");

    address public constant DUMMY_SUPER_TOKEN = address(0xBEEF);
    uint256 public constant JOIN_FEE = 0.001 ether;

    function setUp() public {
        registry = new MockIdentityRegistry();
        forwarder = new MockGDAv1Forwarder();

        vm.prank(deployer);
        distributor = new AgentPoolDistributor(
            address(registry),
            address(forwarder),
            DUMMY_SUPER_TOKEN,
            feeCollector,
            JOIN_FEE
        );

        pool = forwarder.lastCreatedPool();

        // Fund test agents
        vm.deal(agentA, 10 ether);
        vm.deal(agentB, 10 ether);
        vm.deal(agentC, 10 ether);
        vm.deal(stranger, 10 ether);
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    function test_constructor_setsState() public view {
        assertEq(address(distributor.identityRegistry()), address(registry));
        assertEq(address(distributor.gdaForwarder()), address(forwarder));
        assertEq(address(distributor.pool()), address(pool));
        assertEq(distributor.joinFee(), JOIN_FEE);
        assertEq(distributor.feeCollector(), feeCollector);
        assertEq(distributor.owner(), deployer);
    }

    function test_constructor_createsPool_withContractAsAdmin() public view {
        assertEq(pool.admin(), address(distributor));
    }

    // ─── joinPool ────────────────────────────────────────────────────────────────

    function test_joinPool_happyPath() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        vm.prank(agentA);
        vm.expectEmit(true, true, false, false);
        emit AgentPoolDistributor.AgentJoined(agentId, agentA);
        distributor.joinPool{value: JOIN_FEE}(agentId);

        assertTrue(distributor.hasJoined(agentId));
        assertEq(pool.getUnits(agentA), 1);
        assertEq(pool.getTotalUnits(), 1);
        assertEq(feeCollector.balance, JOIN_FEE);
    }

    function test_joinPool_multipleAgents() public {
        vm.prank(agentA);
        uint256 idA = registry.register();
        vm.prank(agentB);
        uint256 idB = registry.register();
        vm.prank(agentC);
        uint256 idC = registry.register();

        vm.prank(agentA);
        distributor.joinPool{value: JOIN_FEE}(idA);
        vm.prank(agentB);
        distributor.joinPool{value: JOIN_FEE}(idB);
        vm.prank(agentC);
        distributor.joinPool{value: JOIN_FEE}(idC);

        assertEq(pool.getTotalUnits(), 3);
        assertEq(pool.getUnits(agentA), 1);
        assertEq(pool.getUnits(agentB), 1);
        assertEq(pool.getUnits(agentC), 1);
        assertEq(feeCollector.balance, JOIN_FEE * 3);
    }

    function test_joinPool_reverts_insufficientFee() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        vm.prank(agentA);
        vm.expectRevert(AgentPoolDistributor.InsufficientFee.selector);
        distributor.joinPool{value: JOIN_FEE - 1}(agentId);
    }

    function test_joinPool_acceptsOverpayment() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint256 overpay = JOIN_FEE * 2;
        vm.prank(agentA);
        distributor.joinPool{value: overpay}(agentId);

        assertEq(feeCollector.balance, overpay);
    }

    function test_joinPool_reverts_notAgentOwner() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        vm.prank(stranger);
        vm.expectRevert(AgentPoolDistributor.NotAgentOwner.selector);
        distributor.joinPool{value: JOIN_FEE}(agentId);
    }

    function test_joinPool_reverts_alreadyJoined() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();
        vm.prank(agentA);
        distributor.joinPool{value: JOIN_FEE}(agentId);

        vm.prank(agentA);
        vm.expectRevert(AgentPoolDistributor.AlreadyJoined.selector);
        distributor.joinPool{value: JOIN_FEE}(agentId);
    }

    function test_joinPool_reverts_agentNotRegistered() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        // Clear the wallet to simulate unset state
        registry.clearAgentWallet(agentId);

        vm.prank(agentA);
        vm.expectRevert(AgentPoolDistributor.AgentNotRegistered.selector);
        distributor.joinPool{value: JOIN_FEE}(agentId);
    }

    // ─── leavePool ───────────────────────────────────────────────────────────────

    function test_leavePool_happyPath() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();
        vm.prank(agentA);
        distributor.joinPool{value: JOIN_FEE}(agentId);

        vm.prank(agentA);
        vm.expectEmit(true, true, false, false);
        emit AgentPoolDistributor.AgentLeft(agentId, agentA);
        distributor.leavePool(agentId);

        assertFalse(distributor.hasJoined(agentId));
        assertEq(pool.getUnits(agentA), 0);
        assertEq(pool.getTotalUnits(), 0);
    }

    function test_leavePool_reverts_notAgentOwner() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();
        vm.prank(agentA);
        distributor.joinPool{value: JOIN_FEE}(agentId);

        vm.prank(stranger);
        vm.expectRevert(AgentPoolDistributor.NotAgentOwner.selector);
        distributor.leavePool(agentId);
    }

    function test_leavePool_reverts_notMember() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        vm.prank(agentA);
        vm.expectRevert(AgentPoolDistributor.NotMember.selector);
        distributor.leavePool(agentId);
    }

    function test_leavePool_fallbackToSender_whenWalletCleared() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();
        vm.prank(agentA);
        distributor.joinPool{value: JOIN_FEE}(agentId);

        // Simulate wallet being cleared (e.g., NFT transfer)
        registry.clearAgentWallet(agentId);

        vm.prank(agentA);
        distributor.leavePool(agentId);

        // Units should be removed from msg.sender (fallback)
        assertEq(pool.getUnits(agentA), 0);
        assertFalse(distributor.hasJoined(agentId));
    }

    // ─── claimSUP ────────────────────────────────────────────────────────────────

    function test_claimSUP_happyPath() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();
        vm.prank(agentA);
        distributor.joinPool{value: JOIN_FEE}(agentId);

        // Simulate accumulated distributions
        pool.setClaimable(agentA, 100 ether);

        vm.prank(agentA);
        vm.expectEmit(true, false, false, false);
        emit AgentPoolDistributor.SUPClaimed(agentA);
        distributor.claimSUP();

        // Distributions were claimed
        assertEq(pool.totalClaimed(agentA), 100 ether);
    }

    function test_claimSUP_noFeeRequired() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();
        vm.prank(agentA);
        distributor.joinPool{value: JOIN_FEE}(agentId);

        pool.setClaimable(agentA, 50 ether);

        // Claim without any ETH — should succeed
        vm.prank(agentA);
        distributor.claimSUP();

        assertEq(pool.totalClaimed(agentA), 50 ether);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────────

    function test_setJoinFee_onlyOwner() public {
        uint256 newFee = 0.002 ether;

        vm.prank(deployer);
        vm.expectEmit(false, false, false, true);
        emit AgentPoolDistributor.JoinFeeUpdated(newFee);
        distributor.setJoinFee(newFee);

        assertEq(distributor.joinFee(), newFee);
    }

    function test_setJoinFee_reverts_nonOwner() public {
        vm.prank(stranger);
        vm.expectRevert();
        distributor.setJoinFee(0.002 ether);
    }

    function test_setFeeCollector_onlyOwner() public {
        address newCollector = makeAddr("newCollector");

        vm.prank(deployer);
        vm.expectEmit(false, false, false, true);
        emit AgentPoolDistributor.FeeCollectorUpdated(newCollector);
        distributor.setFeeCollector(newCollector);

        assertEq(distributor.feeCollector(), newCollector);
    }

    function test_setFeeCollector_reverts_nonOwner() public {
        vm.prank(stranger);
        vm.expectRevert();
        distributor.setFeeCollector(makeAddr("newCollector"));
    }

    // ─── Demo flow (matches product brief 90-second demo) ────────────────────────

    function test_demoFlow() public {
        // 1. Agent A registers with ERC-8004
        vm.prank(agentA);
        uint256 idA = registry.register();

        // 2. Agent A joins pool (pays fee) -> earning 100% of distributions
        vm.prank(agentA);
        distributor.joinPool{value: JOIN_FEE}(idA);
        assertEq(pool.getTotalUnits(), 1);
        assertEq(pool.getUnits(agentA), 1);
        assertEq(feeCollector.balance, JOIN_FEE);

        // 3. Agent B registers and joins -> both earning 50%
        vm.prank(agentB);
        uint256 idB = registry.register();
        vm.prank(agentB);
        distributor.joinPool{value: JOIN_FEE}(idB);
        assertEq(pool.getTotalUnits(), 2);

        // 4. Agent C registers and joins -> all earning 33.33%
        vm.prank(agentC);
        uint256 idC = registry.register();
        vm.prank(agentC);
        distributor.joinPool{value: JOIN_FEE}(idC);
        assertEq(pool.getTotalUnits(), 3);
        assertEq(pool.getUnits(agentA), 1);
        assertEq(pool.getUnits(agentB), 1);
        assertEq(pool.getUnits(agentC), 1);
        assertEq(feeCollector.balance, JOIN_FEE * 3);

        // 5. Agent A claims -> receives accumulated SUP (no fee needed)
        pool.setClaimable(agentA, 50 ether);
        vm.prank(agentA);
        distributor.claimSUP();
        assertEq(pool.totalClaimed(agentA), 50 ether);

        // 6. Agent B leaves the pool
        vm.prank(agentB);
        distributor.leavePool(idB);
        assertEq(pool.getTotalUnits(), 2);
        assertEq(pool.getUnits(agentB), 0);
    }
}
