const fs = require("fs");
const p = process.argv[2];
if (!p) { console.error("usage: node scripts/print-manifest.js <path>"); process.exit(2); }
const arr = JSON.parse(fs.readFileSync(p, "utf8"));
if (!Array.isArray(arr)) { console.error("manifest must be a JSON array"); process.exit(2); }
process.stdout.write(arr.join(" "));
