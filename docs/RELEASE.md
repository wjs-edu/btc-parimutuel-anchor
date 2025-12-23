# Release Process — vFinal (Minimal, Deterministic)

## Required before merge (every PR)
- Devnet gate CI is green (A1–A5 only).
- No-drift checks pass (toolchain matches ci/MANIFEST.md).

## Manual devnet spot-check (before tagging)
- One Proof market open+lock path works end-to-end.
- One Proof market cancel+refund path works end-to-end.
- Claim order independence test remains green.

## Tagging
- After first green devnet gate on main: tag `phase-a6-devnet-green`.
- CI config is frozen; changes require explicit PR and rationale.

## Rollback
- If main breaks: revert the merge commit immediately.
- If devnet state causes conflicts: use namespace-safe IDs; do not “reset” devnet assumptions.
