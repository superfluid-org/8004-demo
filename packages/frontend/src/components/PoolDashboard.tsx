"use client";

import { useAccount, useReadContract } from "wagmi";
import { type Address } from "viem";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { SuperfluidPoolABI } from "@/abi/SuperfluidPool";
import { SuperTokenABI } from "@/abi/SuperToken";
import { AGENT_POOL_DISTRIBUTOR_ADDRESS } from "@/config/contracts";
import { formatFlowRate } from "@/utils/format";
import { FlowingBalance } from "./FlowingBalance";

const isDeployed =
  AGENT_POOL_DISTRIBUTOR_ADDRESS !== "0x0000000000000000000000000000000000000000";

export function PoolDashboard() {
  const { address, isConnected } = useAccount();

  const { data: poolAddress } = useReadContract({
    address: AGENT_POOL_DISTRIBUTOR_ADDRESS,
    abi: AgentPoolDistributorABI,
    functionName: "pool",
    query: { enabled: isDeployed },
  });

  const { data: superToken } = useReadContract({
    address: poolAddress as Address,
    abi: SuperfluidPoolABI,
    functionName: "superToken",
    query: { enabled: !!poolAddress },
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

  // Get the pool's realtime balance from the SuperToken
  // This is how much is currently sitting in the pool (not yet claimed)
  const { data: poolBalance } = useReadContract({
    address: superToken as Address,
    abi: SuperTokenABI,
    functionName: "realtimeBalanceOfNow",
    args: [poolAddress as Address],
    query: { enabled: !!superToken && !!poolAddress, refetchInterval: 30000 },
  });

  const streamRate = totalFlowRate
    ? `${formatFlowRate(BigInt(totalFlowRate.toString().replace("-", "")), "month")} SUP/mo`
    : "-- SUP/mo";

  const memberCount = totalUnits !== undefined ? totalUnits.toString() : "--";

  const yourShare =
    !isConnected
      ? "Connect wallet"
      : memberFlowRate !== undefined
        ? `${formatFlowRate(BigInt(memberFlowRate.toString().replace("-", "")), "month")} SUP/mo`
        : "-- SUP/mo";

  // Pool balance = total distributed but not yet claimed by members
  // It ticks up at totalFlowRate as streams flow in
  const absFlowRate = totalFlowRate
    ? BigInt(totalFlowRate.toString().replace("-", ""))
    : BigInt(0);

  const hasPoolBalance = poolBalance && poolBalance[0] !== undefined;
  const poolBalanceValue = hasPoolBalance ? BigInt(poolBalance[0].toString()) : BigInt(0);
  const poolBalanceTimestamp = hasPoolBalance ? Number(poolBalance[3]) : 0;

  return (
    <section className="flex flex-col gap-4">
      {/* Distributed So Far — full width */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-400">Distributed So Far</p>
        <div className="mt-1 text-3xl font-semibold text-emerald-400">
          {hasPoolBalance && totalFlowRate !== undefined ? (
            <>
              <FlowingBalance
                balance={poolBalanceValue < BigInt(0) ? BigInt(0) : poolBalanceValue}
                balanceTimestamp={poolBalanceTimestamp}
                flowRate={absFlowRate}
                decimals={4}
              />
              {" SUP"}
            </>
          ) : (
            "-- SUP"
          )}
        </div>
      </div>
      {/* Three stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Stream Rate" value={streamRate} />
        <StatCard
          label="Pool Members"
          value={!isDeployed ? "Not deployed" : memberCount}
        />
        <StatCard
          label="Your Share"
          value={yourShare}
          muted={!isConnected}
        />
      </div>
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
