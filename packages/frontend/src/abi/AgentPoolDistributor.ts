export const AgentPoolDistributorABI = [
  {
    type: "function",
    name: "joinPool",
    inputs: [{ name: "agentId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "leavePool",
    inputs: [{ name: "agentId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimSUP",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "hasJoined",
    inputs: [{ name: "agentId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "joinFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pool",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "identityRegistry",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AgentJoined",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "agentWallet", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "AgentLeft",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "agentWallet", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "SUPClaimed",
    inputs: [
      { name: "agent", type: "address", indexed: true },
    ],
  },
] as const;
