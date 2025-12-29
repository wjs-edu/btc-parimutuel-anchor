const http=require("http"),fs=require("fs"),path=require("path"),u=require("url");
const root=process.cwd(), esc=s=>String(s).replace(/[&<>"]/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const tx=s=>`https://explorer.solana.com/tx/${s}?cluster=devnet`;
const send=(res,code,ct,body)=>{res.writeHead(code,{"content-type":ct});res.end(body);};
const distDir=path.join(root,"client","dist");
const indexHtml=path.join(distDir,"index.html");
const readIfFile=fp=>{
  try{
    const st=fs.statSync(fp);
    if(st.isFile()) return fs.readFileSync(fp);
  }catch(_){}
  return null;
};
const mime=fp=>{
  if(fp.endsWith(".html")) return "text/html; charset=utf-8";
  if(fp.endsWith(".js")) return "application/javascript";
  if(fp.endsWith(".css")) return "text/css";
  if(fp.endsWith(".json")) return "application/json";
  if(fp.endsWith(".svg")) return "image/svg+xml";
  if(fp.endsWith(".png")) return "image/png";
  if(fp.endsWith(".jpg")||fp.endsWith(".jpeg")) return "image/jpeg";
  if(fp.endsWith(".ico")) return "image/x-icon";
  if(fp.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
};

http.createServer((req,res)=>{
  const p=u.parse(req.url).pathname||"/";
  const m=p.match(/^\/(status|verify\/resolved|verify\/canceled)\/(\d+)(?:\.json)?$/);

  if(req.method==="POST" && p==="/intake/reserve-slot"){
    let body="";
    req.on("data",chunk=>{body+=chunk;});
    req.on("end",()=>{
      let payload;
      try{
        payload=JSON.parse(body||"{}");
      }catch(_){
        return send(res,400,"application/json",JSON.stringify({ok:false,error:"invalid_json"}));
      }
      const need=["tier_usd","company_legal","target_start_week","non_us_confirmed","compliance_email","infra_email","source_mid"];
      const missing=need.filter(k=>payload[k]===undefined||payload[k]===null||(typeof payload[k]==="string"&&payload[k].trim()===""));
      if(missing.length>0) return send(res,400,"application/json",JSON.stringify({ok:false,error:"missing_fields"}));
      if(payload.non_us_confirmed!==true) return send(res,400,"application/json",JSON.stringify({ok:false,error:"non_us_confirmation_required"}));
      const allowedTiers=new Set([25000,50000,75000]);
      const tier=Number(payload.tier_usd);
      if(!allowedTiers.has(tier)) return send(res,400,"application/json",JSON.stringify({ok:false,error:"invalid_tier_usd"}));
      const request_id=`rs_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
      const received_utc=new Date().toISOString();
      const record={
        request_id,
        tier_usd:tier,
        company_legal:String(payload.company_legal).trim(),
        target_start_week:String(payload.target_start_week).trim(),
        non_us_confirmed:true,
        compliance_email:String(payload.compliance_email).trim(),
        infra_email:String(payload.infra_email).trim(),
        source_mid:String(payload.source_mid).trim(),
        ip:req.socket.remoteAddress||"",
        user_agent:req.headers["user-agent"]||"",
        received_utc
      };
      const dir=path.join(root,"artifacts","intake");
      fs.mkdirSync(dir,{recursive:true});
      const dest=path.join(dir,"reserve_slot_requests.jsonl");
      fs.appendFileSync(dest,JSON.stringify(record)+"\n");
      return send(res,200,"application/json",JSON.stringify({ok:true,request_id,received_utc}));
    });
    return;
  }

  if(m){
    const kind=m[1], id=m[2], isJson=p.endsWith(".json");
    if(kind==="status" && !isJson){
      // fall through to SPA handling for /status/:mid
    }else if(kind==="status"){
      const fp=path.join(root,`artifacts/status/${id}.json`);
      if(!fs.existsSync(fp)) return send(res,404,"text/plain","status not found");
      return send(res,200,"application/json",fs.readFileSync(fp));
    }else if(kind==="verify/canceled"){
      const dir=path.join(root,`artifacts/canceled/${id}`), need=["close.sig.txt","market.account.json"];
      if(!need.every(f=>fs.existsSync(path.join(dir,f)))) return send(res,404,"text/plain","bundle not found");
      const close=fs.readFileSync(path.join(dir,"close.sig.txt"),"utf8").trim();
      const market=fs.readFileSync(path.join(dir,"market.account.json"),"utf8");
      return send(res,200,"text/html; charset=utf-8",`<!doctype html><meta charset=\"utf-8\"><title>Verify Canceled ${esc(id)}</title><h1>Verify: CANCELED Market ${esc(id)}</h1><p><b>Proves:</b> deterministic on-chain application of rules (tx + account artifacts).</p><p><b>Does NOT prove:</b> oracle correctness or off-chain data sources.</p><ul><li>close_market (canceled): <a href=\"${tx(close)}\">${esc(close)}</a></li><li>status: <a href=\"/status/${esc(id)}.json\">/status/${esc(id)}.json</a></li></ul><h2>Market account snapshot</h2><pre style=\"white-space:pre-wrap\">${esc(market)}</pre>`);
    }else{
      const dir=path.join(root,`artifacts/resolved/${id}`), need=["resolve.sig.txt","claim.sig.txt","resolve.confirm.json","claim.confirm.json","market.account.json"];
      if(!need.every(f=>fs.existsSync(path.join(dir,f)))) return send(res,404,"text/plain","bundle not found");
      const r=fs.readFileSync(path.join(dir,"resolve.sig.txt"),"utf8").trim(), c=fs.readFileSync(path.join(dir,"claim.sig.txt"),"utf8").trim();
      const market=fs.readFileSync(path.join(dir,"market.account.json"),"utf8");
      return send(res,200,"text/html; charset=utf-8",`<!doctype html><meta charset=\"utf-8\"><title>Verify Resolved ${esc(id)}</title>
<h1>Verify: Resolved Market ${esc(id)}</h1>
<p><b>Proves:</b> deterministic on-chain application of rules (tx + account artifacts).</p>
<p><b>Does NOT prove:</b> oracle correctness or off-chain data sources.</p>
<ul><li>resolve_market: <a href=\"${tx(r)}\">${esc(r)}</a></li><li>claim_payout: <a href=\"${tx(c)}\">${esc(c)}</a></li><li>status: <a href=\"/status/${esc(id)}.json\">/status/${esc(id)}.json</a></li></ul>
<h2>Market account snapshot</h2><pre style=\"white-space:pre-wrap\">${esc(market)}</pre>`);
    }
  }

  if(req.method==="GET"){
    const cleanPath=p.replace(/^\\/+/, "");
    if(cleanPath){
      const target=path.normalize(cleanPath);
      const fp=path.join(distDir,target);
      if(fp.startsWith(distDir)){
        const body=readIfFile(fp);
        if(body!==null) return send(res,200,mime(fp),body);
      }
    }
  }

  if(/^\\/((proof|status)\\/\\d+)$/.test(p)){
    const body=readIfFile(indexHtml);
    if(body===null){
      return send(res,500,"text/plain","client build missing; cannot serve proof hub");
    }
    return send(res,200,"text/html; charset=utf-8",body);
  }

  res.writeHead(302,{Location:"/proof/1766958659"}); 
  res.end();
}).listen(process.env.PORT||8787,()=>console.log("verifier http://localhost:8787"));
