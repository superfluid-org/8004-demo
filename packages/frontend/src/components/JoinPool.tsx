"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

export function JoinPool() {
  const { isConnected } = useAccount();
  const [agentId, setAgentId] = useState("");

  if (!isConnected) return null;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold text-white">Join Pool</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Enter your ERC-8004 Agent ID to join the distribution pool.
      </p>
      <div className="mt-4 flex gap-3">
        <input
          type="number"
          min="0"
          placeholder="Agent ID"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          disabled={!agentId}
          className="shrink-0 rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
        >
          Join
        </button>
      </div>
    </section>
  );
}
