# Founders Canon — vFinal (Non-Negotiables)

These rules are the constitution of BTC Parimutuel vFinal.
If a change conflicts with any rule here, it is blocked unless VERSIONING.md is followed and the version is bumped.

## Market lifecycle
- Markets MUST open or cancel only at commit_close_ts (batch decision).
- Markets MUST NOT open early, even if minimum is reached early.
- Markets MUST NOT open below minimum_to_open.

## Commitment phase
- Commitment ≠ betting.
- Commitments MUST convert into bets only at commit_close_ts.
- Users MUST NOT withdraw/cancel individually during commitment.
- UI MUST NOT show odds, payout estimates, or implied probabilities during commitment.

## Tier behavior
- Proof markets MUST lock immediately at Open (no post-open betting).
- Prime variants MAY allow post-open betting only until bet_cutoff_ts (default 12h after open).

## Cancellation
- Cancellation + refund MUST be deterministic and verifiable.
- Canceled markets MUST appear in history and include proof bundle links.
- Language MUST frame cancellation as the safety rule working.

## Language
- “pending” is forbidden in UI status vocabulary.

## CI / release discipline
- CI is a gatekeeper for the vFinal Devnet gate (A1–A5). If CI is red, do not merge.
- Toolchains MUST be pinned per ci/MANIFEST.md.
