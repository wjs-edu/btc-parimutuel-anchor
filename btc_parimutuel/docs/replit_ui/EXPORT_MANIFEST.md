# Export Manifest

This document defines the exact artifacts required to deploy the "CommitClose Partner Proof Hub" (Pilot UI).

## 1. Build Output
The canonical build output is located in btc_parimutuel/btc_parimutuel/client/dist/`.
This folder contains the fully compiled, static Single Page Application (SPA).

- **Type**: Static HTML/CSS/JS (SPA)
- **Router**: Client-side (wouter)
- **Entry Point**: `index.html`

## 2. Deployment Requirements

### Required Files (Must be copied to web root)
| File / Folder | Purpose |
|---------------|---------|
| `index.html` | Application entry point and SPA router handler. |
| `assets/` | Compiled JavaScript and CSS bundles (hashed). |
| `favicon.png` | Site icon. |
| `opengraph.jpg` | Social sharing card image. |

### Configuration (Server-Side)
- **SPA Routing**: The web server (Nginx, Cloudflare, Node) **MUST** be configured to serve `index.html` for all unknown paths (404 rewrite).
- **SSL**: HTTPS is mandatory for production.
- **Cache Headers**:
  - `index.html`: `no-cache` (or short TTL)
  - `assets/*`: `public, max-age=31536000, immutable`

## 3. Optional Files
- `robots.txt`: If search indexing control is required.
- `sitemap.xml`: Not currently generated (application is deep-link driven).

## 4. Canonical Repo Integration
When merging this export into the canonical repository:

1. Copy the contents of btc_parimutuel/btc_parimutuel/client/dist/` to the repo's public web folder (e.g., `public/` or `www/`).
2. Ensure no existing files overwrite `index.html` unless intentional.
3. Commit the artifacts to ensure the deployed version is immutable and version-controlled.
