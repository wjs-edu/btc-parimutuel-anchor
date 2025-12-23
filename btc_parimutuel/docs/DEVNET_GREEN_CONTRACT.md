# Devnet Green Contract (Phase A6)

## Default devnet gate
`yarn test:devnet` runs vFinal A1–A6 only (tests/manifest.devnet.json).

Classic suites do NOT run on devnet by default.

## Determinism rules
- Devnet tests must not assume clean slate.
- Market IDs must be deterministic and namespaced:
  - per-suite for independent suites
  - per-it for multi-it suites that mutate shared state (e.g. A5)

## Policy checks
Before merging:
- ./scripts/test_audit.sh must pass
- No describe.only / it.only
- No permanent describe.skip / it.skip (runtime cluster-gates only)

## Receipt scope (Phase A6 reality check)
- ReceiptV1 creation is currently enforced by classic `claim_payout` only.
- There is no vFinal claim instruction in the IDL today, so vFinal claim receipts require a program change.
- Receipt regression lives in classic tests (classic_smoke / fairness_order).

## Commands
- Devnet gate (vFinal A1–A5): `yarn test:devnet`
- Localnet full regression (classic + vFinal): `yarn test:localnet`
