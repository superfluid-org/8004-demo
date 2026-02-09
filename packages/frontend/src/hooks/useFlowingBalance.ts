import { useEffect, useState } from "react";

/**
 * Hook for displaying continuously updating Superfluid streaming balances.
 * Uses requestAnimationFrame for smooth animation and BigInt for precision.
 *
 * NOTE: Causes frequent re-renders. Use only in leaf components.
 */
export function useFlowingBalance(params: {
  balance: bigint;
  balanceTimestamp: bigint | number;
  flowRate: bigint;
  animationStepTimeInMs?: number;
}) {
  const {
    balance,
    balanceTimestamp,
    flowRate,
    animationStepTimeInMs = 100,
  } = params;

  const [flowingBalance, setFlowingBalance] = useState(balance);

  useEffect(() => {
    if (flowRate === 0n) {
      setFlowingBalance(balance);
      return;
    }

    let lastAnimationTimestamp: DOMHighResTimeStamp = 0;
    let animationFrameId: number;

    const animationStep = (currentAnimationTimestamp: DOMHighResTimeStamp) => {
      animationFrameId = window.requestAnimationFrame(animationStep);

      if (
        currentAnimationTimestamp - lastAnimationTimestamp >
        animationStepTimeInMs
      ) {
        const elapsedTimeInMilliseconds = BigInt(
          Date.now() - Number(balanceTimestamp) * 1000
        );
        const newFlowingBalance =
          balance + (flowRate * elapsedTimeInMilliseconds) / 1000n;

        setFlowingBalance(newFlowingBalance);
        lastAnimationTimestamp = currentAnimationTimestamp;
      }
    };

    animationFrameId = window.requestAnimationFrame(animationStep);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [balance, balanceTimestamp, flowRate, animationStepTimeInMs]);

  return flowingBalance;
}
