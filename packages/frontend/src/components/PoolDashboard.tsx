"use client";

import { useAccount, useReadContract } from "wagmi";
import { type Address } from "viem";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { SuperfluidPoolABI } from "@/abi/SuperfluidPool";
import { AGENT_POOL_DISTRIBUTOR_ADDRESS } from "@/config/contracts";
import { formatFlowRate } from "@/utils/format";
import { FlowingBalance } from "./FlowingBalance";
import { usePoolSubgraph } from "@/hooks/usePoolSubgraph";

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

  const { data: subgraphData } = usePoolSubgraph(
    poolAddress as string | undefined
  );

  const { data: memberFlowRate } = useReadContract({
    address: poolAddress as Address,
    abi: SuperfluidPoolABI,
    functionName: "getMemberFlowRate",
    args: [address!],
    query: { enabled: !!poolAddress && !!address, refetchInterval: 10000 },
  });

  const streamRate = subgraphData
    ? `${formatFlowRate(subgraphData.flowRate, "month")} SUP/mo`
    : "-- SUP/mo";

  const memberCount = subgraphData
    ? subgraphData.totalMembers.toString()
    : "--";

  const yourShare =
    !isConnected
      ? "Connect wallet"
      : memberFlowRate !== undefined
        ? `${formatFlowRate(BigInt(memberFlowRate.toString().replace("-", "")), "month")} SUP/mo`
        : "-- SUP/mo";

  return (
    <section className="flex flex-col gap-4">
      {/* SUP Distributed to Agents — full width */}
      <div className="rounded-xl border border-emerald-500/10 bg-gradient-to-br from-zinc-900 to-zinc-900/50 p-6">
        <p className="text-sm font-medium text-zinc-400">SUP Distributed to Agents</p>
        <div className="mt-1 text-3xl font-semibold text-emerald-400 streaming-number">
          {subgraphData ? (
            <>
              <FlowingBalance
                balance={subgraphData.totalAmountDistributedUntilUpdatedAt}
                balanceTimestamp={subgraphData.updatedAtTimestamp}
                flowRate={subgraphData.flowRate}
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
          label="Earning Agents"
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
    <div className="card-hover rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${muted ? "text-zinc-600" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
