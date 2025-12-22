const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync("tests/manifest.devnet.json","utf8"));

function hasMarketIdDef(s){ return /const\s+marketId\s*=/.test(s); }
function usesMarketId(s){ return /\bmarketId\b/.test(s); }

function firstUseIdx(lines){
  const good = (t) => (
    t.includes("writeBigUInt64LE") ||
    t.includes("publishMarketVfinal") ||
    t.includes("findProgramAddress") ||
    t.includes("findPdas(") ||
    t.includes(".accounts(") ||
    t.includes(".methods.")
  );
  for (let i=0;i<lines.length;i++){
    const t = lines[i].trim();
    if (t.startsWith("//")) continue;
    if (!t.includes("marketId")) continue;
    if (t.includes("marketIdFromLabel")) continue;
    if (good(t)) return i;
  }
  for (let i=0;i<lines.length;i++){
    const t = lines[i].trim();
    if (t.startsWith("//")) continue;
    if (t.includes("marketId") && !t.includes("marketIdFromLabel")) return i;
  }
  return -1;
}
function insertAfterDescribe(lines){
  const d = lines.findIndex(l => l.includes("describe("));
  if (d === -1) throw new Error("No describe() found");
  let b = d;
  while (b < lines.length && !lines[b].includes("{")) b++;
  if (b >= lines.length) throw new Error("No { for describe()");
  return b + 1;
}

let changed = 0;

for (const file of manifest) {
  let s = fs.readFileSync(file,"utf8");
  if (!usesMarketId(s)) { console.log("[skip] no marketId:", file); continue; }
  if (hasMarketIdDef(s)) { console.log("[skip] has marketId:", file); continue; }

  const lines = s.split("\n");
  let idx = firstUseIdx(lines);
  if (idx === -1) idx = insertAfterDescribe(lines);

  const indent = (lines[idx] ?? "  ").match(/^\s*/)?.[0] ?? "  ";
  lines.splice(idx, 0, `${indent}const marketId = marketIdFromLabel("${file}");`, "");
  fs.writeFileSync(file, lines.join("\n"));
  console.log("[ok] inserted marketId:", file);
  changed++;
}
if (changed === 0) console.log("[info] no files changed");
