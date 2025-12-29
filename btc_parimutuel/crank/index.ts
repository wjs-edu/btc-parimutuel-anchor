async function rpcRetry<T>(fn:()=>Promise<T>, label:string, tries=5){
  for(let i=0;i<tries;i++){
    try{ return await fn(); }catch(e:any){
      console.error(`[] attempt / failed:`, (e?.message||e));
      const msg=String(e?.message||e);
      if(msg.includes("AccountNotInitialized")||msg.includes("InstructionFallbackNotFound")||msg.includes("AccountDiscriminatorMismatch")) throw e;
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
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
const PROGRAM_ID = new anchor.web3.PublicKey(process.env.CRANK_PROGRAM_ID || "328SxemHPfb2Y2pBeH5FgZfP3dtquXUhTCYQ7L2XDf4r");
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
  const normalizeIdl=(idl:any)=>{
  if(!idl.name&&idl.metadata?.name) idl.name=idl.metadata.name;
  idl.metadata=idl.metadata||{};
  if(!idl.metadata.address&&idl.address) idl.metadata.address=idl.address;

  // CRITICAL: Anchor Program build will crash if idl.accounts contains undefined entries
  if(Array.isArray(idl.accounts)){
    idl.accounts = idl.accounts.filter(Boolean).map((x:any)=>{
      if(x.size===undefined) x.size=0;
      if(x.type===undefined) x.type={kind:"struct",fields:[]};
      return x;
    });
  } else {
    idl.accounts = [];
  }
  return idl;
};
const idlRaw = loadIdl();
  const idl=normalizeIdl(idlRaw); const coder = new (anchor as any).BorshCoder(idl);

// --- vFinal deterministic helpers (no program.methods / no program.account.fetch) ---

function ixData(coder: anchor.BorshCoder, name: string, args: any) {
  return coder.instruction.encode(name, args);
}

function toPubkey(x:any){
  if(!x) throw new Error("toPubkey: empty");
  if(x instanceof PublicKey) return x;
  if(typeof x==="string") return new PublicKey(x.trim());
  if(typeof x.toBase58==="function") return new PublicKey(x.toBase58());
  if(x?.data && Array.isArray(x.data)) return new PublicKey(Uint8Array.from(x.data));
  if(x instanceof Uint8Array || Buffer.isBuffer(x)) return new PublicKey(x);
  throw new Error("toPubkey: unsupported " + Object.prototype.toString.call(x));
}

async function fetchVfinalMarketDecoded(opts: {
  connection: anchor.web3.Connection;
  coder: anchor.BorshCoder;
  marketPda: PublicKey;
}): Promise<any> {
  const info = await opts.connection.getAccountInfo(opts.marketPda, "confirmed");
  if (!info?.data) throw new Error("Market PDA not found: " + opts.marketPda.toBase58());
  return opts.coder.accounts.decode("VFinalMarket", info.data);
}

async function sendIx(opts: {
  provider: anchor.AnchorProvider;
  programId: PublicKey;
  keys: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[];
  data: Buffer;
  label: string;
}) {
  const ix = new anchor.web3.TransactionInstruction({
    programId: opts.programId,
    keys: opts.keys,
    data: opts.data,
  });
  return rpcRetry(
    () =>
      opts.provider.sendAndConfirm(new anchor.web3.Transaction().add(ix), [], {
        commitment: "confirmed",
      }),
    opts.label
  );
}

  const programId = PROGRAM_ID as unknown as PublicKey;
  let program: any = null;
  // For lifecycle commands we do NOT need Anchor Program; we use coder+sendIx+explicit PDAs.
  // Anchor Program constructor is brittle with some IDL account metadata.
  if (cmd === "refund") {
    (program.provider as any).publicKey = provider.wallet.publicKey;
  }
  if(cmd==="commit"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const side=parseInt((args[args.indexOf("--side")+1]||"1"),10); const amt=new BN(args[args.indexOf("--amount")+1]||"1000000");
    const { usdcMint, userAta } = await loadOrCreateUsdc(provider, mid); const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    const marketPda=anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("market_v1"), u64le(mid)], PROGRAM_ID)[0];
    const commitPoolPda=anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("commit_pool_v1"), marketPda.toBuffer()], PROGRAM_ID)[0];
    const commitVaultPda=anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("commit_vault_v1"), marketPda.toBuffer()], PROGRAM_ID)[0];
    const commitmentPda=anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("commitment_v1"), marketPda.toBuffer(), provider.wallet.publicKey.toBuffer()], PROGRAM_ID)[0];
    const data=(coder as any).instruction.encode("commit_vfinal",{market_id:new BN(mid), side, amount:amt});
    const ix=new anchor.web3.TransactionInstruction({ programId: PROGRAM_ID, keys:[
      {pubkey:provider.wallet.publicKey,isSigner:true,isWritable:true},
      {pubkey:marketPda,isSigner:false,isWritable:false},
      {pubkey:commitPoolPda,isSigner:false,isWritable:true},
      {pubkey:commitVaultPda,isSigner:false,isWritable:true},
      {pubkey:commitmentPda,isSigner:false,isWritable:true},
      {pubkey:userAta,isSigner:false,isWritable:true},
      {pubkey:usdcMint,isSigner:false,isWritable:false},
      {pubkey:anchor.web3.SystemProgram.programId,isSigner:false,isWritable:false},
      {pubkey:TOKEN_PROGRAM_ID,isSigner:false,isWritable:false},
      {pubkey:anchor.web3.SYSVAR_RENT_PUBKEY,isSigner:false,isWritable:false},
    ], data });
    const sig=await rpcRetry(()=> provider.sendAndConfirm(new anchor.web3.Transaction().add(ix), [], {commitment:"confirmed"}), "commit");
    console.log("Commit sig:", sig); writeEvidenceCommit(mid, sig); return; }
    if(program) await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey);
  if(cmd==="settle"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const wait=args.includes("--wait"); const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    if(wait){ const mkt:any=await fetchVfinalMarketDecoded({ connection: provider.connection, coder, marketPda: pdas.marketPda });
      const closeRaw:any = (mkt.commitCloseTs ?? mkt.commit_close_ts);
      if(!closeRaw) throw new Error("commitCloseTs missing on VFinalMarket; keys=" + Object.keys(mkt).join(","));
      const close=parseInt(closeRaw.toString(),10);
      const slot=await provider.connection.getSlot("confirmed"); const now=(await provider.connection.getBlockTime(slot)) ?? Math.floor(Date.now()/1000);
      const s=Math.max(0, close-now+2); if(s>0) await new Promise(r=>setTimeout(r,s*1000)); }
    const data = ixData(coder, "settle_commit_close_vfinal", { _market_id: new BN(mid) });
    const sig = await sendIx({ provider, programId, label: "settle", keys: [
      { pubkey: pdas.marketPda, isSigner: false, isWritable: true },
      { pubkey: pdas.commitPoolPda, isSigner: false, isWritable: true },
    ], data });
    console.log("Settle sig:", sig); writeEvidenceSettle(mid, String(sig)); return; }
    if(program) await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey);
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
    if(program) await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey); return; }
    if(program) await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey);
  if(cmd==="init_receipt"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    const receipt=PublicKey.findProgramAddressSync([Buffer.from("receipt_v1"), pdas.marketPda.toBuffer(), provider.wallet.publicKey.toBuffer()], programId)[0];
    const disc=crypto.createHash("sha256").update("global:init_receipt_v1","utf8").digest().subarray(0,8);
    const data=Buffer.concat([disc, u64le(mid), Buffer.from([0])]);
    console.log("init_receipt data len", data.length, "hex", data.toString("hex"));
    const sig = await sendIx({ provider, programId, label: "init_receipt", keys: [
      { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false },
      { pubkey: pdas.marketPda, isSigner: false, isWritable: false },
      { pubkey: receipt, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ], data });
    console.log("InitReceipt sig:",sig); writeEvidenceInitReceipt(mid,String(sig)); if(program) await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey); return; }
  if(cmd==="resolve"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const side=parseInt((args[args.indexOf("--winning-side")+1]||"1"),10);
    const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    const data = ixData(coder, "resolve_market_vfinal", { _market_id: new BN(mid), winning_side: Number(side) });
    const sig = await sendIx({ provider, programId, label: "resolve", keys: [
      { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false },
      { pubkey: pdas.marketPda, isSigner: false, isWritable: true },
      { pubkey: pdas.commitPoolPda, isSigner: false, isWritable: true },
    ], data });
    console.log("Resolve sig:",sig); writeEvidenceResolve(mid,String(sig)); if(program) await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey); return; }
  if(cmd==="claim"){ mid=String(args[args.indexOf("--market-id")+1]||""); if(!mid){ usage(); process.exit(1); }
    const pdas=deriveCommitPdas(programId, mid, provider.wallet.publicKey);
    const receipt=PublicKey.findProgramAddressSync([Buffer.from("receipt_v1"), pdas.marketPda.toBuffer(), provider.wallet.publicKey.toBuffer()], programId)[0];
    const mkt:any = await fetchVfinalMarketDecoded({ connection: provider.connection, coder, marketPda: pdas.marketPda });
    const envMint=(process.env.CRANK_USDC_MINT||"").trim();
      const fileMint=fs.readFileSync(path.join("evidence", mid, "usdc_mint.txt"),"utf8").trim();
      const mintSrc=envMint||fileMint;
      console.log("[claim] mintSrc=", mintSrc);
      const usdcMint = new PublicKey(mintSrc);
    const userUsdcAta = getAssociatedTokenAddressSync(usdcMint, provider.wallet.publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const data = ixData(coder, "claim_payout_vfinal", { _market_id: new BN(mid) });
    const sig = await sendIx({ provider, programId, label: "claim", keys: [
      { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false },
      { pubkey: pdas.marketPda, isSigner: false, isWritable: true },
      { pubkey: pdas.commitPoolPda, isSigner: false, isWritable: true },
      { pubkey: pdas.commitVaultPda, isSigner: false, isWritable: true },
      { pubkey: pdas.commitmentPda, isSigner: false, isWritable: true },
      { pubkey: userUsdcAta, isSigner: false, isWritable: true },
      { pubkey: receipt, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ], data });
    console.log("Claim sig:",sig); writeEvidenceClaim(mid,String(sig)); if(program) await writeSnapshots(program as any, programId, mid, provider.wallet.publicKey); return; }
  const mi=args.indexOf("--market"); const marketPath=(mi!==-1 && args[mi+1])?args[mi+1]:""; if(!marketPath){ usage(); process.exit(1); }
  const raw=fs.readFileSync(marketPath,"utf8"); const paramsHash=sha256Hex(canonicalizeParams(raw));
  console.log("Crank Runner v0"); console.log("Market file:", marketPath); console.log("Params Hash:", paramsHash);
  console.log("Program ID:", programId.toBase58()); const m:any=JSON.parse(raw);
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
  if(program) await writeSnapshots(program as any, programId, marketIdStr, provider.wallet.publicKey);
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
  const mintPath=path.join(d,"usdc_mint.txt");
  const owner=provider.wallet.publicKey;
  const ataPath=path.join(d,`user_ata_${owner.toBase58()}.txt`);

  const payer=(provider.wallet as any).payer;
    const envMint = (process.env.CRANK_USDC_MINT || "").trim();
  const conn=provider.connection;

    // 1) Mint selection (CRANK_USDC_MINT override supported)
    let usdcMint: PublicKey;
    if(envMint){
      usdcMint = new PublicKey(envMint);
      fs.writeFileSync(mintPath, usdcMint.toBase58()+"\n");
    } else if(fs.existsSync(mintPath)){
      usdcMint = new PublicKey(fs.readFileSync(mintPath,"utf8").trim());
    } else {
      usdcMint = await createMint(conn, payer, owner, null, 6);
      fs.writeFileSync(mintPath, usdcMint.toBase58()+"\n");
    }

  // 2) ATA is per-wallet for that mint.
  const ata = await getOrCreateAssociatedTokenAccount(conn, payer, usdcMint, owner);
  fs.writeFileSync(ataPath, ata.address.toBase58()+"\n");

  // 3) Dev-only funding (guarded). Safe to call repeatedly.
  if(process.env.ALLOW_DEVNET_MINT === "true"){
    await mintTo(conn, payer, usdcMint, ata.address, owner, 300_000_000); // 300 USDC
  }

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
