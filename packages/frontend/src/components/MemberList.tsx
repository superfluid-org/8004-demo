"use client";

import { useWatchContractEvent } from "wagmi";
import { useState } from "react";
import { type Address } from "viem";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { AGENT_POOL_DISTRIBUTOR_ADDRESS } from "@/config/contracts";

const isDeployed =
  AGENT_POOL_DISTRIBUTOR_ADDRESS !== "0x0000000000000000000000000000000000000000";

interface Member {
  agentId: bigint;
  wallet: Address;
}

export function MemberList() {
  const [members, setMembers] = useState<Member[]>([]);

  useWatchContractEvent({
    address: AGENT_POOL_DISTRIBUTOR_ADDRESS,
    abi: AgentPoolDistributorABI,
    eventName: "AgentJoined",
    enabled: isDeployed,
    onLogs(logs) {
      const newMembers = logs.map((log) => ({
        agentId: log.args.agentId!,
        wallet: log.args.agentWallet!,
      }));
      setMembers((prev) => {
        const existing = new Set(prev.map((m) => m.agentId.toString()));
        const unique = newMembers.filter(
          (m) => !existing.has(m.agentId.toString())
        );
        return [...prev, ...unique];
      });
    },
  });

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold text-white">Pool Members</h2>
      {!isDeployed ? (
        <p className="mt-2 text-sm text-zinc-500">
          Contract not deployed yet. Members will appear here once the pool is
          live.
        </p>
      ) : members.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">
          No members yet. Be the first to join with your ERC-8004 Agent ID.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {members.map((m) => (
            <div
              key={m.agentId.toString()}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3"
            >
              <span className="font-mono text-sm text-emerald-400">
                Agent #{m.agentId.toString()}
              </span>
              <span className="font-mono text-xs text-zinc-500">
                {m.wallet.slice(0, 6)}…{m.wallet.slice(-4)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
