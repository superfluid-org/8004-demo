# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A proof-of-concept integrating **ERC-8004 (Trustless Agent Identity)** with **Superfluid GDA (General Distribution Agreement)** pools. Registered AI agents join a GDA pool and receive proportional token distributions. Claiming accumulated tokens costs a small ETH fee.

Target chain: **Base Sepolia** (testnet).

## Repository Structure

Two independent packages under `packages/` (not a formal monorepo — no shared workspace config):

- **`packages/contracts/`** — Solidity + Foundry (see `packages/contracts/CLAUDE.md` for detailed contract documentation)
- **`packages/frontend/`** — Next.js 16 + React 19 + wagmi/viem/RainbowKit

## Commands

### Smart Contracts (`packages/contracts/`)

```bash
forge build                    # Compile
forge test                     # Run all 19 tests
forge test --mt testFunctionName  # Run a single test by name
forge test -vvvv               # Full trace output
forge fmt                      # Format (100 char lines, 4-space tabs)
```

Deploy (requires `.env` with `PRIVATE_KEY` and real addresses in Deploy.s.sol):
```bash
source .env && forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast --verify
```

### Frontend (`packages/frontend/`)

```bash
npm run dev      # Dev server on localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

### Core Flow

1. Agent calls `register()` on the external ERC-8004 Identity Registry
2. Agent calls `joinPool(agentId)` on our `AgentPoolDistributor` — verifies ownership, reads `getAgentWallet(agentId)`, assigns 1 GDA pool unit
3. Anyone streams Super Tokens to the GDA pool — distributions split proportionally
4. Agent calls `claimSUP()` with ETH fee — fee goes to `feeCollector`, tokens go to caller

### Smart Contracts

**`AgentPoolDistributor.sol`** is the only production contract. Key design:
- Constructor creates the GDA pool via `gdaForwarder.createPool()` (pool address is immutable)
- 1 unit per agent (equal distribution, no weighting)
- `distributionFromAnyAddress: true` — anyone can stream to the pool
- Pool units assigned to `getAgentWallet(agentId)`, not the NFT owner (same address at registration time)
- `claimSUP()` claims for `msg.sender` — works because agentWallet == owner at registration
- Inherits OpenZeppelin `Ownable` for admin functions (`setClaimFee`, `setFeeCollector`)

Interfaces in `src/interfaces/` are **minimal** — only methods this contract calls. Don't extend them without consulting Superfluid docs.

### Frontend

- **App Router** (Next.js) with single page (`src/app/page.tsx`)
- **Providers** (`src/components/Providers.tsx`): wagmi + RainbowKit + React Query
- **Components**: PoolDashboard, JoinPool, ClaimSUP, MemberList
- **Config**: Contract addresses in `src/config/contracts.ts`, chain config in `src/config/wagmi.ts`
- **ABIs**: TypeScript exports in `src/abi/`
- Path alias: `@/*` → `./src/*`

## External Contract Addresses

| Contract | Base Sepolia | Base Mainnet |
|---|---|---|
| ERC-8004 Identity Registry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ERC-8004 Reputation Registry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Superfluid GDAv1Forwarder | **TBD** | **TBD** |
| Super Token (SUP) | **TBD** | **TBD** |

## Key Dependencies

### Contracts
- Solidity 0.8.26, Foundry, forge-std, OpenZeppelin v5.5.0 (`Ownable`)
- Git submodules in `lib/` — run `forge install` if missing

### Frontend
- Next.js 16, React 19, TypeScript 5
- viem + wagmi + RainbowKit (wallet connection & contract interaction)
- Tailwind CSS 4

## Incomplete / Placeholder Values

- `AGENT_POOL_DISTRIBUTOR_ADDRESS` in `src/config/contracts.ts` is `0x0000...` — needs real deployed address
- `GDA_FORWARDER` and `SUPER_TOKEN` in `script/Deploy.s.sol` are placeholders
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` env var needed for frontend
