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
