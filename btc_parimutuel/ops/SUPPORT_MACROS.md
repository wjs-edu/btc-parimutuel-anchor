# Support Macros (Phase 1)

Banned words: pending, profit, guaranteed, odds, PnL, win rate, withdraw (during commitment).

Macro: “Why can’t I withdraw during commitment?”
- Commitment is not betting; no individual withdrawal/cancel during commitment.
- Final actions occur at commit_close_ts only.

Macro: “Why isn’t it open yet?”
- Markets open/cancel only at commit_close_ts. No early open by design.

Macro: “Does this prove the outcome was correct?”
- It proves deterministic on-chain rule application and recomputation consistency.
- It does NOT verify oracle correctness/off-chain sources.
