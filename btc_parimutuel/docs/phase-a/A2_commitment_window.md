# Phase A2 — Commitment Window (Commit Instruction Only)
Status: DRAFT
Gate: A2_COMMIT_ONLY — NOT APPROVED (docs-only)

Scope: commit() only during [commit_open_ts, commit_close_ts). No betting, no withdrawal, no open/cancel.
Forbidden: odds/PnL, withdrawals, side switching, early open, any state > S1.
Acceptance: commit totals + per-user commitments update; Phase 0 green remains green.
