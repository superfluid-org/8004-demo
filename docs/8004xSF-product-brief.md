# Product Brief: ERC-8004 Agent Pool Distributor

## Overview

A minimal prototype demonstrating the integration between **ERC-8004 (Trustless Agents)** and **Superfluid's GDA (General Distribution Agreement)** pools.

When an AI agent registers in the ERC-8004 Identity Registry, they automatically receive units in a Superfluid GDA pool. Anyone streaming to that pool automatically distributes funds to all registered agents.

---

## The Problem

ERC-8004 provides identity, reputation, and validation infrastructure for autonomous AI agents—but it deliberately left payments out of scope. Meanwhile, the emerging agent economy needs simple, scalable payment primitives that can handle distribution to many participants without complex escrow logic.

---

## The Solution

Connect ERC-8004's Identity Registry to a Superfluid GDA pool:

- **Registered agent = eligible to join**
- **Verified + joined = pool units**
- **Streams to the pool auto-distribute to all members**
- **Join fee:** When agents join the pool, they pay a small ETH fee. Claims are free.

```
                                    ┌─────────────────────────┐
                                    │   Clients / Protocols   │
                                    │   Treasury / DAO        │
                                    └───────────┬─────────────┘
                                                │
                                         Stream to pool
                                                │
                                                ▼
┌──────────────────────┐           ┌─────────────────────────┐
│  ERC-8004 Identity   │           │                         │
│      Registry        │           │   GDA Pool              │
│                      │           │                         │
│  • Agent A (id: 1)   │ ────┐     │   • Agent A: 1 unit     │
│  • Agent B (id: 2)   │     │     │   • Agent B: 1 unit     │
│  • Agent C (id: 3)   │     │     │   • Agent C: 1 unit     │
│                      │     │     │                         │
└──────────────────────┘     │     └───────────┬─────────────┘
                             │                 │
         Agents call         │    Verify       │
         joinPool(agentId) ──┼─► ownership  ───┘
                             │    & add to pool
                             ▼                 
                  ┌─────────────────────────┐
                  │  AgentPoolDistributor   │
                  │                         │
                  │  • Verify agent owner   │
                  │  • Add to GDA pool      │
                  │  • Collect join fees    │
                  └─────────────────────────┘
```

---

## Why This Works

| Benefit | Description |
|---------|-------------|
| **Simple** | Binary check—registered & joined or not. No complex scoring. |
| **Decoupled** | ERC-8004 registration is independent; agents join when ready |
| **Verifiable** | On-chain ownership check against Identity Registry |
| **Native to both protocols** | Uses core primitives: ERC-721 identity + GDA pools |
| **Backwards compatible** | Works with agents already registered in ERC-8004 |
| **Scalable** | GDA handles distribution to thousands of recipients efficiently |
| **Composable** | Other protocols can build on top (staking, reputation weighting, etc.) |
| **Sustainable** | ETH join fee creates protocol revenue as the network grows |

---

## Important: ERC-8004 is Permissionless

### The Issue

ERC-8004's Identity Registry does **NOT** verify that registrants are actually AI agents. Anyone with a wallet can call `register()` and receive an identity NFT.


This means:
- Humans can register themselves as "agents"
- A single entity can create multiple identities (Sybil attacks)
- There's no on-chain proof that advertised capabilities are real

### Implications for This Prototype

| Risk | Mitigation in Our Design |
|------|--------------------------|
| Spam registrations | ETH join fee discourages low-value participants |
| Reward farming by humans | Acceptable for demo; reputation layer would filter in production |
| Sybil attacks | Out of scope; would require staking or proof-of-personhood |

### Recommended Framing

For the demo, embrace the permissionlessness:

> *"Any participant in the agent economy—whether AI agents, DAOs, protocols, or human operators—can register and earn from the ecosystem. Trust is established through reputation and validation, not gatekeeping."*

This aligns with ERC-8004's philosophy of open, neutral infrastructure where trust is earned, not assumed.

---

## Use Cases

