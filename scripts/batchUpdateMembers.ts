import { createPublicClient, createWalletClient, http, parseAbi, type Address, type Hex } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const MAESTRO_POOL_MANAGER: Address = "0x0Eccc32665f65ABb74b2C1fc178F3d60F0f646D2";
const RPC_URL = process.env.RPC_URL ?? "https://base-rpc.publicnode.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex | undefined;
const CSV_PATH = process.env.CSV_PATH ?? resolve(__dirname, "../docs/mid_20260310.csv");
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? "50");
const DRY_RUN = process.env.DRY_RUN === "true";

const abi = parseAbi([
  "function batchUpdateMembers(uint256[] agentIds, address[] members, uint128[] units) external",
  "function owner() view returns (address)",
]);

// ─── CSV Parser ──────────────────────────────────────────────────────────────

interface CsvRow {
  agentId: bigint;
  agentWallet: Address;
  score: number;
  units: bigint;
}

function parseCsv(path: string): CsvRow[] {
  const raw = readFileSync(path, "utf-8");
  const lines = raw.trim().split("\n");
  const header = lines[0];

  if (!header.includes("agentId") || !header.includes("agentWallet") || !header.includes("units")) {
    throw new Error(`Unexpected CSV header: ${header}`);
  }

  return lines.slice(1).map((line, i) => {
    const [agentId, agentWallet, score, units] = line.split(",");
    if (!agentId || !agentWallet || !units) {
      throw new Error(`Malformed CSV line ${i + 2}: ${line}`);
    }
    return {
      agentId: BigInt(agentId.trim()),
      agentWallet: agentWallet.trim() as Address,
      score: parseFloat(score),
      units: BigInt(units.trim()),
    };
  });
}

// ─── Batching ────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY env var required (hex with 0x prefix)");
    process.exit(1);
  }

  const rows = parseCsv(CSV_PATH);
  console.log(`📄 Loaded ${rows.length} entries from CSV`);

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`🔑 Signer: ${account.address}`);

  const publicClient = createPublicClient({ chain: base, transport: http(RPC_URL) });
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC_URL) });

  // Verify caller is owner
  const owner = await publicClient.readContract({
    address: MAESTRO_POOL_MANAGER,
    abi,
    functionName: "owner",
  });
  if (owner.toLowerCase() !== account.address.toLowerCase()) {
    console.error(`❌ Signer ${account.address} is not the contract owner (${owner})`);
    process.exit(1);
  }
  console.log(`✅ Signer is contract owner`);

  // Batch and send
  const batches = chunk(rows, BATCH_SIZE);
  console.log(`📦 Split into ${batches.length} batches of up to ${BATCH_SIZE}\n`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const agentIds = batch.map((r) => r.agentId);
    const members = batch.map((r) => r.agentWallet);
    const units = batch.map((r) => r.units);

    console.log(`── Batch ${i + 1}/${batches.length} (${batch.length} agents) ──`);
    console.log(`   Agent IDs: ${agentIds[0]}..${agentIds[agentIds.length - 1]}`);

    if (DRY_RUN) {
      console.log(`   🏜️  DRY RUN — skipping tx\n`);
      continue;
    }

    try {
      const hash = await walletClient.writeContract({
        address: MAESTRO_POOL_MANAGER,
        abi,
        functionName: "batchUpdateMembers",
        args: [agentIds, members, units],
      });

      console.log(`   📤 Tx: ${hash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`   ✅ Confirmed in block ${receipt.blockNumber} (gas: ${receipt.gasUsed})\n`);
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message?.slice(0, 200)}\n`);
      process.exit(1);
    }
  }

  console.log("🎉 All batches submitted successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
