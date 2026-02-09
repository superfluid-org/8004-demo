"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { AGENT_POOL_DISTRIBUTOR_ADDRESS } from "@/config/contracts";

const isDeployed =
  AGENT_POOL_DISTRIBUTOR_ADDRESS !== "0x0000000000000000000000000000000000000000";

export function JoinPool() {
  const { isConnected } = useAccount();
  const [agentId, setAgentId] = useState("");

  const { data: joinFee } = useReadContract({
    address: AGENT_POOL_DISTRIBUTOR_ADDRESS,
    abi: AgentPoolDistributorABI,
    functionName: "joinFee",
    query: { enabled: isDeployed },
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function handleJoin() {
    if (!agentId) return;
    writeContract({
      address: AGENT_POOL_DISTRIBUTOR_ADDRESS,
      abi: AgentPoolDistributorABI,
      functionName: "joinPool",
      args: [BigInt(agentId)],
      value: joinFee ?? BigInt("1000000000000000"), // fallback 0.001 ETH
    });
  }

  return (
    <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Join Pool</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Enter your ERC-8004 Agent ID to join the distribution pool.
      </p>
      <div className="mt-2 text-right text-sm text-zinc-400">
        Join fee: {joinFee ? `${formatEther(joinFee)} ETH` : "0.001 ETH"}
      </div>
      <div className="mt-2 flex gap-3">
        <input
          type="number"
          min="0"
          placeholder="Agent ID"
          value={agentId}
          onChange={(e) => {
            setAgentId(e.target.value);
            if (error || isSuccess) reset();
          }}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          disabled={!agentId || !isConnected || !isDeployed || isPending || isConfirming}
          onClick={handleJoin}
          className="shrink-0 rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Confirm…" : isConfirming ? "Joining…" : "Join"}
        </button>
      </div>
      {isSuccess && (
        <p className="mt-3 text-sm text-emerald-400">
          ✓ Agent #{agentId} joined the pool!
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-400 break-all">
          {error.message.includes("NotAgentOwner")
            ? "You don't own this Agent ID."
            : error.message.includes("AlreadyJoined")
              ? "This agent has already joined."
              : error.message.includes("AgentNotRegistered")
                ? "This agent is not registered in ERC-8004."
                : error.message.includes("InsufficientFee")
                  ? "Insufficient ETH for join fee."
                  : `Error: ${error.message.slice(0, 120)}`}
        </p>
      )}
    </section>
  );
}
