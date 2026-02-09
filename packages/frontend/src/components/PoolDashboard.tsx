"use client";

import { useAccount, useReadContract } from "wagmi";
import { type Address } from "viem";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { SuperfluidPoolABI } from "@/abi/SuperfluidPool";
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

  const { data: totalDistributed } = useReadContract({
    address: poolAddress as Address,
    abi: SuperfluidPoolABI,
    functionName: "getTotalAmountDistributedUntilUpdatedAt",
    query: { enabled: !!poolAddress, refetchInterval: 30000 },
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

  // For the flowing total distributed, we use the snapshot + total flow rate
  const absFlowRate = totalFlowRate
    ? BigInt(totalFlowRate.toString().replace("-", ""))
    : BigInt(0);

  return (
    <section className="flex flex-col gap-4">
      {/* Distributed So Far — full width */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-400">Distributed So Far</p>
        <div className="mt-1 text-3xl font-semibold text-emerald-400">
          {totalDistributed !== undefined && totalFlowRate !== undefined ? (
            <>
              <FlowingBalance
                balance={BigInt(totalDistributed.toString())}
                balanceTimestamp={Math.floor(Date.now() / 1000)}
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
