import { type Address } from "viem";
import { baseSepolia } from "wagmi/chains";

// ERC-8004 Identity Registry on Base Sepolia
export const IDENTITY_REGISTRY_ADDRESS: Address =
  "0x8004A818BFB912233c491871b3d84c89A494BD9e";

// Replace with deployed AgentPoolDistributor address
export const AGENT_POOL_DISTRIBUTOR_ADDRESS: Address =
  "0xefeC3A3C466709E17899d852BEEd916a198d34e3";

export const CHAIN = baseSepolia;

// Block at which AgentPoolDistributor was deployed
export const DEPLOY_BLOCK = BigInt(37784723);
