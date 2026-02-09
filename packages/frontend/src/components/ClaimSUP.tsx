"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { AGENT_POOL_DISTRIBUTOR_ADDRESS } from "@/config/contracts";

const isDeployed =
  AGENT_POOL_DISTRIBUTOR_ADDRESS !== "0x0000000000000000000000000000000000000000";

export function ClaimSUP() {
  const { isConnected } = useAccount();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function handleClaim() {
    writeContract({
      address: AGENT_POOL_DISTRIBUTOR_ADDRESS,
      abi: AgentPoolDistributorABI,
      functionName: "claimSUP",
    });
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold text-white">Claim SUP</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Claim your accumulated SUP tokens. No fee required.
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Accumulated</p>
          <p className="text-xl font-semibold text-emerald-400">-- SUP</p>
        </div>
      </div>
      <button
        disabled={!isConnected || !isDeployed || isPending || isConfirming}
        onClick={handleClaim}
        className="mt-4 w-full rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? "Confirm…" : isConfirming ? "Claiming…" : "Claim"}
      </button>
      {isSuccess && (
        <p className="mt-3 text-sm text-emerald-400">✓ SUP claimed successfully!</p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-400 break-all">
          {`Error: ${error.message.slice(0, 120)}`}
        </p>
      )}
    </section>
  );
}
