import { type Address } from "viem";
import { base, baseSepolia } from "wagmi/chains";

export const IS_DEV_MODE =
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

interface ContractConfig {
  agentPoolDistributor: Address;
  maestroPoolManager?: Address;
  identityRegistry: Address;
  deployBlock: bigint;
  subgraphUrl: string;
  rpcUrl: string;
  scanBaseUrl: string;
  registerAgentUrl: string;
  /** Additional pool addresses (Legend, Maestro) beyond the default contract pool */
  additionalPools?: Address[];
}

const contracts: Record<number, ContractConfig> = {
  [base.id]: {
    agentPoolDistributor: "0x15dcC5564908a3A2C4C7b4659055d0B9e1489A70",
    maestroPoolManager: "0x01384DA933bbD71E593763F2987148f63fa4D27C",
    identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    deployBlock: BigInt(42530672),
    subgraphUrl:
      "https://subgraph-endpoints.superfluid.dev/base-mainnet/protocol-v1",
    rpcUrl: "https://base-rpc.publicnode.com",
    scanBaseUrl: "https://8004scan.io",
    registerAgentUrl: "https://8004scan.io/create",
    additionalPools: [
      "0x72AB3a3459599Bbd2ccdE2db742565f8C50a2Cf7", // Legend Pool
      "0xBE468829E46b7fBfA4e7e82B297Fd5A7B3A4fCCC", // Maestro Pool (legacy — counts toward total distributed)
      "0xA49E4B32104893B4e84ea79AeE8F5AC7F8e5f8bd", // Maestro Pool (new, via MaestroPoolManager)
    ],
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
