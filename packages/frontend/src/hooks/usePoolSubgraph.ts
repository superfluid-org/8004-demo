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

export function usePoolSubgraph(poolAddress: string | undefined) {
  const [data, setData] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const chainId = useChainId();
  const { subgraphUrl } = getContractConfig(chainId);

  useEffect(() => {
    if (!poolAddress) return;

    const id = poolAddress.toLowerCase();

    async function fetchPool() {
      try {
        const res = await fetch(subgraphUrl, {
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
  }, [poolAddress, subgraphUrl]);

  return { data, loading };
}
