# Versioning — vFinal Boundary

## What is vFinal?
vFinal is defined by the canonical spec stack plus the frozen program interface:
- Market Ladder Spec vFinal
- Market State Machine vFinal
- Commitment Window Spec vFinal
- Trust Surfaces Checklist vFinal
- Cancel Recovery Flow Spec v1 (canonical)
- Program interface invariants: PROGRAM_ID, PDA seeds, instruction arg order, account layouts

## What is a vFinal-breaking change?
Any change to:
- PROGRAM_ID, PDA seeds, instruction arg order, or account layouts
- Economic settlement logic or claim math
- Canonical state machine or status vocabulary
- Commitment rules (no odds, no withdraw, batch open/cancel only at commit_close_ts)
- Cancel/refund semantics or proof bundle requirements
- CI/dev toolchain requirements that break deterministic builds

## Allowed change path (only)
To make a breaking change:
1) Create a new version identifier (e.g., vNext)
2) Write a migration note describing what broke and why
3) Freeze vFinal docs forever (no edits; add only an appendix if necessary)
4) Update CI + release docs to target the new version explicitly
