// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MaestroPoolManager} from "../src/MaestroPoolManager.sol";
import {ISuperfluidPool} from "../src/interfaces/ISuperfluid.sol";
import {Lib8004ScoreCCIPViewer} from "poc-ccip-8004/src/Lib8004ScoreCCIPViewer.sol";
import {MockIdentityRegistry} from "./mocks/MockIdentityRegistry.sol";
import {MockGDAv1Forwarder, MockSuperfluidPool} from "./mocks/MockSuperfluid.sol";

contract MaestroPoolManagerTest is Test {
    MaestroPoolManager public manager;
    MockIdentityRegistry public registry;
    MockGDAv1Forwarder public forwarder;
    MockSuperfluidPool public pool;

    uint256 signerPk;
    address signer;

    address public owner = makeAddr("owner");
    address public feeCollector = makeAddr("feeCollector");
    address public agentA = makeAddr("agentA");
    address public agentB = makeAddr("agentB");
    address public agentC = makeAddr("agentC");
    address public stranger = makeAddr("stranger");

    address public constant DUMMY_SUPER_TOKEN = address(0xBEEF);
    uint256 public constant JOIN_FEE = 0.0001 ether;
    uint256 public constant MIN_SCORE = 5000;

    function setUp() public {
        // Realistic timestamp
        vm.warp(1_700_000_000);

        // Generate test signer keypair
        (signer, signerPk) = makeAddrAndKey("8004-test-signer");

        registry = new MockIdentityRegistry();
        forwarder = new MockGDAv1Forwarder();

        manager = new MaestroPoolManager(
            address(registry), address(forwarder), DUMMY_SUPER_TOKEN, owner, feeCollector
        );

        pool = forwarder.lastCreatedPool();

        // Find the auto-deployed library and patch TRUSTED_SIGNER to our test key
        address libAddr = _findLinkedLibrary(address(manager));
        _patchSigner(libAddr, Lib8004ScoreCCIPViewer.TRUSTED_SIGNER, signer);

        // Fund test accounts
        vm.deal(agentA, 10 ether);
        vm.deal(agentB, 10 ether);
        vm.deal(agentC, 10 ether);
        vm.deal(stranger, 10 ether);
    }

    // ─── Bytecode patching helpers ───────────────────────────────────────────────

    function _findLinkedLibrary(address target) internal view returns (address) {
        bytes memory code = target.code;
        for (uint256 i = 0; i < code.length - 20; i++) {
            if (uint8(code[i]) == 0x73) {
                address candidate;
                assembly {
                    candidate := shr(96, mload(add(add(code, 33), i)))
                }
                if (candidate != address(0) && candidate != target && candidate.code.length > 0) {
                    return candidate;
                }
            }
        }
        revert("Linked library not found in bytecode");
    }

    function _patchSigner(address lib, address oldSigner, address newSigner) internal {
        bytes memory code = lib.code;
        bytes20 needle = bytes20(oldSigner);
        bytes20 replacement = bytes20(newSigner);
        bool patched = false;

        for (uint256 i = 0; i <= code.length - 20; i++) {
            bool found = true;
            for (uint256 k = 0; k < 20; k++) {
                if (code[i + k] != needle[k]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                for (uint256 k = 0; k < 20; k++) {
                    code[i + k] = replacement[k];
                }
                patched = true;
            }
        }

        require(patched, "TRUSTED_SIGNER not found in library bytecode");
        vm.etch(lib, code);
    }

    // ─── EIP-712 signing helpers ─────────────────────────────────────────────────

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("ScoreOracle"),
                keccak256("1"),
                block.chainid,
                address(manager)
            )
        );
    }

    function _sign(address requester, uint256 agentId, uint256 score, uint64 computedAt)
        internal
        view
        returns (bytes memory)
    {
        bytes32 structHash = keccak256(
            abi.encode(Lib8004ScoreCCIPViewer.SCORE_TYPEHASH, requester, agentId, score, computedAt)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _buildCallback(address requester, uint256 agentId, uint256 score, uint64 computedAt)
        internal
        view
        returns (bytes memory response, bytes memory extraData)
    {
        bytes memory sig = _sign(requester, agentId, score, computedAt);
        response = abi.encode(requester, agentId, score, computedAt, sig);
        extraData = abi.encode(requester, agentId);
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    function test_constructor_setsState() public view {
        assertEq(address(manager.identityRegistry()), address(registry));
        assertEq(address(manager.gdaForwarder()), address(forwarder));
        assertEq(address(manager.pool()), address(pool));
        assertEq(manager.owner(), owner);
        assertEq(manager.FEE_COLLECTOR(), feeCollector);
    }

    function test_constructor_createsPool_withContractAsAdmin() public view {
        assertEq(pool.admin(), address(manager));
    }

    function test_constructor_constantsAreCorrect() public view {
        assertEq(manager.UNITS_PER_AGENT(), 10);
        assertEq(manager.MIN_SCORE(), 5000);
        assertEq(manager.MAX_SCORE_AGE(), 1 hours);
        assertEq(manager.JOIN_FEE(), 0.0001 ether);
    }

    // ─── requestMembership ───────────────────────────────────────────────────────

    function test_requestMembership_revertsWithOffchainLookup() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        vm.prank(agentA);
        vm.expectRevert(); // OffchainLookup
        manager.requestMembership(agentId);
    }

    function test_requestMembership_reverts_notAgentOwner() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        vm.prank(stranger);
        vm.expectRevert(MaestroPoolManager.NotAgentOwner.selector);
        manager.requestMembership(agentId);
    }

    function test_requestMembership_reverts_alreadyJoined() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        // Join via callback first
        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, 8000, computedAt);
        manager.membershipCallback{value: JOIN_FEE}(response, extraData);

        // Now requestMembership should revert
        vm.prank(agentA);
        vm.expectRevert(MaestroPoolManager.AlreadyJoined.selector);
        manager.requestMembership(agentId);
    }

    // ─── membershipCallback — happy path ─────────────────────────────────────────

    function test_membershipCallback_happyPath() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint256 score = 8000; // above MIN_SCORE (5000)
        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, score, computedAt);

        vm.expectEmit(true, true, false, true);
        emit MaestroPoolManager.AgentJoined(agentId, agentA, score);

        manager.membershipCallback{value: JOIN_FEE}(response, extraData);

        assertTrue(manager.hasJoined(agentId));
        assertEq(pool.getUnits(agentA), 10);
        assertEq(pool.getTotalUnits(), 10);
        assertEq(feeCollector.balance, JOIN_FEE);
    }

    function test_membershipCallback_multipleAgents() public {
        vm.prank(agentA);
        uint256 idA = registry.register();
        vm.prank(agentB);
        uint256 idB = registry.register();
        vm.prank(agentC);
        uint256 idC = registry.register();

        uint64 computedAt = uint64(block.timestamp);

        (bytes memory respA, bytes memory extraA) = _buildCallback(agentA, idA, 9000, computedAt);
        manager.membershipCallback{value: JOIN_FEE}(respA, extraA);

        (bytes memory respB, bytes memory extraB) = _buildCallback(agentB, idB, 7500, computedAt);
        manager.membershipCallback{value: JOIN_FEE}(respB, extraB);

        (bytes memory respC, bytes memory extraC) = _buildCallback(agentC, idC, 5000, computedAt);
        manager.membershipCallback{value: JOIN_FEE}(respC, extraC);

        assertEq(pool.getTotalUnits(), 30);
        assertEq(pool.getUnits(agentA), 10);
        assertEq(pool.getUnits(agentB), 10);
        assertEq(pool.getUnits(agentC), 10);
        assertEq(feeCollector.balance, JOIN_FEE * 3);
    }

    function test_membershipCallback_exactMinScore() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, MIN_SCORE, computedAt);

        manager.membershipCallback{value: JOIN_FEE}(response, extraData);

        assertTrue(manager.hasJoined(agentId));
    }

    function test_membershipCallback_acceptsOverpayment() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, 8000, computedAt);

        uint256 overpay = JOIN_FEE * 5;
        manager.membershipCallback{value: overpay}(response, extraData);

        assertEq(feeCollector.balance, overpay);
        assertTrue(manager.hasJoined(agentId));
    }

    // ─── membershipCallback — reverts ────────────────────────────────────────────

    function test_membershipCallback_reverts_insufficientFee() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, 8000, computedAt);

        vm.expectRevert(MaestroPoolManager.InsufficientFee.selector);
        manager.membershipCallback{value: JOIN_FEE - 1}(response, extraData);
    }

    function test_membershipCallback_reverts_zeroFee() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, 8000, computedAt);

        vm.expectRevert(MaestroPoolManager.InsufficientFee.selector);
        manager.membershipCallback(response, extraData);
    }

    function test_membershipCallback_reverts_scoreBelowMinimum() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint256 lowScore = 4999;
        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, lowScore, computedAt);

        vm.expectRevert(abi.encodeWithSelector(MaestroPoolManager.ScoreBelowMinimum.selector, lowScore, MIN_SCORE));
        manager.membershipCallback{value: JOIN_FEE}(response, extraData);
    }

    function test_membershipCallback_reverts_zeroScore() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, 0, computedAt);

        vm.expectRevert(abi.encodeWithSelector(MaestroPoolManager.ScoreBelowMinimum.selector, 0, MIN_SCORE));
        manager.membershipCallback{value: JOIN_FEE}(response, extraData);
    }

    function test_membershipCallback_reverts_notAgentOwner() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        // Sign with agentA as requester but agentA doesn't own it anymore
        // (we simulate by signing for stranger who doesn't own it)
        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(stranger, agentId, 8000, computedAt);

        vm.expectRevert(MaestroPoolManager.NotAgentOwner.selector);
        manager.membershipCallback{value: JOIN_FEE}(response, extraData);
    }

    function test_membershipCallback_reverts_alreadyJoined() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, 8000, computedAt);

        manager.membershipCallback{value: JOIN_FEE}(response, extraData);

        // Try joining again
        vm.expectRevert(MaestroPoolManager.AlreadyJoined.selector);
        manager.membershipCallback{value: JOIN_FEE}(response, extraData);
    }

    function test_membershipCallback_reverts_agentNotRegistered() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        // Clear the wallet
        registry.clearAgentWallet(agentId);

        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, 8000, computedAt);

        vm.expectRevert(MaestroPoolManager.AgentNotRegistered.selector);
        manager.membershipCallback{value: JOIN_FEE}(response, extraData);
    }

    function test_membershipCallback_reverts_staleScore() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        // Score computed 2 hours ago (exceeds MAX_SCORE_AGE of 1 hour)
        uint64 computedAt = uint64(block.timestamp - 2 hours);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, 8000, computedAt);

        vm.expectRevert(Lib8004ScoreCCIPViewer.SCORE_TOO_OLD.selector);
        manager.membershipCallback{value: JOIN_FEE}(response, extraData);
    }

    function test_membershipCallback_reverts_badSignature() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint256 score = 8000;
        uint64 computedAt = uint64(block.timestamp);

        // Sign with a different key
        uint256 fakePk = 0xDEAD;
        bytes32 structHash = keccak256(
            abi.encode(Lib8004ScoreCCIPViewer.SCORE_TYPEHASH, agentA, agentId, score, computedAt)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(fakePk, digest);
        bytes memory fakeSig = abi.encodePacked(r, s, v);

        bytes memory response = abi.encode(agentA, agentId, score, computedAt, fakeSig);
        bytes memory extraData = abi.encode(agentA, agentId);

        vm.expectRevert(Lib8004ScoreCCIPViewer.BAD_SIG.selector);
        manager.membershipCallback{value: JOIN_FEE}(response, extraData);
    }

    function test_membershipCallback_reverts_tamperedScore() public {
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint256 realScore = 4000; // below min
        uint64 computedAt = uint64(block.timestamp);

        // Sign for the low score
        bytes memory sig = _sign(agentA, agentId, realScore, computedAt);

        // Tamper: submit a high score with the signature for the low score
        uint256 tamperedScore = 9000;
        bytes memory response = abi.encode(agentA, agentId, tamperedScore, computedAt, sig);
        bytes memory extraData = abi.encode(agentA, agentId);

        vm.expectRevert(Lib8004ScoreCCIPViewer.BAD_SIG.selector);
        manager.membershipCallback{value: JOIN_FEE}(response, extraData);
    }

    // ─── batchUpdateMembers (admin) ──────────────────────────────────────────────

    function test_batchUpdateMembers_happyPath() public {
        address[] memory members = new address[](2);
        members[0] = agentA;
        members[1] = agentB;

        uint256[] memory agentIds = new uint256[](2);
        agentIds[0] = 100;
        agentIds[1] = 200;

        uint128[] memory units = new uint128[](2);
        units[0] = 20;
        units[1] = 30;

        vm.prank(owner);
        manager.batchUpdateMembers(agentIds, members, units);

        assertEq(pool.getUnits(agentA), 20);
        assertEq(pool.getUnits(agentB), 30);
        assertEq(pool.getTotalUnits(), 50);
        assertTrue(manager.hasJoined(100));
        assertTrue(manager.hasJoined(200));
    }

    function test_batchUpdateMembers_reverts_nonOwner() public {
        address[] memory members = new address[](1);
        members[0] = agentA;

        uint256[] memory agentIds = new uint256[](1);
        agentIds[0] = 1;

        uint128[] memory units = new uint128[](1);
        units[0] = 10;

        vm.prank(stranger);
        vm.expectRevert();
        manager.batchUpdateMembers(agentIds, members, units);
    }

    function test_batchUpdateMembers_reverts_lengthMismatch_members() public {
        address[] memory members = new address[](2);
        members[0] = agentA;
        members[1] = agentB;

        uint256[] memory agentIds = new uint256[](1);
        agentIds[0] = 1;

        uint128[] memory units = new uint128[](2);
        units[0] = 10;
        units[1] = 20;

        vm.prank(owner);
        vm.expectRevert();
        manager.batchUpdateMembers(agentIds, members, units);
    }

    function test_batchUpdateMembers_reverts_lengthMismatch_units() public {
        address[] memory members = new address[](2);
        members[0] = agentA;
        members[1] = agentB;

        uint256[] memory agentIds = new uint256[](2);
        agentIds[0] = 1;
        agentIds[1] = 2;

        uint128[] memory units = new uint128[](1);
        units[0] = 10;

        vm.prank(owner);
        vm.expectRevert();
        manager.batchUpdateMembers(agentIds, members, units);
    }

    function test_batchUpdateMembers_canOverrideUnits() public {
        // First join via callback
        vm.prank(agentA);
        uint256 agentId = registry.register();

        uint64 computedAt = uint64(block.timestamp);
        (bytes memory response, bytes memory extraData) = _buildCallback(agentA, agentId, 8000, computedAt);
        manager.membershipCallback{value: JOIN_FEE}(response, extraData);
        assertEq(pool.getUnits(agentA), 10);

        // Owner overrides units
        address[] memory members = new address[](1);
        members[0] = agentA;

        uint256[] memory agentIds = new uint256[](1);
        agentIds[0] = agentId;

        uint128[] memory units = new uint128[](1);
        units[0] = 50;

        vm.prank(owner);
        manager.batchUpdateMembers(agentIds, members, units);

        assertEq(pool.getUnits(agentA), 50);
    }

    // ─── E2E flow ────────────────────────────────────────────────────────────────

    function test_e2eFlow() public {
        // 1. Three agents register with ERC-8004
        vm.prank(agentA);
        uint256 idA = registry.register();
        vm.prank(agentB);
        uint256 idB = registry.register();
        vm.prank(agentC);
        uint256 idC = registry.register();

        uint64 computedAt = uint64(block.timestamp);

        // 2. Agent A joins with high score → 100% of distributions
        (bytes memory respA, bytes memory extraA) = _buildCallback(agentA, idA, 9500, computedAt);
        manager.membershipCallback{value: JOIN_FEE}(respA, extraA);
        assertEq(pool.getTotalUnits(), 10);
        assertEq(feeCollector.balance, JOIN_FEE);

        // 3. Agent B joins → both earning 50%
        (bytes memory respB, bytes memory extraB) = _buildCallback(agentB, idB, 7000, computedAt);
        manager.membershipCallback{value: JOIN_FEE}(respB, extraB);
        assertEq(pool.getTotalUnits(), 20);

        // 4. Agent C tries to join with low score → rejected
        (bytes memory respC, bytes memory extraC) = _buildCallback(agentC, idC, 4999, computedAt);
        vm.expectRevert(abi.encodeWithSelector(MaestroPoolManager.ScoreBelowMinimum.selector, 4999, MIN_SCORE));
        manager.membershipCallback{value: JOIN_FEE}(respC, extraC);

        // Agent C not in pool
        assertFalse(manager.hasJoined(idC));
        assertEq(pool.getUnits(agentC), 0);
        assertEq(pool.getTotalUnits(), 20);

        // 5. Owner batch-updates: boost agentA, add agentC manually
        address[] memory members = new address[](2);
        members[0] = agentA;
        members[1] = agentC;

        uint256[] memory agentIds = new uint256[](2);
        agentIds[0] = idA;
        agentIds[1] = idC;

        uint128[] memory units = new uint128[](2);
        units[0] = 25; // boost A
        units[1] = 10; // manually add C

        vm.prank(owner);
        manager.batchUpdateMembers(agentIds, members, units);

        assertEq(pool.getUnits(agentA), 25);
        assertEq(pool.getUnits(agentB), 10);
        assertEq(pool.getUnits(agentC), 10);
        assertEq(pool.getTotalUnits(), 45);
        assertTrue(manager.hasJoined(idC)); // marked as joined via batch

        // Fee collector only got 2 fees (C was rejected via callback)
        assertEq(feeCollector.balance, JOIN_FEE * 2);
    }
}
