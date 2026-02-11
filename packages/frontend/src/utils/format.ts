/**
 * Format wei balance to display string
 */
export function formatBalance(wei: bigint, decimals = 4): string {
  const divisor = 10n ** 18n;
  const negative = wei < 0n;
  const abs = negative ? -wei : wei;
  const integerPart = abs / divisor;
  const fractionalPart = abs % divisor;

  const fractionalStr = fractionalPart
    .toString()
    .padStart(18, "0")
    .slice(0, decimals);

  const integerFormatted = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${negative ? "-" : ""}${integerFormatted}.${fractionalStr}`;
}

/**
 * Format flow rate to human-readable per-time-unit
 */
export function formatFlowRate(
  weiPerSecond: bigint,
  unit: "second" | "minute" | "hour" | "day" | "month" = "month"
): string {
  const multipliers = {
    second: 1n,
    minute: 60n,
    hour: 3600n,
    day: 86400n,
    month: 2592000n, // 30 days
  };

  const ratePerUnit = weiPerSecond * multipliers[unit];
  return formatBalance(ratePerUnit, 2);
}
