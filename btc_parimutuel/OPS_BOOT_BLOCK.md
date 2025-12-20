# Ops Boot Block (Phase-aware)

STOP-THE-LINE:
- Economic correctness bugs (fairness, vault invariants) block all work.

Phase authority:
- PHASE.md is authoritative for allowed work.

Green (Phase 0):
- anchor test --skip-local-validator --provider.cluster devnet --skip-deploy
- Must pass smoke + fairness_order.ts

No drift:
- No deploy/test with dirty git status (unless allowlisted).
- Any IDL/account-layout change => RE-BASELINE checklist.
