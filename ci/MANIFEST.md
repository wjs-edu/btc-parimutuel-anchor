# CI Manifest (Pinned Toolchain) — vFinal

## Purpose
This file pins the exact CI/dev toolchain versions to prevent upstream installer drift.
Do not change versions except via an explicit "Toolchain bump" PR.

## Canonical versions (LOCKED)
- Node: 20.x
- Yarn: 1.22.22
- Rust: 1.77.2
- Solana CLI: 1.18.26
- Anchor CLI: 0.32.1 (installed via `cargo install anchor-cli` — no avm)

## Upgrade rule
- No auto-upgrades.
- Only upgrade if CI breaks due to a forced upstream change OR a security requirement.
- Every upgrade requires:
  1) PR titled "Toolchain bump: <component> <old> → <new>"
  2) Updated rationale in this file
  3) One green Devnet gate run

## Last known good
- GitHub run: <ADD LINK AFTER FIRST GREEN>
- Devnet tx proof: <ADD TX SIG AFTER FIRST GREEN>
