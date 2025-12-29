# Client Constraints & Determinism

This document serves as the single source of truth for protocol constants and deterministic behavior requirements.

## Protocol Constants

| Constant | Value | Description |
|----------|-------|-------------|
| **MID_DEFAULT** | `1766958659` | Canonical Market ID used for default views and fallback. |
| **PROGRAM_ID** | `328SxemHPfb2Y2pBeH5FgZfP3dtquXUhTCYQ7L2XDf4r` | The immutable program ID for all verification logic. |

## Data Fetching Pattern

All status and proof data **MUST** be fetched using the following deterministic pattern:

```
GET /status/<MID>.json
```

- **Relative Path**: All fetches must use relative paths to support IPFS/Arweave/Static hosting.
- **No Query Params**: Do not append `?t=` or other cache busters. Rely on content hashing or CDN configuration.

## Validation Logic

### MID (Market ID)
- **Type**: String (numeric)
- **Constraint**: Must be a sequence of digits `^[0-9]+$`
- **Behavior**:
  - If valid: Render page.
  - If invalid (NaN, alpha characters): Display `InvalidMid` component with a link back to `/proof/<MID_DEFAULT>`.

### Program ID
- **Constraint**: Must match the constant above exactly.
- **Behavior**: Hardcoded in UI components. Do not fetch dynamically to prevent man-in-the-middle attacks on the verification logic.

## Zero Drift Policy

1. **No Backend Dependency**: The UI must function 100% via static JSON files.
2. **No Absolute URLs**: All internal links and fetches must be relative.
3. **Canonical Routing**: 404s on deep links must rewrite to `index.html` (SPA fallback) to ensure the client router handles the deterministic ID validation.
