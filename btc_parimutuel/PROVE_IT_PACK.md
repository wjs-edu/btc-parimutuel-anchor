# CommitClose Prove-It Pack (Devnet)

## What this proves
Deterministic on-chain application of market rules using immutable artifacts (tx confirmations + account snapshots).

## What this does NOT prove
Oracle correctness or any off-chain data sources. No odds/PnL/profit claims during commitment.

## Live example (devnet)
- Status: /status/1766716704.json
- Verify resolved: /verify/resolved/1766716704

## How to reproduce locally
1) `node tools/verifier-server.js`
2) Open `http://localhost:8787/verify/resolved/1766716704` and `http://localhost:8787/status/1766716704.json`
