# Trust Surfaces — vFinal

## Purpose
Enumerate every authority, its maximum power, and our assumptions about it.

## Authorities
### Admin
- Powers: publish markets with immutable params; perform deterministic state transitions (as implemented).
- Assumptions: admin is visible/auditable; no discretionary overrides allowed.

### Oracle / price source
- Powers: influences resolution via published price feed.
- Assumptions: documented source, update cadence, and outage policy; if violates max delay => cancel per policy.

### RPC providers
- Powers: can degrade UX (timeouts, partial data).
- Assumptions: chain is source of truth; UI must tolerate RPC flakiness and show verifiable tx links.

### CI devnet key (GitHub secret)
- Powers: can run devnet tests, pay fees.
- Assumptions: used only for CI; never committed; rotated if exposed.

## Non-goals
- No hidden admin actions.
- No discretionary rescue behavior.
