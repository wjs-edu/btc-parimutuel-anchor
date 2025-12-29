# Routing Configuration

This project is a Single Page Application (SPA). For deep links to work (e.g. `/status/1766958659`), the web server must be configured to serve `index.html` for any unknown paths (rewrite 404s).

## Routes
The following routes must be supported and handled by the client-side router:

- `/status/:mid`
- `/proof/:mid`
- `/verify/resolved/:mid`
- `/verify/canceled/:mid`
- `/restricted`

## Server Configuration

### 1. Cloudflare Pages (Recommended)
Cloudflare Pages automatically handles SPA routing if the `index.html` is at the root. No additional configuration is required.

If using a custom `_routes.json` or workers, ensure:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*", "/favicon.png", "/opengraph.jpg"]
}
```

### 2. Nginx
Add `try_files` to your location block:

```nginx
server {
    listen 80;
    server_name proof.commitclose.com;
    root /var/www/proof-hub;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 3. Node.js (Express / Static Server)
If serving the `dist` folder via a Node server:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - return index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(3000);
```

## Deep Linking Behavior
- **Valid IDs**: Paths like `/status/1766958659` will load the app and Hydrate the specific view.
- **Invalid Formats**: Paths like `/status/abc` will load the app, which then displays a "Invalid ID Format" error state (client-side validation).
- **Unknown Routes**: Paths like `/unknown-page` will load the app and show the 404 Not Found component.

## Local Parity Test

To verify that the SPA works correctly when served from a static server with deep links (Production Parity):

### 1. Build the Application
```bash
npx vite build --outDir dist --emptyOutDir
```

### 2. Create a Minimal Production Server
Create a file named `server.js` in the project root to mimic production serving logic (static files first, then SPA fallback).

```javascript
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// 1. Serve Static Assets First (mimics Nginx/Cloudflare behavior)
// This ensures that /status/123.json is served as a file if it exists,
// rather than falling back to index.html
app.use(express.static(path.join(__dirname, 'dist')));

// 2. SPA Fallback (Rewrite 404s to index.html)
// This allows deep links like /proof/123 to work
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Production Parity Server running at http://localhost:${PORT}`);
  console.log('Test Links:');
  console.log(`- http://localhost:${PORT}/proof/1766958659 (SPA Deep Link)`);
  console.log(`- http://localhost:${PORT}/status/1766958659 (SPA Deep Link)`);
});
```

### 3. Run and Verify
```bash
# Install express if needed (for the test script only)
npm install express --no-save

# Run the parity server
node server.js
```

### 4. Verification Checklist
- [ ] Open `http://localhost:3000/proof/1766958659` -> Should render the Partner Proof Hub.
- [ ] Open `http://localhost:3000/status/1766958659` -> Should render the Status page.
- [ ] Request `http://localhost:3000/assets/index-*.js` -> Should return JS code (200 OK).
- [ ] Request `http://localhost:3000/unknown-path` -> Should render the App's 404 Not Found page (via SPA routing).
