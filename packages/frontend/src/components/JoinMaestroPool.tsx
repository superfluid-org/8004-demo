"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { type Hex, formatEther } from "viem";
import { MaestroPoolManagerABI } from "@/abi/MaestroPoolManager";
import { useContractConfig } from "@/hooks/useContractConfig";
import { executeMaestroCcipRead } from "@/lib/ccip-read";

type Step = "idle" | "fetching" | "signing" | "confirming" | "done" | "error";

export function JoinMaestroPool() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [agentId, setAgentId] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [offchainScore, setOffchainScore] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<Hex | undefined>();
  const { maestroPoolManager } = useContractConfig();

  const agentIdBigInt = BigInt(agentId || "0");

  const { data: joinFee } = useReadContract({
    address: maestroPoolManager,
    abi: MaestroPoolManagerABI,
    functionName: "JOIN_FEE",
    query: { enabled: !!maestroPoolManager },
  });

  const { data: minScore } = useReadContract({
    address: maestroPoolManager,
    abi: MaestroPoolManagerABI,
    functionName: "MIN_SCORE",
    query: { enabled: !!maestroPoolManager },
  });

  const { data: hasJoined, refetch: refetchHasJoined } = useReadContract({
    address: maestroPoolManager,
    abi: MaestroPoolManagerABI,
    functionName: "hasJoined",
    args: [agentIdBigInt],
    query: { enabled: !!maestroPoolManager && !!agentId && agentIdBigInt > 0n },
  });

  const { writeContract } = useWriteContract();

  const { isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isTxSuccess) {
      setStep("done");
      refetchHasJoined();
    }
  }, [isTxSuccess, refetchHasJoined]);

  const handleJoin = async () => {
    if (!agentId || agentIdBigInt <= 0n || !address || !publicClient || !maestroPoolManager) return;

    setError("");
    setStep("fetching");
    setOffchainScore(null);
    setTxHash(undefined);

    try {
      // Step 1: CCIP Read — eth_call → OffchainLookup → gateway
      const { response, extraData, score } = await executeMaestroCcipRead(
        publicClient,
        maestroPoolManager,
        agentIdBigInt,
        address
      );
      setOffchainScore(score);
      setStep("signing");

      // Step 2: Submit membershipCallback tx with join fee
      writeContract(
        {
          address: maestroPoolManager,
          abi: MaestroPoolManagerABI,
          functionName: "membershipCallback",
          args: [response, extraData],
          value: joinFee ?? BigInt("100000000000000"), // fallback 0.0001 ETH
          gas: 500_000n,
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
            setStep("confirming");
          },
          onError: (err) => {
            const msg = err.message;
            if (msg.includes("ScoreBelowMinimum")) {
              setError(`Score too low. Minimum required: ${minScore ? Number(minScore) / 100 : 50}.00`);
            } else if (msg.includes("SCORE_TOO_OLD")) {
              setError("Score is too old (> 1 hour). Try again to fetch a fresh one.");
            } else if (msg.includes("AlreadyJoined")) {
              setError("This agent has already joined the Maestro Pool.");
            } else if (msg.includes("InsufficientFee")) {
              setError("Insufficient ETH for join fee.");
            } else if (msg.includes("NotAgentOwner")) {
              setError("You don't own this Agent ID.");
            } else if (msg.includes("AgentNotRegistered")) {
              setError("This agent is not registered in ERC-8004.");
            } else {
              setError(msg.slice(0, 200));
            }
            setStep("error");
          },
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "NotAgentOwner") {
        setError("You don't own this Agent ID.");
      } else if (message === "AlreadyJoined") {
        setError("This agent has already joined the Maestro Pool.");
      } else if (message === "AgentNotRegistered") {
        setError("This agent is not registered in ERC-8004.");
      } else {
        setError(message.slice(0, 200));
      }
      setStep("error");
    }
  };

  const minScoreDisplay = minScore ? (Number(minScore) / 100).toFixed(2) : "50.00";

  return (
    <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Join Maestro Pool</h2>
      <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
        The Maestro Pool requires a minimum{" "}
        <a
          href="https://8004classifier.pilou.work/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-400 hover:text-accent-300 transition-colors"
        >
          8004 classifier score
          <span className="inline-block ml-0.5 text-[0.75em] align-baseline">↗</span>
        </a>{" "}
        of <span className="font-semibold text-white">{minScoreDisplay}</span>.
        Scores are fetched and verified using{" "}
        <a
          href="https://eips.ethereum.org/EIPS/eip-3668"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-400 hover:text-accent-300 transition-colors"
        >
          EIP-3668 (CCIP Read)
          <span className="inline-block ml-0.5 text-[0.75em] align-baseline">↗</span>
        </a>
        {" "}— your score is retrieved offchain from the 8004 gateway and verified onchain
        with an EIP-712 signature.
      </p>

      {/* Input + Button */}
      <div className="mx-auto mt-8 flex max-w-md gap-3">
        <input
          type="number"
          min="0"
          placeholder="Agent ID"
          value={agentId}
          onChange={(e) => {
            setAgentId(e.target.value);
            setStep("idle");
            setError("");
            setOffchainScore(null);
          }}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
        />
        <button
          disabled={
            !agentId ||
            !isConnected ||
            !maestroPoolManager ||
            step === "fetching" ||
            step === "signing" ||
            step === "confirming" ||
            hasJoined === true
          }
          onClick={handleJoin}
          className="shrink-0 rounded-lg bg-accent-600 px-6 py-2 font-medium text-white transition-colors hover:bg-accent-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step === "fetching"
            ? "Fetching…"
            : step === "signing"
              ? "Sign tx…"
              : step === "confirming"
                ? "Joining…"
                : hasJoined
                  ? "Joined ✓"
                  : "Join"}
        </button>
      </div>
      <div className="mx-auto mt-2 max-w-md text-right text-xs text-zinc-500">
        Join cost: {joinFee ? `${formatEther(joinFee)} ETH` : "0.0001 ETH"}
      </div>

      {/* CCIP Read Flow Progress */}
      {step !== "idle" && step !== "error" && (
        <div className="mx-auto mt-4 max-w-md">
          <div className="space-y-2">
            <FlowStep
              label="Fetch score from 8004 gateway"
              status={
                step === "fetching"
                  ? "active"
                  : offchainScore !== null
                    ? "done"
                    : "pending"
              }
              detail={offchainScore !== null ? `Score: ${offchainScore.toFixed(2)}` : undefined}
            />
            <FlowStep
              label="Sign & submit callback tx"
              status={
                step === "signing"
                  ? "active"
                  : txHash || step === "confirming" || step === "done"
                    ? "done"
                    : "pending"
              }
            />
            <FlowStep
              label="Confirm on Base"
              status={
                step === "confirming"
                  ? "active"
                  : step === "done"
                    ? "done"
                    : "pending"
              }
            />
          </div>
        </div>
      )}

      {/* Success */}
      {step === "done" && (
        <div className="mx-auto mt-4 max-w-md">
          <p className="text-sm text-accent-400">
            ✓ Agent #{agentId} joined the Maestro Pool!
            {offchainScore !== null && ` (Score: ${offchainScore.toFixed(2)})`}
          </p>
          {txHash && (
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent-400/60 hover:text-accent-300 transition-colors"
            >
              View on BaseScan →
            </a>
          )}
        </div>
      )}

      {/* Error */}
      {step === "error" && (
        <p className="mx-auto mt-3 max-w-md text-sm text-red-400 break-all">
          {error}
        </p>
      )}
    </section>
  );
}

function FlowStep({
  label,
  status,
  detail,
}: {
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-5 w-5 items-center justify-center">
        {status === "pending" && (
          <div className="h-2 w-2 rounded-full bg-zinc-700" />
        )}
        {status === "active" && (
          <div className="h-3 w-3 rounded-full bg-accent-400 animate-pulse" />
        )}
        {status === "done" && (
          <svg className="h-4 w-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div>
        <span className={`text-sm ${
          status === "active" ? "text-accent-400" : status === "done" ? "text-zinc-400" : "text-zinc-600"
        }`}>
          {label}
        </span>
        {detail && (
          <span className="ml-2 text-xs text-zinc-500">{detail}</span>
        )}
      </div>
    </div>
  );
}
