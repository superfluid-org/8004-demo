"use client";

import { useChainId } from "wagmi";
import { getContractConfig } from "@/config/contracts";

/**
 * Returns the contract config for the currently connected chain.
 */
export function useContractConfig() {
  const chainId = useChainId();
  return getContractConfig(chainId);
}
