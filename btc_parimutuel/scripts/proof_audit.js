const fs = require("fs");
const path = require("path");

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error("usage: node scripts/proof_audit.js <market_id> [...]");
  process.exit(2);
}

let ok = true;

for (const id of ids) {
  const sp = path.join("artifacts", "status", `${id}.json`);
  if (!fs.existsSync(sp)) { console.error(`FAIL ${id}: missing ${sp}`); ok = false; continue; }

  const raw = fs.readFileSync(sp, "utf8");
  if (raw.toLowerCase().includes("pending")) { console.error(`FAIL ${id}: forbidden "pending" in status json`); ok = false; }

  const st = JSON.parse(raw);
  const status = st.status;

  if (status === "RESOLVED") {
    if (!st.resolve_sig || !st.claim_sig) { console.error(`FAIL ${id}: RESOLVED missing resolve_sig/claim_sig`); ok = false; }
    const resolvedDir = path.join("artifacts", "resolved", id);
    if (!fs.existsSync(resolvedDir)) { console.error(`FAIL ${id}: missing ${resolvedDir}`); ok = false; }
  } else if (status === "CANCELED" || status === "OPENED") {
    console.error(`WARN ${id}: status=${status} has no persisted bundle dirs in artifacts/ at maxdepth=3 (resolved-only on disk today).`);
  } else {
    console.error(`WARN ${id}: unknown status "${status}" (audit hard-checks RESOLVED today).`);
  }
}

process.exit(ok ? 0 : 1);
