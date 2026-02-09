"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatEther, type Address } from "viem";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { SuperfluidPoolABI } from "@/abi/SuperfluidPool";
import { AGENT_POOL_DISTRIBUTOR_ADDRESS } from "@/config/contracts";

const isDeployed =
  AGENT_POOL_DISTRIBUTOR_ADDRESS !== "0x0000000000000000000000000000000000000000";

function formatFlowRate(weiPerSec: bigint): string {
  // Convert wei/sec to tokens/month (30 days)
  const perMonth = weiPerSec * BigInt(30 * 24 * 60 * 60);
  const num = Number(formatEther(perMonth));
  if (num === 0) return "0";
  if (num < 0.01) return "<0.01";
  return num.toFixed(2);
}

export function PoolDashboard() {
  const { address, isConnected } = useAccount();

  const { data: poolAddress } = useReadContract({
    address: AGENT_POOL_DISTRIBUTOR_ADDRESS,
    abi: AgentPoolDistributorABI,
    functionName: "pool",
    query: { enabled: isDeployed },
  });

  const { data: totalUnits } = useReadContract({
    address: poolAddress as Address,
    abi: SuperfluidPoolABI,
    functionName: "getTotalUnits",
    query: { enabled: !!poolAddress, refetchInterval: 10000 },
  });

  const { data: totalFlowRate } = useReadContract({
    address: poolAddress as Address,
    abi: SuperfluidPoolABI,
    functionName: "getTotalFlowRate",
    query: { enabled: !!poolAddress, refetchInterval: 10000 },
  });

  const { data: memberFlowRate } = useReadContract({
    address: poolAddress as Address,
    abi: SuperfluidPoolABI,
    functionName: "getMemberFlowRate",
    args: [address!],
    query: { enabled: !!poolAddress && !!address, refetchInterval: 10000 },
  });

  const streamRate = totalFlowRate
    ? formatFlowRate(BigInt(totalFlowRate.toString().replace("-", "")))
    : "--";

  const memberCount = totalUnits !== undefined ? totalUnits.toString() : "--";

  const yourShare =
    !isConnected
      ? "Connect wallet"
      : memberFlowRate !== undefined
        ? `${formatFlowRate(BigInt(memberFlowRate.toString().replace("-", "")))} SUP/mo`
        : "-- SUP/mo";

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Stream Rate" value={`${streamRate} SUP/mo`} />
      <StatCard
        label="Pool Members"
        value={!isDeployed ? "Not deployed" : memberCount}
      />
      <StatCard
        label="Your Share"
        value={yourShare}
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
