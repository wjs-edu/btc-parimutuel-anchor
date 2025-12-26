# Phase 1 Pilot Runbook (Devnet)

Non-negotiables: no protocol changes; no discretion; no window extensions; no early opens; no odds/PnL/profit language; canonical statuses only; “pending” forbidden.

Prereq: verifier server (local)
- node tools/verifier-server.js
- http://localhost:8787

Flow (Tier-0):
1) Publish market → record market_id + params snapshot
2) Commitment phase (not betting yet): aggregates only; no withdrawal/cancel during commitment
3) At commit_close_ts: batch open OR batch cancel (only at close)
4) Resolve/cancel deterministically
5) Share Market Receipt + partner verifies links

Market Receipt (copy/paste):
Market <market_id> concluded.
Status: /status/<market_id>.json
Verify: /verify/resolved/<market_id> OR /verify/canceled/<market_id>
This proves deterministic on-chain rule application; it does NOT prove oracle correctness/off-chain sources.
