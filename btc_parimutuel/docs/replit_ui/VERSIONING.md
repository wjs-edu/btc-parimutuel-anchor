# Versioning & Build Stamp

To ensure every screenshot can be tied to a specific release, the UI includes a build stamp in the footer.

## Configuration

The build information is stored in `client/src/lib/buildInfo.ts`.

```typescript
export const BUILD_VERSION = "v1.0.0-pilot";
export const BUILD_DATE = "2025-12-29";
export const COMMIT_SHA = "manual";
```

## Updating the Version

### Manual Update
Before running the build command, edit `client/src/lib/buildInfo.ts` with the current date and version tag.

### Automated Update (CI/CD)
If using a CI pipeline, you can use `sed` to replace these values before building:

```bash
# Example for GitHub Actions or Build Script
sed -i "s/manual/$(git rev-parse --short HEAD)/" client/src/lib/buildInfo.ts
sed -i "s/2025-12-29/$(date +%Y-%m-%d)/" client/src/lib/buildInfo.ts
```

## Display
The stamp is rendered in `client/src/components/Layout.tsx` as a non-intrusive footer element. It is purely informational and does not affect the canonical verification logic.
