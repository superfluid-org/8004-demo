"use client";

import { useContractConfig } from "@/hooks/useContractConfig";

const ZERO = "0x0000000000000000000000000000000000000000";

export function ContractStatus() {
  const { agentPoolDistributor } = useContractConfig();

  if (agentPoolDistributor !== ZERO) return null;

  return (
    <div className="mb-8 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-6 py-4 text-center text-sm text-yellow-400">
      ⚠️ Contract not deployed yet — interactions are disabled. Pool stats will
      appear once the AgentPoolDistributor is live.
    </div>
  );
}
