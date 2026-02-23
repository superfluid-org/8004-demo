"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { type Address } from "viem";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { SuperfluidPoolABI } from "@/abi/SuperfluidPool";
import { useContractConfig } from "@/hooks/useContractConfig";
import { formatFlowRate } from "@/utils/format";
import { FlowingBalance } from "./FlowingBalance";
import { MemberList } from "./MemberList";
import { usePoolSubgraph } from "@/hooks/usePoolSubgraph";

const ZERO = "0x0000000000000000000000000000000000000000";

export function PoolDashboard() {
  const [showMembers, setShowMembers] = useState(false);
  const { address, isConnected } = useAccount();
  const { agentPoolDistributor } = useContractConfig();
  const isDeployed = agentPoolDistributor !== ZERO;

  const { data: poolAddress } = useReadContract({
    address: agentPoolDistributor,
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

  const UNITS_PER_AGENT = 10n;
  const agentCount = subgraphData
    ? (subgraphData.totalUnits / UNITS_PER_AGENT).toString()
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
      <div className="rounded-xl border border-accent-500/10 bg-gradient-to-br from-zinc-900 to-zinc-900/50 p-6">
        <p className="text-sm font-medium text-zinc-400">SUP Distributed to Agents</p>
        <div className="mt-1 text-3xl font-semibold text-accent-400 streaming-number">
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
        <button
          onClick={() => setShowMembers(true)}
          className="card-hover rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6 text-left transition-colors hover:border-accent-500/30 cursor-pointer"
        >
          <p className="text-sm font-medium text-zinc-400">Earning Agents</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-2xl font-semibold text-white">
              {!isDeployed ? "Not deployed" : agentCount}
            </p>
            <span className="text-xs text-zinc-500">View →</span>
          </div>
        </button>
        <StatCard
          label="Your Share"
          value={yourShare}
          muted={!isConnected}
        />
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMembers(false)}
        >
          <div
            className="relative mx-4 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Earning Agents</h2>
              <button
                onClick={() => setShowMembers(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 pt-4">
              <MemberList hideTitle />
            </div>
          </div>
        </div>
      )}
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
