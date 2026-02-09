"use client";

import { useEffect, useState } from "react";

const SUBGRAPH_URL =
  "https://subgraph-endpoints.superfluid.dev/base-sepolia/protocol-v1";

interface PoolData {
  totalAmountDistributedUntilUpdatedAt: bigint;
  flowRate: bigint;
  totalUnits: bigint;
  totalMembers: number;
  updatedAtTimestamp: number;
}

export function usePoolSubgraph(poolAddress: string | undefined) {
  const [data, setData] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!poolAddress) return;

    const id = poolAddress.toLowerCase();

    async function fetchPool() {
      try {
        const res = await fetch(SUBGRAPH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `{
              pool(id: "${id}") {
                totalAmountDistributedUntilUpdatedAt
                flowRate
                totalUnits
                totalMembers
                updatedAtTimestamp
              }
            }`,
          }),
        });

        const json = await res.json();
        const pool = json?.data?.pool;

        if (pool) {
          setData({
            totalAmountDistributedUntilUpdatedAt: BigInt(
              pool.totalAmountDistributedUntilUpdatedAt
            ),
            flowRate: BigInt(pool.flowRate),
            totalUnits: BigInt(pool.totalUnits),
            totalMembers: Number(pool.totalMembers),
            updatedAtTimestamp: Number(pool.updatedAtTimestamp),
          });
        }
      } catch (e) {
        console.error("Subgraph fetch failed:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchPool();
    const interval = setInterval(fetchPool, 30000);
    return () => clearInterval(interval);
  }, [poolAddress]);

  return { data, loading };
}
