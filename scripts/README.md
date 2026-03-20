# Scripts

## batchUpdateMembers.ts

Reads a CSV file and calls `MaestroPoolManager::batchUpdateMembers` in batches.

### CSV Format

```csv
agentId,agentWallet,score,units
20252,0x293b...281F,65.31,20
```

### Usage

```bash
# Dry run (no transactions sent)
NODE_PATH=../packages/frontend/node_modules \
DRY_RUN=true \
PRIVATE_KEY=0x... \
npx tsx scripts/batchUpdateMembers.ts

# Live run
NODE_PATH=../packages/frontend/node_modules \
PRIVATE_KEY=0x... \
npx tsx scripts/batchUpdateMembers.ts
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PRIVATE_KEY` | (required) | Contract owner's private key (hex with 0x prefix) |
| `CSV_PATH` | `docs/mid_20260310.csv` | Path to the CSV file |
| `BATCH_SIZE` | `50` | Number of agents per transaction |
| `DRY_RUN` | `false` | Set to `true` to skip sending transactions |
| `RPC_URL` | `https://base-rpc.publicnode.com` | Base RPC endpoint |
