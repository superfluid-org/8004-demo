import { type Address } from "viem";
import { base, baseSepolia } from "wagmi/chains";

export const IS_DEV_MODE =
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

interface ContractConfig {
  agentPoolDistributor: Address;
  identityRegistry: Address;
  deployBlock: bigint;
  subgraphUrl: string;
  rpcUrl: string;
  scanBaseUrl: string;
  registerAgentUrl: string;
}

const contracts: Record<number, ContractConfig> = {
  [base.id]: {
    agentPoolDistributor: "0x0000000000000000000000000000000000000000", // TODO: replace after mainnet deploy
    identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    deployBlock: BigInt(0), // TODO: replace after mainnet deploy
    subgraphUrl:
      "https://subgraph-endpoints.superfluid.dev/base-mainnet/protocol-v1",
    rpcUrl: "https://base-rpc.publicnode.com",
    scanBaseUrl: "https://8004scan.io",
    registerAgentUrl: "https://8004scan.io/create",
  },
  [baseSepolia.id]: {
    agentPoolDistributor: "0xefeC3A3C466709E17899d852BEEd916a198d34e3",
    identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    deployBlock: BigInt(37784723),
    subgraphUrl:
      "https://subgraph-endpoints.superfluid.dev/base-sepolia/protocol-v1",
    rpcUrl: "https://base-sepolia-rpc.publicnode.com",
    scanBaseUrl: "https://testnet.8004scan.io",
    registerAgentUrl: "https://testnet.8004scan.io/create",
  },
};

/**
 * Get contract config for the given chain ID.
 * Falls back to Base mainnet if chain is unsupported.
 */
export function getContractConfig(chainId: number): ContractConfig {
  return contracts[chainId] ?? contracts[base.id];
}

// Default chain (used in server components / static contexts)
export const DEFAULT_CHAIN = base;

// Re-export for backward compat during transition
export const CHAIN = IS_DEV_MODE ? baseSepolia : base;
export const AGENT_POOL_DISTRIBUTOR_ADDRESS: Address = getContractConfig(CHAIN.id).agentPoolDistributor;
export const IDENTITY_REGISTRY_ADDRESS: Address = getContractConfig(CHAIN.id).identityRegistry;
export const DEPLOY_BLOCK = getContractConfig(CHAIN.id).deployBlock;