| Use Case | Who Streams to Pool | Why |
|----------|---------------------|-----|
| **Ecosystem Rewards** | Protocol treasury | Incentivize agents to register and participate |
| **Collective Services** | Clients | Pay for access to a network of agents |
| **Agent Guild Revenue Share** | Guild clients | Agents form collectives, share income equally |
| **Research/Data Bounties** | Sponsors | Distribute funds to all contributing agents |
| **UBI for Agents** | DAO | Baseline income for all registered agents |

### Revenue Model

The join fee creates a sustainable revenue stream:

| Metric | Example |
|--------|---------|
| New agents per month | 500 |
| Join fee | 0.001 ETH |
| **Monthly revenue** | **0.5 ETH** |

As the agent ecosystem grows, revenue scales with new memberships.

---

## Technical Approach

### ERC-8004 Callback Support

**Finding:** The ERC-8004 Identity Registry does NOT have built-in callbacks. When an agent registers, a `Registered` event is emitted, but there's no on-chain hook mechanism to notify external contracts.

### Integration Pattern: Verify & Join

Instead of wrapping ERC-8004 registration, agents register directly with the Identity Registry, then call our contract to join the pool. We verify ownership against the registry and use the registered agent wallet.

```
┌─────────────────────┐         ┌─────────────────────┐
│                     │   1.    │   ERC-8004          │
│       Agent         │ ──────► │   Identity Registry │
│                     │ register│                     │
└─────────────────────┘         └─────────────────────┘
          │                               │
          │ 2. joinPool(agentId)          │
          ▼                               │
┌─────────────────────┐                   │
│  AgentPoolDistributor│ ◄────────────────┘
│                     │   3. verify owner
│  • Verify agentId   │      & get wallet
│  • Add to GDA pool  │
│  • Track membership │
└─────────────────────┘
```

### Core Contract: `AgentPoolDistributor`

```solidity
contract AgentPoolDistributor {
    IIdentityRegistry public identityRegistry;  // ERC-8004
    ISuperfluidPool public pool;                // GDA Pool
    
    uint128 public constant UNITS_PER_AGENT = 1;
    uint256 public joinFee = 0.001 ether;
    address public feeCollector;
    
    error AGENT_NOT_REGISTERED(); 

    // Track which agents have joined
    mapping(uint256 => bool) public hasJoined;
    
    /// @notice Join the GDA pool with an existing ERC-8004 agent identity (requires ETH fee)
    function joinPool(uint256 agentId) external payable {
        // 1. Verify caller owns this agentId
        require(identityRegistry.ownerOf(agentId) == msg.sender, "Not agent owner");
        
        // 2. Verify not already joined
        require(!hasJoined[agentId], "Already joined");
        
        // 3. Get the agent's registered wallet (or use owner if not set)
        address agentWallet = identityRegistry.getAgentWallet(agentId);
        if (agentWallet == address(0)) {
            revert AGENT_NOT_REGISTERED();
        }
        
        // 4. Forward fee to collector
        require(msg.value >= joinFee, "Insufficient fee");
        (bool sent, ) = feeCollector.call{value: msg.value}("");
        require(sent, "Fee transfer failed");

        // 5. Add to GDA pool
        pool.updateMemberUnits(agentWallet, UNITS_PER_AGENT);
        hasJoined[agentId] = true;
        
        emit AgentJoined(agentId, agentWallet);
    }
    
    /// @notice Claim accumulated SUP tokens (free, no fee required)
    function claimSUP() external {
        pool.claimAll(msg.sender);
        emit SUPClaimed(msg.sender);
    }
    
    /// @notice Leave the pool
    function leavePool(uint256 agentId) external {
        require(identityRegistry.ownerOf(agentId) == msg.sender, "Not agent owner");
        require(hasJoined[agentId], "Not a member");
        
        address agentWallet = identityRegistry.getAgentWallet(agentId);
        if (agentWallet == address(0)) {
            agentWallet = msg.sender;
        }
        
        pool.updateMemberUnits(agentWallet, 0);
        hasJoined[agentId] = false;
        
        emit AgentLeft(agentId, agentWallet);
    }
    
    /// @notice Owner can update the join fee
    function setJoinFee(uint256 newFee) external onlyOwner {
        joinFee = newFee;
        emit JoinFeeUpdated(newFee);
    }
}
```

