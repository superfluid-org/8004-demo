"use client";

import { useEffect, useState } from "react";
import { useChainId } from "wagmi";
import { getContractConfig } from "@/config/contracts";

interface PoolData {
  totalAmountDistributedUntilUpdatedAt: bigint;
  flowRate: bigint;
  totalUnits: bigint;
  totalMembers: number;
  updatedAtTimestamp: number;
}

interface AggregatedPoolData {
  totalAmountDistributedUntilUpdatedAt: bigint;
  flowRate: bigint;
  totalUnits: bigint;
  totalMembers: number;
  updatedAtTimestamp: number;
}

/**
 * Fetches subgraph data for multiple pools and aggregates them.
 * Returns summed totalAmountDistributed, flowRate, totalUnits, totalMembers,
 * and the latest updatedAtTimestamp across all pools.
 */
export function useMultiPoolSubgraph(poolAddresses: (string | undefined)[]) {
  const [data, setData] = useState<AggregatedPoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const chainId = useChainId();
  const { subgraphUrl } = getContractConfig(chainId);

  // Filter out undefined addresses and create a stable key
  const validAddresses = poolAddresses.filter(
    (addr): addr is string => !!addr
  );
  const addressKey = validAddresses.sort().join(",").toLowerCase();

  useEffect(() => {
    if (validAddresses.length === 0) return;

    async function fetchPools() {
      try {
        // Build a single GraphQL query with aliased pool lookups
        const poolQueries = validAddresses.map(
          (addr, i) =>
            `pool${i}: pool(id: "${addr.toLowerCase()}") {
              totalAmountDistributedUntilUpdatedAt
              flowRate
              totalUnits
              totalMembers
              updatedAtTimestamp
            }`
        );

        const res = await fetch(subgraphUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `{ ${poolQueries.join("\n")} }`,
          }),
        });

        const json = await res.json();
        const pools: PoolData[] = [];

        for (let i = 0; i < validAddresses.length; i++) {
          const pool = json?.data?.[`pool${i}`];
          if (pool) {
            pools.push({
              totalAmountDistributedUntilUpdatedAt: BigInt(
                pool.totalAmountDistributedUntilUpdatedAt
              ),
              flowRate: BigInt(pool.flowRate),
              totalUnits: BigInt(pool.totalUnits),
              totalMembers: Number(pool.totalMembers),
              updatedAtTimestamp: Number(pool.updatedAtTimestamp),
            });
          }
        }

        if (pools.length > 0) {
          const aggregated: AggregatedPoolData = {
            totalAmountDistributedUntilUpdatedAt: pools.reduce(
              (sum, p) => sum + p.totalAmountDistributedUntilUpdatedAt,
              0n
            ),
            flowRate: pools.reduce((sum, p) => sum + p.flowRate, 0n),
            totalUnits: pools.reduce((sum, p) => sum + p.totalUnits, 0n),
            totalMembers: pools.reduce(
              (sum, p) => sum + p.totalMembers,
              0
            ),
            // Use the latest timestamp for FlowingBalance calculation
            updatedAtTimestamp: Math.max(
              ...pools.map((p) => p.updatedAtTimestamp)
            ),
          };
          setData(aggregated);
        }
      } catch (e) {
        console.error("Multi-pool subgraph fetch failed:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchPools();
    const interval = setInterval(fetchPools, 30000);
    return () => clearInterval(interval);
  }, [addressKey, subgraphUrl]);

  return { data, loading };
}
