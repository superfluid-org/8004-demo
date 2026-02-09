import { type Address } from "viem";
import { baseSepolia } from "wagmi/chains";

// ERC-8004 Identity Registry on Base Sepolia
export const IDENTITY_REGISTRY_ADDRESS: Address =
  "0x8004A818BFB912233c491871b3d84c89A494BD9e";

// Replace with deployed AgentPoolDistributor address
export const AGENT_POOL_DISTRIBUTOR_ADDRESS: Address =
  "0xb33239ef5c55cB62D83ED620C84Db992bD3107d6";

export const CHAIN = baseSepolia;

// Block at which AgentPoolDistributor was deployed
export const DEPLOY_BLOCK = BigInt(37438410);
