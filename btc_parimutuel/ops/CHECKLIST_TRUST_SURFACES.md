# Trust Surfaces Checklist (Phase 1 Gate)

Stop-the-line shipping gate:
- No “pending” or non-canonical statuses anywhere.
- No odds/PnL/profit language anywhere (especially during commitment).
- Open/cancel occurs only at commit_close_ts (no early open).
- Cancellation is framed as deterministic safety; refund is immediate with tx link.
- RESOLVED: status JSON includes resolve_sig + claim_sig; resolved bundle dir exists on disk.
- /status and /verify endpoints remain stable (paths + schema).
