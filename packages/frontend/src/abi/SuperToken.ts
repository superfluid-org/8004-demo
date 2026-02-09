export const SuperTokenABI = [
  {
    type: "function",
    name: "realtimeBalanceOfNow",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [
      { name: "availableBalance", type: "int256", internalType: "int256" },
      { name: "deposit", type: "uint256", internalType: "uint256" },
      { name: "owedDeposit", type: "uint256", internalType: "uint256" },
      { name: "timestamp", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;
