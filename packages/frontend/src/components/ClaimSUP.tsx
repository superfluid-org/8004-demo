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

export function ClaimSUP() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const { agentPoolDistributor } = useContractConfig();
  const isDeployed = agentPoolDistributor !== ZERO;

  const { data: poolAddress } = useReadContract({
    address: agentPoolDistributor,
    abi: AgentPoolDistributorABI,
    functionName: "pool",
    query: { enabled: isDeployed },
  });

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
    ? "Connected ✓"
    : isPending
      ? "Confirm…"
      : isConfirming
        ? "Connecting…"
        : "Connect To Pool";

  return (
    <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Collect SUP in real-time</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Connect to the pool to receive SUP distributions in real-time.
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Total Received</p>
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
        </div>
      </div>
      <button
        disabled={!isConnected || !isDeployed || !poolAddress || isPending || isConfirming || isPoolConnected}
        onClick={handleConnect}
        className={`mt-4 w-full rounded-lg px-6 py-2 font-medium transition-colors disabled:cursor-not-allowed ${
          isPoolConnected
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
    </section>
  );
}
