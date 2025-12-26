# Crank Runner v0

Crank Runner v0 is a partner-runnable reference client that executes a single
CommitClose market lifecycle end-to-end and produces proof artifacts.

This is not an SDK, UI, or customizable framework.

## Usage

yarn crank run --market ./crank/market.example.json

The partner:
- operates the signing wallet
- retains custody, KYC, geo gating, and user ledger
- is the sole on-chain actor

CommitClose:
- enforces deterministic lifecycle rules
- produces verifier and proof artifacts
- does not custody funds or operate execution

## Outputs

### Market Receipt (stdout)
- Market ID
- Final State (RESOLVED or CANCELED)
- Status URL
- Verifier URL
- Transaction signatures
- Params hash
- Rule version

### Evidence Pack (disk)
Written to: evidence/<market_id>/

## Non-goals
- No SDK
- No UI or dashboards
- No customization or flags
- No multiple market support
- No odds, PnL, or profit displays
- No discretionary overrides

## Failure Behavior
- Exits non-zero on failure
- Partial artifacts may still be written
- Status endpoint is the source of truth
