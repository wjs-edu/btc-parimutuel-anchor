const fs = require("fs");
const path = require("path");

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error("usage: node scripts/health_snapshot.js <market_id> [...]");
  process.exit(1);
}

for (const id of ids) {
  const p = path.join("artifacts", "status", `${id}.json`);
  const exists = fs.existsSync(p);
  const obj = exists ? JSON.parse(fs.readFileSync(p, "utf8")) : null;

  console.log(JSON.stringify({
    market_id: id,
    program_id: obj?.program_id ?? null,
    status: obj?.status ?? "UNKNOWN",
    resolve_sig: obj?.resolve_sig ?? null,
    claim_sig: obj?.claim_sig ?? null,
    status_file: exists ? p : null,
    links: {
      status: `/status/${id}.json`,
      verify_resolved: `/verify/resolved/${id}`,
      verify_canceled: `/verify/canceled/${id}`,
    },
  }));
}
