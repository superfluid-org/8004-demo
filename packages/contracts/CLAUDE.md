# AgentPoolDistributor — Contracts Package

## What This Is

A Foundry-based Solidity project that bridges **ERC-8004 (Trustless Agent Identity)** with **Superfluid GDA (General Distribution Agreement)** pools. Agents register in the ERC-8004 Identity Registry, then pay a small ETH fee to join a GDA pool and receive proportional token distributions. Claims are free.

## Project Structure

```
src/
  AgentPoolDistributor.sol          # Core contract — the only production contract
  interfaces/
    IIdentityRegistry.sol           # Minimal ERC-8004 interface (ownerOf, getAgentWallet, register)
    ISuperfluid.sol                 # Minimal Superfluid interfaces (ISuperfluidPool, IGDAv1Forwarder, PoolConfig)
test/
  AgentPoolDistributor.t.sol        # 20 tests — all passing
  mocks/
    MockIdentityRegistry.sol        # Simulates ERC-8004 registry (simple mapping-based, not a real ERC-721)
    MockSuperfluid.sol              # MockGDAv1Forwarder + MockSuperfluidPool (tracks units, simulates claims)
script/
  Deploy.s.sol                      # Deployment script targeting Base Sepolia (has placeholder addresses)
```

## How It Works

### Flow

1. Agent calls `register()` on the ERC-8004 Identity Registry (external, not our contract)
2. Agent calls `joinPool(agentId)` on AgentPoolDistributor
   - Verifies `msg.sender == ownerOf(agentId)`
   - Reads `getAgentWallet(agentId)` from the registry
   - Calls `pool.updateMemberUnits(agentWallet, 1)` on the GDA pool
3. Anyone streams Super Tokens to the GDA pool — distributions split proportionally by units
4. Agent calls `claimSUP()` — tokens go to caller (no fee required)

### Key Design Decisions

- **Constructor creates the GDA pool** via `gdaForwarder.createPool()` with `address(this)` as admin. The pool address is immutable after deployment.
- **1 unit per agent** (`UNITS_PER_AGENT = 1`). Equal distribution, no weighting.
- **`distributionFromAnyAddress: true`** — anyone can stream/distribute to the pool, not just the admin.
- **Agent wallet vs owner**: Pool units are assigned to `getAgentWallet(agentId)`, not the NFT owner. In practice these are the same address after registration (ERC-8004 sets `agentWallet = msg.sender` on `register()`). The wallet gets cleared on NFT transfer — handling this is out of scope.
- **Join fee**: Agents pay an ETH fee when calling `joinPool()`. The fee is forwarded to `feeCollector`. Claims via `claimSUP()` are free.
- **`claimSUP()` claims for `msg.sender`** — this works because `agentWallet == owner` at registration time. If the agent wallet was changed via `setAgentWallet()`, there's a mismatch. Out of scope for the POC.
- **`leavePool()` fallback**: If `getAgentWallet()` returns `address(0)` (wallet cleared after transfer), falls back to `msg.sender`.

## What's Done

- [x] `AgentPoolDistributor` contract with `joinPool` (payable), `leavePool`, `claimSUP` (free)
- [x] GDA pool creation in constructor
- [x] ETH join fee mechanism with configurable fee and collector
- [x] Ownership verification against ERC-8004 Identity Registry
- [x] Admin functions: `setJoinFee`, `setFeeCollector`
- [x] Full test suite (20 tests) with mocks
- [x] Deployment script skeleton for Base Sepolia

## What's Missing (TODOs)

### Before Deploying to Base Sepolia

- [x] **GDA_FORWARDER address** in `script/Deploy.s.sol` — currently `address(0x1)`. Need the real Superfluid GDAv1Forwarder address on Base Sepolia.
- [x] **SUPER_TOKEN address** in `script/Deploy.s.sol` — currently `address(0x2)`. Need to deploy or find a dummy Super Token on Base Sepolia.
- [x] **`.env` file** with `PRIVATE_KEY` for the deployer account.

### Nice to Have (from product brief)

- [ ] Simple frontend with real-time visualization
- [ ] Batch join for multiple agents
- [ ] Demo script (`script/Demo.s.sol`) that walks through the full 90-second flow on a fork

### Out of Scope (per product brief)

- Reputation scoring / weighted units
- Handling agent wallet changes after joining
- Production security (audits, access control hardening)
- Upgradability

## External Dependencies

| Dependency | Version | What For |
|---|---|---|
| forge-std | latest | Test framework, Script base |
| openzeppelin-contracts | v5.5.0 | `Ownable` (owner-gated admin functions) |

## External Contract Addresses

| Contract | Base Sepolia | Base Mainnet |
|---|---|---|
| ERC-8004 Identity Registry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ERC-8004 Reputation Registry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Superfluid GDAv1Forwarder | `0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08` | `0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08` |
| Super Token (SUP) | `0xFd62b398DD8a233ad37156690631fb9515059d6A` | `0xa69f80524381275A7fFdb3AE01c54150644c8792` |

## ERC-8004 Interface Notes

The Identity Registry is an ERC-721 (`AgentIdentity` / `AGENT`) with ERC-7201 namespaced storage. Key behaviors relevant to this contract:

- `register()` mints to `msg.sender`, sets `agentWallet` metadata to `msg.sender`
- `ownerOf(agentId)` is standard ERC-721
- `getAgentWallet(agentId)` reads the verified wallet from metadata — **not** the same as `ownerOf`
- `agentWallet` is **cleared on NFT transfer** (the `_update` override deletes it)
- `setAgentWallet()` requires an EIP-712 signature from the new wallet
- The "agentWallet" metadata key is reserved and cannot be set via `setMetadata()`

Source: https://github.com/erc-8004/erc-8004-contracts

## Superfluid Interface Notes

The interfaces in `src/interfaces/ISuperfluid.sol` are **minimal** — only the methods this contract actually calls. The real Superfluid contracts have much larger interfaces. If you need additional Superfluid functionality, refer to the Superfluid docs rather than extending these interfaces blindly.

Key Superfluid GDA behaviors to know:
- Pool admin (this contract) calls `pool.updateMemberUnits()` directly on the pool
- Claiming is done through the forwarder: `gdaForwarder.claimAll(pool, member, "")`
- Members who haven't called `connectPool()` accumulate tokens that must be claimed
- Members who HAVE connected receive real-time streaming distributions
- `distributionFromAnyAddress: true` means anyone can distribute/stream to the pool

## Commands

```bash
forge build          # Compile
forge test           # Run all tests
forge test -vvvv     # Run with full trace output
forge fmt            # Format code
```

Deploy (once addresses are filled in):
```bash
source .env
forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast --verify
```
