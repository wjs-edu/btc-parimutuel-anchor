# Partner Handoff (Tier-0)

Independent verification via links:

1) Status JSON:
- /status/<market_id>.json

2) Verifiers:
- /verify/resolved/<market_id>
- /verify/canceled/<market_id>

These prove deterministic on-chain rule application using tx confirmations + account snapshots.
They do NOT verify oracle correctness/off-chain sources.
