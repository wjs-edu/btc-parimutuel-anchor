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
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
const PROGRAM_ID = new anchor.web3.PublicKey(process.env.CRANK_PROGRAM_ID || "QvRjL6RbUCg1pCxskrxBpiuoJ94iEghWddwYipjAQpz");
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
function normalizeIdl(idl:any){ if(!idl.name&&idl.metadata?.name) idl.name=idl.metadata.name; idl.metadata=idl.metadata||{}; if(!idl.metadata.address&&idl.address) idl.metadata.address=idl.address; if(Array.isArray(idl.accounts)) for(const x of idl.accounts){ if(x&&x.size===undefined) x.size=0; if(x&&x.type===undefined) x.type={kind:"struct",fields:[]}; } return idl; }
}
async function main(){
  const args=process.argv.slice(2); const cmd=args[0];
  let mid = "";
  if(cmd!=="run" && cmd!=="commit" && cmd!=="settle" && cmd!=="refund" && cmd!=="init_receipt" && cmd!=="resolve" && cmd!=="claim"){ usage(); process.exit(1); }
  const provider=anchor.AnchorProvider.env(); anchor.setProvider(provider);
  (provider as any).publicKey = provider.wallet.publicKey;
  console.log('Provider publicKey:', (provider as any).publicKey?.toBase58?.() || String((provider as any).publicKey));
  const normalizeIdl=(idl:any)=>{ if(!idl.name&&idl.metadata?.name) idl.name=idl.metadata.name; idl.metadata=idl.metadata||{}; if(!idl.metadata.address&&idl.address) idl.metadata.address=idl.address; if(Array.isArray(idl.accounts)) for(const x of idl.accounts){ if(x&&x.size===undefined) x.size=0; if(x&&x.type===undefined) x.type={kind:"struct",fields:[]}; } idl.accounts=[]; return idl; };
const idlRaw=(await Program.fetchIdl(PROGRAM_ID as any, provider as any)) ?? normalizeIdl(loadIdl());
  const idl=normalizeIdl(idlRaw); idl.accounts=[]; const coder = new (anchor as any).BorshCoder(idl);
  const program=new Program(idl as any, PROGRAM_ID as any, provider as any);
  (program.provider as any).publicKey = provider.wallet.publicKey;
  const programId = program.programId as unknown as PublicKey;
  if(cmd==="commit"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const side=parseInt((args[args.indexOf("--side")+1]||"1"),10); const amt=new BN(args[args.indexOf("--amount")+1]||"1000000");
    const { usdcMint, userAta } = await loadOrCreateUsdc(provider, mid); const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    const sig=await rpcRetry(() => program.methods.commitVfinal(new BN(mid), side, amt).accounts({ user:provider.wallet.publicKey, market:pdas.marketPda, commitPool:pdas.commitPoolPda, commitVault:pdas.commitVaultPda, commitment:pdas.commitmentPda, userUsdcAta:userAta, usdcMint, systemProgram:SystemProgram.programId, tokenProgram:TOKEN_PROGRAM_ID, rent:anchor.web3.SYSVAR_RENT_PUBKEY }).rpc({commitment:"confirmed"}), "commit");
    console.log("Commit sig:", sig); writeEvidenceCommit(mid, sig); return; }
    await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey);
  if(cmd==="settle"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const wait=args.includes("--wait"); const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    if(wait){ const mkt:any=await (program as any).account.vFinalMarket.fetch(pdas.marketPda); const close=parseInt(mkt.commitCloseTs.toString(),10);
      const slot=await provider.connection.getSlot("confirmed"); const now=(await provider.connection.getBlockTime(slot)) ?? Math.floor(Date.now()/1000);
      const s=Math.max(0, close-now+2); if(s>0) await new Promise(r=>setTimeout(r,s*1000)); }
    const sig=await rpcRetry(() => (program as any).methods.settleCommitCloseVfinal(new BN(mid)).accounts({ market: pdas.marketPda, commitPool: pdas.commitPoolPda }).rpc({commitment:"confirmed"}), "settle");
    console.log("Settle sig:", sig); writeEvidenceSettle(mid, String(sig)); return; }
    await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey);
  if(cmd==="refund"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const { userAta }=await loadOrCreateUsdc(provider, mid); const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    let sig:any=null;
    try{
      sig=await (program as any).methods.refundCommitmentVfinal(new BN(mid)).accounts({ user:provider.wallet.publicKey, market:pdas.marketPda, commitPool:pdas.commitPoolPda, commitVault:pdas.commitVaultPda, commitment:pdas.commitmentPda, userUsdcAta:userAta, tokenProgram:TOKEN_PROGRAM_ID }).rpc({commitment:"confirmed"});
      console.log("Refund sig:", sig); writeEvidenceRefund(mid, String(sig));
    }catch(e:any){
      const msg=String(e?.message||e); if(!msg.includes("NoCommitment")) throw e;
      console.log("Refund: already refunded (NoCommitment) — continuing to snapshots");
    }
    await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey); return; }
    await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey);
  if(cmd==="init_receipt"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    const receipt=PublicKey.findProgramAddressSync([Buffer.from("receipt_v1"), pdas.marketPda.toBuffer(), provider.wallet.publicKey.toBuffer()], programId)[0];
    const sig=await rpcRetry(()=> (program as any).methods.initReceiptV1(new BN(mid)).accounts({ user:provider.wallet.publicKey, market:pdas.marketPda, receipt, systemProgram:SystemProgram.programId }).rpc({commitment:"confirmed"}),"init_receipt");
    console.log("InitReceipt sig:",sig); writeEvidenceInitReceipt(mid,String(sig)); await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey); return; }
  if(cmd==="resolve"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const side=parseInt((args[args.indexOf("--winning-side")+1]||"1"),10);
    const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    const sig=await rpcRetry(()=> (program as any).methods.resolveMarketVfinal(new BN(mid), side).accounts({ admin:provider.wallet.publicKey, market:pdas.marketPda, commitPool:pdas.commitPoolPda }).rpc({commitment:"confirmed"}),"resolve");
    console.log("Resolve sig:",sig); writeEvidenceResolve(mid,String(sig)); await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey); return; }
  if(cmd==="claim"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    const receipt=PublicKey.findProgramAddressSync([Buffer.from("receipt_v1"), pdas.marketPda.toBuffer(), provider.wallet.publicKey.toBuffer()], programId)[0];
    const { userAta }=await loadOrCreateUsdc(provider, mid);
    const sig=await rpcRetry(()=> (program as any).methods.claimPayoutVfinal(new BN(mid)).accounts({ user:provider.wallet.publicKey, market:pdas.marketPda, commitPool:pdas.commitPoolPda, commitVault:pdas.commitVaultPda, commitment:pdas.commitmentPda, userUsdcAta:userAta, receipt, tokenProgram:TOKEN_PROGRAM_ID }).rpc({commitment:"confirmed"}),"claim");
    console.log("Claim sig:",sig); writeEvidenceClaim(mid,String(sig)); await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey); return; }
  const mi=args.indexOf("--market"); const marketPath=(mi!==-1 && args[mi+1])?args[mi+1]:""; if(!marketPath){ usage(); process.exit(1); }
  const raw=fs.readFileSync(marketPath,"utf8"); const paramsHash=sha256Hex(canonicalizeParams(raw));
  console.log("Crank Runner v0"); console.log("Market file:", marketPath); console.log("Params Hash:", paramsHash);
  console.log("Program ID:", program.programId.toBase58()); const m:any=JSON.parse(raw);
  const marketIdStr=(m.market_id ?? Math.floor(Date.now()/1000)).toString(); const now=Math.floor(Date.now()/1000);
  mid = marketIdStr;
  const closeInSec=(args.includes("--close-in-sec")?parseInt(args[args.indexOf("--close-in-sec")+1],10):null);
  const minOpenUsd=(args.includes("--min-open-usd")?parseInt(args[args.indexOf("--min-open-usd")+1],10):null);
  const commitOpenTs=new BN(m.commit_open_ts ?? now); const v=(m.variant ?? 0); const winSec=(v===0 ? 6*3600 : 24*3600);
  const commitCloseTs=new BN(m.commit_close_ts ?? (closeInSec? (now+closeInSec): (now+winSec)));
  const resolutionTs=new BN(m.resolution_ts ?? (closeInSec? (now+closeInSec+60): (now+winSec+3600)));
  const publishArgs:any={ variant:m.variant ?? 0, creator:provider.wallet.publicKey,
  commit_open_ts:commitOpenTs, commit_close_ts:commitCloseTs, resolution_ts:resolutionTs,
  override_min_to_open_usd:(minOpenUsd!==null? new BN(minOpenUsd):(m.override_min_to_open_usd ?? null)),
  override_bet_cutoff_ts:(m.override_bet_cutoff_ts ?? null) };
  console.log("Publishing market ID:", marketIdStr);
  const marketPda=anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("market_v1"), u64le(marketIdStr)], PROGRAM_ID)[0];
  const data=(coder as any).instruction.encode("publish_market_vfinal",{market_id:new BN(marketIdStr), args: publishArgs});
  const ix=new anchor.web3.TransactionInstruction({ programId: PROGRAM_ID, keys:[
    {pubkey:provider.wallet.publicKey,isSigner:true,isWritable:true},
    {pubkey:marketPda,isSigner:false,isWritable:true},
    {pubkey:anchor.web3.SystemProgram.programId,isSigner:false,isWritable:false},
  ], data });
  const sig=await rpcRetry(()=> provider.sendAndConfirm(new anchor.web3.Transaction().add(ix), [], {commitment:"confirmed"}), "publish");
  console.log("Publish sig:", sig); writeEvidencePublished(marketIdStr, paramsHash, raw, sig);
  await writeSnapshots(program as any, programId, marketIdStr, provider.wallet.publicKey);
}
main().catch(e=>{ console.error(e); process.exit(1); });
function u64le(n: string){
  const b=Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b;
}
function deriveCommitPdas(programId: PublicKey, marketIdStr: string, user: PublicKey){
  const [marketPda]=PublicKey.findProgramAddressSync([Buffer.from("market_v1"), u64le(marketIdStr)], programId);
  const [commitPoolPda]=PublicKey.findProgramAddressSync([Buffer.from("commit_pool_v1"), marketPda.toBuffer()], programId);
  const [commitVaultPda]=PublicKey.findProgramAddressSync([Buffer.from("commit_vault_v1"), marketPda.toBuffer()], programId);
  const [commitmentPda]=PublicKey.findProgramAddressSync([Buffer.from("commitment_v1"), marketPda.toBuffer(), user.toBuffer()], programId);
  return { marketPda, commitPoolPda, commitVaultPda, commitmentPda };
}
async function loadOrCreateUsdc(provider: anchor.AnchorProvider, marketIdStr: string){
  const d=path.join("evidence", marketIdStr); fs.mkdirSync(d,{recursive:true});
  const mintPath=path.join(d,"usdc_mint.txt"), ataPath=path.join(d,"user_ata.txt");
  const admin=provider.wallet.publicKey, payer=(provider.wallet as any).payer, conn=provider.connection;
  if(fs.existsSync(mintPath) && fs.existsSync(ataPath)){
    return { usdcMint:new PublicKey(fs.readFileSync(mintPath,"utf8").trim()), userAta:new PublicKey(fs.readFileSync(ataPath,"utf8").trim()) };
  }
  const usdcMint=await createMint(conn,payer,admin,null,6);
  const ata=await getOrCreateAssociatedTokenAccount(conn,payer,usdcMint,admin);
  fs.writeFileSync(mintPath, usdcMint.toBase58()+"\n"); fs.writeFileSync(ataPath, ata.address.toBase58()+"\n");
  await mintTo(conn,payer,usdcMint,ata.address,admin,3_000_000_000); // 3000 USDC (6d)
  return { usdcMint, userAta: ata.address };
}
function writeEvidenceCommit(marketIdStr: string, sig: string){
  const d=path.join("evidence", marketIdStr); fs.mkdirSync(d,{recursive:true});
  fs.writeFileSync(path.join(d,"commit.sig.txt"), sig+"\n");
}
function writeEvidenceSettle(marketIdStr: string, sig: string){
  const d=path.join("evidence", marketIdStr); fs.mkdirSync(d,{recursive:true});
  fs.writeFileSync(path.join(d,"settle.sig.txt"), sig+"\n");
}
function writeEvidenceRefund(marketIdStr: string, sig: string){
  const d=path.join("evidence", marketIdStr); fs.mkdirSync(d,{recursive:true});
  fs.writeFileSync(path.join(d,"refund.sig.txt"), sig+"\n");
}
async function writeSnapshots(program:any, programId:any, mid:string, user:any){
  const fs=require('fs'); const path=require('path');
  const d=path.join('evidence', mid); fs.mkdirSync(d,{recursive:true});
  return;
}
function writeEvidenceInitReceipt(mid:string,sig:string){const d=path.join("evidence",mid);fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(d,"init_receipt.sig.txt"),sig+"\n");}
function writeEvidenceResolve(mid:string,sig:string){const d=path.join("evidence",mid);fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(d,"resolve.sig.txt"),sig+"\n");}
function writeEvidenceClaim(mid:string,sig:string){const d=path.join("evidence",mid);fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(d,"claim.sig.txt"),sig+"\n");}
