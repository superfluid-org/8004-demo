import {
  type Hex,
  type PublicClient,
  decodeAbiParameters,
  decodeErrorResult,
  encodeFunctionData,
} from "viem";
import { MaestroPoolManagerABI } from "@/abi/MaestroPoolManager";

interface OffchainLookupArgs {
  sender: Hex;
  urls: string[];
  callData: Hex;
  callbackFunction: Hex;
  extraData: Hex;
}

/**
 * Execute the full EIP-3668 CCIP Read flow for MaestroPoolManager:
 * 1. eth_call requestMembership → get OffchainLookup revert data
 * 2. Extract gateway URLs + callData from the revert
 * 3. Hit the gateway (URL template from the contract)
 * 4. Return response + extraData for membershipCallback
 */
export async function executeMaestroCcipRead(
  client: PublicClient,
  contractAddress: Hex,
  agentId: bigint,
  callerAddress: Hex
): Promise<{
  response: Hex;
  extraData: Hex;
  score: number;
}> {
  // Step 1: Raw eth_call to get the OffchainLookup revert data
  const calldata = encodeFunctionData({
    abi: MaestroPoolManagerABI,
    functionName: "requestMembership",
    args: [agentId],
  });

  const transport = client.transport;
  const rpcResponse = (await transport
    .request({
      method: "eth_call",
      params: [{ from: callerAddress, to: contractAddress, data: calldata }, "latest"],
    })
    .catch((err: any) => {
      // Some transports throw with the error data attached
      if (err?.data && typeof err.data === "string" && err.data.startsWith("0x")) {
        return { __revertData: err.data };
      }
      if (err?.cause?.data && typeof err.cause.data === "string") {
        return { __revertData: err.cause.data };
      }
      throw err;
    })) as any;

  // Extract revert data
  let revertData: Hex;
  if (rpcResponse?.__revertData) {
    revertData = rpcResponse.__revertData as Hex;
  } else if (
    typeof rpcResponse === "string" &&
    rpcResponse.startsWith("0x556f1830")
  ) {
    // OffchainLookup selector
    revertData = rpcResponse as Hex;
  } else {
    // Check if it's a known error (NotAgentOwner, AlreadyJoined, etc.)
    if (typeof rpcResponse === "string" && rpcResponse.startsWith("0x")) {
      try {
        const decoded = decodeErrorResult({
          abi: MaestroPoolManagerABI,
          data: rpcResponse as Hex,
        });
        throw new Error(decoded.errorName);
      } catch (e) {
        if (e instanceof Error && ["NotAgentOwner", "AlreadyJoined", "AgentNotRegistered"].includes(e.message)) {
          throw e;
        }
      }
    }
    throw new Error("Failed to get OffchainLookup revert data from contract");
  }

  // Decode the OffchainLookup error
  const decoded = decodeErrorResult({
    abi: MaestroPoolManagerABI,
    data: revertData,
  });

  if (decoded.errorName !== "OffchainLookup") {
    throw new Error(decoded.errorName);
  }

  const args = decoded.args as unknown as [Hex, string[], Hex, Hex, Hex];
  const offchainLookup: OffchainLookupArgs = {
    sender: args[0],
    urls: args[1],
    callData: args[2],
    callbackFunction: args[3],
    extraData: args[4],
  };

  // Step 2: Hit the gateway using the URL template from the contract
  const urlTemplate = offchainLookup.urls[0];
  const gatewayUrl = urlTemplate
    .replace("{sender}", offchainLookup.sender)
    .replace("{data}", offchainLookup.callData);

  const res = await fetch(gatewayUrl);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Gateway error" }));
    throw new Error(body.message || `Gateway returned ${res.status}`);
  }

  const { data: response } = (await res.json()) as { data: Hex };

  // Decode score from response for display
  // Response layout: (address requester, uint256 agentId, uint256 score, uint64 computedAt, bytes signature)
  const [, , scoreRaw] = decodeAbiParameters(
    [
      { type: "address" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint64" },
      { type: "bytes" },
    ],
    response
  );
  const score = Number(scoreRaw) / 100;

  return {
    response,
    extraData: offchainLookup.extraData,
    score,
  };
}
