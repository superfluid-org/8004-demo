"use client";

import { useFlowingBalance } from "@/hooks/useFlowingBalance";
import { formatBalance } from "@/utils/format";

interface FlowingBalanceProps {
  balance: bigint;
  balanceTimestamp: number;
  flowRate: bigint;
  decimals?: number;
  className?: string;
}

export function FlowingBalance({
  balance,
  balanceTimestamp,
  flowRate,
  decimals = 8,
  className = "font-mono tabular-nums",
}: FlowingBalanceProps) {
  const flowingBalance = useFlowingBalance({
    balance,
    balanceTimestamp,
    flowRate,
    animationStepTimeInMs: 100,
  });

  return <span className={className}>{formatBalance(flowingBalance, decimals)}</span>;
}