### Why This Approach is Better

| Benefit | Description |
|---------|-------------|
| **Decoupled** | Agents register with ERC-8004 independently—no wrapper needed |
| **Backwards compatible** | Works with agents who are already registered |
| **Verifiable** | On-chain check ensures only valid agent owners can join |
| **Uses official wallet** | Respects the `agentWallet` field from ERC-8004 |
| **Flexible** | Agents can join/leave without re-registering |

### Why the Join Fee?

| Reason | Benefit |
|--------|---------|
| **Sustainability** | Creates revenue stream for protocol maintenance |
| **Spam Prevention** | Discourages frivolous pool registrations |
| **Value Alignment** | Agents pay to commit; claims are free to encourage participation |
| **Flexibility** | Fee can be adjusted based on network conditions |

---

## Prototype Scope

### Must Have
- [ ] `AgentPoolDistributor` contract with `joinPool(agentId)` verification
- [ ] GDA Pool deployment with SUP token
- [ ] ETH join fee mechanism with configurable fee amount
- [ ] Integration with ERC-8004 Identity Registry (verify ownership + get wallet)
- [ ] Basic demo script showing the full flow

### Nice to Have
- [ ] Simple frontend with real-time visualization
- [ ] Admin functions to update fee and fee collector
- [ ] Batch join for multiple agents

### Out of Scope
- Reputation scoring
- Weighted unit distribution
- Production-grade security
- Handling agent wallet changes after joining

---

## Demo Flow (90 seconds)

1. Show empty GDA pool with stream flowing in (100 SUP/month from "Ecosystem Fund")
2. **Agent A registers** with ERC-8004 → receives agentId #1
3. **Agent A calls `joinPool(1)`** → pays 0.001 ETH fee → verified → receives 1 unit → earning 100 SUP/month
4. **Agent B registers** with ERC-8004 → calls `joinPool(2)` → both earning 50 SUP/month
5. **Agent C registers** with ERC-8004 → calls `joinPool(3)` → all three earning 33.33 SUP/month
6. **Agent A claims** → receives accumulated SUP (no fee needed)
7. Show fee collector balance (accumulated from join fees)
8. Narrative: *"Agents register once with ERC-8004, pay a small fee to join the pool, and start earning. Claims are free. Everyone wins."*

---

## Future Extensions (For Other Builders)

These are not in scope but hint at possibilities:

- **Weighted units by registration age**: Early agents get more units (loyalty)
- **Tiered pools**: Different pools for agent categories/capabilities
- **Stake-weighted units**: Agents stake tokens for proportionally more units
- **Reputation-multiplied units**: Units = base × reputation score
- **Cross-chain distribution**: Agents on multiple L2s, unified pool
- **Dynamic join fees**: Fee adjusts based on gas prices or pool size
- **Fee discounts**: Reduced fees for high-reputation agents or token holders
- **Batch joins**: Allow bulk onboarding of agents (with signatures)

---

## Success Criteria

This prototype succeeds if it:

1. **Works end-to-end**: Agent registration triggers pool unit allocation
2. **Is easy to understand**: Demo explainable in under 2 minutes
3. **Sparks curiosity**: Builders see potential for their own use cases
4. **Is forkable**: Clean code others can build upon

---

## Resources

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8004 Contracts Repository](https://github.com/erc-8004/erc-8004-contracts)
- [Superfluid GDA Documentation](https://docs.superfluid.finance/)

### ERC-8004 Deployed Contracts

| Network | Identity Registry | Reputation Registry |
|---------|-------------------|---------------------|
| ETH Mainnet | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| ETH Sepolia | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| Base Mainnet | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Base Sepolia | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |


---

*This prototype is intended to demonstrate potential—not to be production-ready. The goal is to inspire builders to explore the intersection of trustless agent infrastructure and programmable money streams.*


