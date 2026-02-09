"use client";

import { useAccount, useReadContract } from "wagmi";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { AGENT_POOL_DISTRIBUTOR_ADDRESS } from "@/config/contracts";

const isDeployed =
  AGENT_POOL_DISTRIBUTOR_ADDRESS !== "0x0000000000000000000000000000000000000000";

export function PoolDashboard() {
  const { isConnected } = useAccount();

  // Read pool address (sanity check that contract is live)
  const { data: poolAddress } = useReadContract({
    address: AGENT_POOL_DISTRIBUTOR_ADDRESS,
    abi: AgentPoolDistributorABI,
    functionName: "pool",
    query: { enabled: isDeployed },
  });

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Stream Rate" value="-- SUP/mo" />
      <StatCard
        label="Pool Members"
        value={!isDeployed ? "Not deployed" : "--"}
      />
      <StatCard
        label="Your Share"
        value={isConnected ? "-- SUP/mo" : "Connect wallet"}
        muted={!isConnected}
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${muted ? "text-zinc-600" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
