async function rpcRetry<T>(fn:()=>Promise<T>, label:string, tries=5){
  for(let i=0;i<tries;i++){
    try{ return await fn(); }catch(e:any){
      console.error(`[${label}] attempt ${i+1}/${tries} failed:`, (e?.message||e));
      if(i===tries-1) throw e;
      await new Promise(r=>setTimeout(r, 500*(i+1)));
    }
  }
  throw new Error("unreachable");
}

import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BN } from "bn.js";
const PROGRAM_ID = new anchor.web3.PublicKey("QvRjL6RbUCg1pCxskrxBpiuoJ94iEghWddwYipjAQpz");
function sha256Hex(s:string){ return crypto.createHash("sha256").update(s,"utf8").digest("hex"); }
function sortKeys(x:any):any{
  if(x===null||x===undefined) return null;
  if(Array.isArray(x)) return x.map(sortKeys);
  if(typeof x==="object"){ const o:any={}; for(const k of Object.keys(x).sort()) o[k]=sortKeys(x[k]); return o; }
  return x;
}
function canonicalizeParams(raw:string){
  const obj = JSON.parse(raw);
  const canon = sortKeys(obj);
  return JSON.stringify(canon);
}
function writeEvidencePublished(marketId:string, paramsHash:string, raw:string, sig:string){
  const d = path.join("evidence", marketId); fs.mkdirSync(d,{recursive:true});
  fs.writeFileSync(path.join(d,"schema_version.txt"),"vfinal-p0\n");
  fs.writeFileSync(path.join(d,"market_id.txt"),marketId+"\n");
  fs.writeFileSync(path.join(d,"program_id.txt"),PROGRAM_ID.toBase58()+"\n");
  fs.writeFileSync(path.join(d,"params_hash.txt"),paramsHash+"\n");
  fs.writeFileSync(path.join(d,"params.json"),raw);
  fs.writeFileSync(path.join(d,"publish.sig.txt"),sig+"\n");
}
function usage(){
  console.log("Usage: npx ts-node crank/index.ts run --market crank/market.example.json");
}
function loadIdl(){
  const p="target/idl/btc_parimutuel.json";
  if(!fs.existsSync(p)) throw new Error("Missing target/idl/btc_parimutuel.json. Run: anchor build");
  return JSON.parse(fs.readFileSync(p,"utf8"));
}
async function main(){
  const args=process.argv.slice(2);
  const cmd=args[0];
  const mi=args.indexOf("--market");
  if(cmd!=="run"||mi===-1||!args[mi+1]){ usage(); process.exit(1); }
  const marketPath=args[mi+1];
  const raw=fs.readFileSync(marketPath,"utf8");
  const paramsJson=canonicalizeParams(raw);
  const paramsHash=sha256Hex(paramsJson);
  console.log("Crank Runner v0");
  console.log("Market file:", marketPath);
  console.log("Params Hash:", paramsHash);
  const provider=anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const idl=loadIdl();
  const program=new Program(idl as any, provider);
  console.log("Program ID:", program.programId.toBase58());
  const m:any=JSON.parse(raw);
  const marketIdStr=(m.market_id ?? Math.floor(Date.now()/1000)).toString();
  const now=Math.floor(Date.now()/1000);
  const commitOpenTs=new BN(m.commit_open_ts ?? now);
  const v=(m.variant ?? 0);
  const winSec=(v===0 ? 6*3600 : 24*3600);
  const commitCloseTs=new BN(m.commit_close_ts ?? (now+winSec));
  const resolutionTs=new BN(m.resolution_ts ?? (now+winSec+3600));
  const publishArgs:any={
    variant: m.variant ?? 0,
    creator: provider.wallet.publicKey,
    commitOpenTs, commitCloseTs, resolutionTs,
    overrideMinToOpenUsd: m.override_min_to_open_usd ?? null,
    overrideBetCutoffTs: m.override_bet_cutoff_ts ?? null,
  };
  console.log("Publishing market ID:", marketIdStr);
  const sig=await rpcRetry(() => program.methods.publishMarketVfinal(new BN(marketIdStr), publishArgs).rpc({commitment:"confirmed"}), "publish");
  console.log("Publish sig:", sig);
  writeEvidencePublished(marketIdStr, paramsHash, raw, sig);
}
main().catch(e=>{ console.error(e); process.exit(1); });
