"use client";

import { useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { type Address } from "viem";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { SuperfluidPoolABI } from "@/abi/SuperfluidPool";
import { useContractConfig } from "@/hooks/useContractConfig";
import { usePoolSubgraph } from "@/hooks/usePoolSubgraph";
import { formatFlowRate } from "@/utils/format";
import { FlowingBalance } from "./FlowingBalance";

const ZERO = "0x0000000000000000000000000000000000000000";
const GDA_FORWARDER = "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08";

const GDAv1ForwarderABI = [
  {
    name: "connectPool",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pool", type: "address" },
      { name: "userData", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "isMemberConnected",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "pool", type: "address" },
      { name: "member", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface ClaimSUPProps {
  title?: string;
  description?: string;
  poolAddress?: Address;
}

export function ClaimSUP({ title = "Collect SUP in real-time", description = "Connect to the pool to receive SUP distributions in real-time.", poolAddress: poolAddressProp }: ClaimSUPProps) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const { agentPoolDistributor } = useContractConfig();
  const isDeployed = agentPoolDistributor !== ZERO;

  const { data: poolAddressFromContract } = useReadContract({
    address: agentPoolDistributor,
    abi: AgentPoolDistributorABI,
    functionName: "pool",
    query: { enabled: isDeployed && !poolAddressProp },
  });

  const poolAddress = poolAddressProp ?? (poolAddressFromContract as Address | undefined);

  const { data: poolSubgraphData } = usePoolSubgraph(poolAddress as string | undefined);

  const UNITS_PER_AGENT = 10n;
  const poolStreamRate = poolSubgraphData
    ? `${formatFlowRate(poolSubgraphData.flowRate, "month")} SUP/mo`
    : "-- SUP/mo";
  const poolAgentCount = poolSubgraphData
    ? (poolSubgraphData.totalUnits / UNITS_PER_AGENT).toString()
    : "--";

  const { data: memberUnits } = useReadContract({
    address: poolAddress as Address,
    abi: SuperfluidPoolABI,
    functionName: "getUnits",
    args: [address!],
    query: { enabled: !!poolAddress && !!address },
  });

  const isMember = memberUnits !== undefined && BigInt(memberUnits.toString()) > BigInt(0);

  const { data: isPoolConnected, queryKey: connectedQueryKey } = useReadContract({
    address: GDA_FORWARDER,
    abi: GDAv1ForwarderABI,
    functionName: "isMemberConnected",
    args: [poolAddress as Address, address!],
    query: { enabled: !!poolAddress && !!address },
  });

  const { data: totalReceived } = useReadContract({
    address: poolAddress as Address,
    abi: SuperfluidPoolABI,
    functionName: "getTotalAmountReceivedByMember",
    args: [address!],
    query: { enabled: !!poolAddress && !!address, refetchInterval: 30000 },
  });

  const { data: memberFlowRate } = useReadContract({
    address: poolAddress as Address,
    abi: SuperfluidPoolABI,
    functionName: "getMemberFlowRate",
    args: [address!],
    query: { enabled: !!poolAddress && !!address, refetchInterval: 30000 },
  });

  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  // Invalidate connection status query on successful tx
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: connectedQueryKey });
    }
  }, [isSuccess, queryClient, connectedQueryKey]);

  function handleConnect() {
    if (!poolAddress) return;
    writeContract({
      address: GDA_FORWARDER,
      abi: GDAv1ForwarderABI,
      functionName: "connectPool",
      args: [poolAddress as Address, "0x"],
    });
  }

  const buttonLabel = isPoolConnected
    ? "Connected"
    : !isMember
      ? "Not Eligible"
      : isPending
        ? "Confirm…"
        : isConfirming
          ? "Connecting…"
          : "Connect To Pool";

  return (
    <section className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-7">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-zinc-400">
          {description}
        </p>
      </div>
      {/* Per-pool stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-500">Stream Rate</p>
          <p className="mt-1 text-sm font-semibold text-white">{poolStreamRate}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Earning Agents</p>
          <p className="mt-1 text-sm font-semibold text-white">{poolAgentCount}</p>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <p className="text-sm text-zinc-400">Total received</p>
        <div className="text-xl font-semibold text-accent-400">
          {totalReceived !== undefined && memberFlowRate !== undefined ? (
            <>
              <FlowingBalance
                balance={BigInt(totalReceived.toString())}
                balanceTimestamp={Math.floor(Date.now() / 1000)}
                flowRate={BigInt(
                  memberFlowRate.toString().replace("-", "")
                )}
                decimals={4}
              />
              {" SUP"}
            </>
          ) : (
            "-- SUP"
          )}
        </div>
        <button
          disabled={!isConnected || (!poolAddressProp && !isDeployed) || !poolAddress || !isMember || isPending || isConfirming || isPoolConnected}
          onClick={handleConnect}
          className={`mt-5 w-full rounded-lg px-6 py-2.5 font-medium transition-colors disabled:cursor-not-allowed ${
            isPoolConnected || !isMember
              ? "border border-accent-600/30 bg-accent-600/5 text-accent-400"
              : "bg-accent-600 text-white hover:bg-accent-500 disabled:opacity-40"
          }`}
        >
          {buttonLabel}
        </button>
        {error && (
          <p className="mt-3 text-sm text-red-400 break-all">
            {`Error: ${error.message.slice(0, 120)}`}
          </p>
        )}
      </div>
    </section>
  );
}
