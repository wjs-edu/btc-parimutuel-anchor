# Export Instructions

This project is prepared for static deployment (frontend only).

## 1. Build Command

To build **only** the static frontend (skipping the Node.js server build) and output to `client/dist` as requested:

```bash
npx vite build --outDir dist --emptyOutDir
```

## 2. Output Location

The static build artifacts will be located in:

```
client/dist/
```

This folder contains `index.html` and `assets/`. This is the folder you should deploy to your static hosting provider (Cloudflare Pages, Vercel, Netlify, DigitalOcean App Platform Static Site).

## 3. Testing Locally

To test the static build locally using a simple static server:

```bash
# 1. Build
npx vite build --outDir dist --emptyOutDir

# 2. Serve
npx serve client/dist
```

Navigate to `http://localhost:3000` (or the port shown) to verify.

## 4. Deployment Configuration

This UI is designed to be served from `proof.commitclose.com`.

- **Single Page App (SPA) Routing**: Ensure your static host is configured to rewrite all 404s to `index.html`.
  - **Cloudflare Pages**: Automatically handles this if `index.html` is at root.
  - **Netlify**: Add a `_redirects` file with `/*  /index.html  200`.
  - **DigitalOcean**: Configure "Catchall Document" to `index.html`.

## 5. Environment & Constants

- **Canonical MID**: `1766958659` (Default if no MID provided)
- **Program ID**: `328SxemHPfb2Y2pBeH5FgZfP3dtquXUhTCYQ7L2XDf4r`
## 6. Versioning

This build includes a visible version stamp in the footer. To update the version before building:

1. Edit `client/src/lib/buildInfo.ts`
2. Update the `BUILD_VERSION` and `BUILD_DATE` constants.

See `VERSIONING.md` for more details on automated version injection.
