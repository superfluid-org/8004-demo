"use client";

import { useEffect, useState } from "react";
import { useWatchContractEvent } from "wagmi";
import { type Address, createPublicClient, http, parseAbiItem } from "viem";
import { AgentPoolDistributorABI } from "@/abi/AgentPoolDistributor";
import { AGENT_POOL_DISTRIBUTOR_ADDRESS, CHAIN, DEPLOY_BLOCK } from "@/config/contracts";

const isDeployed =
  AGENT_POOL_DISTRIBUTOR_ADDRESS !== "0x0000000000000000000000000000000000000000";

// Standalone public client so event fetching works without a connected wallet
const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http("https://base-sepolia-rpc.publicnode.com"),
});

interface Member {
  agentId: bigint;
  wallet: Address;
}

export function MemberList({ hideTitle = false }: { hideTitle?: boolean } = {}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch historical AgentJoined events (chunked to avoid RPC block range limits)
  useEffect(() => {
    if (!isDeployed) return;

    async function getLogsChunked(
      event: ReturnType<typeof parseAbiItem>,
      fromBlock: bigint,
      toBlock: bigint
    ) {
      const CHUNK_SIZE = 45000n;
      const allLogs: any[][] = [];
      let start = fromBlock;
      while (start <= toBlock) {
        const end = start + CHUNK_SIZE > toBlock ? toBlock : start + CHUNK_SIZE;
        const logs = await publicClient.getLogs({
          address: AGENT_POOL_DISTRIBUTOR_ADDRESS,
          event: event as any,
          fromBlock: start,
          toBlock: end,
        });
        allLogs.push(logs);
        start = end + 1n;
      }
      return allLogs.flat();
    }

    async function fetchMembers() {
      try {
        const latestBlock = await publicClient.getBlockNumber();

        const logs = await getLogsChunked(
          parseAbiItem(
            "event AgentJoined(uint256 indexed agentId, address indexed agentWallet)"
          ),
          DEPLOY_BLOCK,
          latestBlock
        );

        // Also fetch AgentLeft to know who's still in
        const leftLogs = await getLogsChunked(
          parseAbiItem(
            "event AgentLeft(uint256 indexed agentId, address indexed agentWallet)"
          ),
          DEPLOY_BLOCK,
          latestBlock
        );

        const leftSet = new Set(
          leftLogs.map((l) => (l as any).args.agentId!.toString())
        );

        const activeMembers = (logs as any[])
          .filter((l) => !leftSet.has(l.args.agentId!.toString()))
          .map((l) => ({
            agentId: l.args.agentId!,
            wallet: l.args.agentWallet!,
          }));

        setMembers(activeMembers);
      } catch (e) {
        console.error("Failed to fetch members:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, []);

  // Watch for new joins in real-time
  useWatchContractEvent({
    address: AGENT_POOL_DISTRIBUTOR_ADDRESS,
    abi: AgentPoolDistributorABI,
    eventName: "AgentJoined",
    enabled: isDeployed,
    onLogs(logs) {
      const newMembers = logs.map((log) => ({
        agentId: log.args.agentId!,
        wallet: log.args.agentWallet!,
      }));
      setMembers((prev) => {
        const existing = new Set(prev.map((m) => m.agentId.toString()));
        const unique = newMembers.filter(
          (m) => !existing.has(m.agentId.toString())
        );
        return [...prev, ...unique];
      });
    },
  });

  return (
    <section className={hideTitle ? "" : "rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6"}>
      {!hideTitle && <h2 className="text-lg font-semibold text-white">Earning Agents</h2>}
      {!isDeployed ? (
        <p className="mt-2 text-sm text-zinc-500">
          Contract not deployed yet. Members will appear here once the pool is
          live.
        </p>
      ) : loading ? (
        <p className="mt-2 text-sm text-zinc-500">Loading members…</p>
      ) : members.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">
          No members yet. Be the first to join with your ERC-8004 Agent ID.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {members.map((m) => (
            <div
              key={m.agentId.toString()}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3"
            >
              <span className="font-mono text-sm text-emerald-400">
                Agent #{m.agentId.toString()}
              </span>
              <a
                href={`${CHAIN.blockExplorers?.default?.url}/address/${m.wallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {m.wallet.slice(0, 6)}…{m.wallet.slice(-4)}
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
