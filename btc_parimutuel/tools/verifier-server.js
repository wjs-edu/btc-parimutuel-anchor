const http=require("http"),fs=require("fs"),path=require("path"),u=require("url");
const root=process.cwd(), esc=s=>String(s).replace(/[&<>"]/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const tx=s=>`https://explorer.solana.com/tx/${s}?cluster=devnet`;
const send=(res,code,ct,body)=>{res.writeHead(code,{"content-type":ct});res.end(body);};
http.createServer((req,res)=>{
  const p=u.parse(req.url).pathname||"/";
  const m=p.match(/^\/(status|verify\/resolved|verify\/canceled)\/(\d+)(?:\.json)?$/);
  if(!m){ res.writeHead(302,{Location:"/verify/resolved/1766716704"}); return res.end(); }
  const kind=m[1], id=m[2];
  if(kind==="status"){
    const fp=path.join(root,`artifacts/status/${id}.json`);
    if(!fs.existsSync(fp)) return send(res,404,"text/plain","status not found");
    return send(res,200,"application/json",fs.readFileSync(fp));
  }
  if(kind==="verify/canceled"){
    const dir=path.join(root,`artifacts/canceled/${id}`), need=["close.sig.txt","market.account.json"];
    if(!need.every(f=>fs.existsSync(path.join(dir,f)))) return send(res,404,"text/plain","bundle not found");
    const close=fs.readFileSync(path.join(dir,"close.sig.txt"),"utf8").trim();
    const market=fs.readFileSync(path.join(dir,"market.account.json"),"utf8");
    return send(res,200,"text/html; charset=utf-8",`<!doctype html><meta charset="utf-8"><title>Verify Canceled ${esc(id)}</title><h1>Verify: CANCELED Market ${esc(id)}</h1><p><b>Proves:</b> deterministic on-chain application of rules (tx + account artifacts).</p><p><b>Does NOT prove:</b> oracle correctness or off-chain data sources.</p><ul><li>close_market (canceled): <a href="${tx(close)}">${esc(close)}</a></li><li>status: <a href="/status/${esc(id)}.json">/status/${esc(id)}.json</a></li></ul><h2>Market account snapshot</h2><pre style="white-space:pre-wrap">${esc(market)}</pre>`);
  }

  const dir=path.join(root,`artifacts/resolved/${id}`), need=["resolve.sig.txt","claim.sig.txt","resolve.confirm.json","claim.confirm.json","market.account.json"];
  if(!need.every(f=>fs.existsSync(path.join(dir,f)))) return send(res,404,"text/plain","bundle not found");
  const r=fs.readFileSync(path.join(dir,"resolve.sig.txt"),"utf8").trim(), c=fs.readFileSync(path.join(dir,"claim.sig.txt"),"utf8").trim();
  const market=fs.readFileSync(path.join(dir,"market.account.json"),"utf8");
  return send(res,200,"text/html; charset=utf-8",`<!doctype html><meta charset="utf-8"><title>Verify Resolved ${esc(id)}</title>
<h1>Verify: Resolved Market ${esc(id)}</h1>
<p><b>Proves:</b> deterministic on-chain application of rules (tx + account artifacts).</p>
<p><b>Does NOT prove:</b> oracle correctness or off-chain data sources.</p>
<ul><li>resolve_market: <a href="${tx(r)}">${esc(r)}</a></li><li>claim_payout: <a href="${tx(c)}">${esc(c)}</a></li><li>status: <a href="/status/${esc(id)}.json">/status/${esc(id)}.json</a></li></ul>
<h2>Market account snapshot</h2><pre style="white-space:pre-wrap">${esc(market)}</pre>`);
}).listen(process.env.PORT||8787,()=>console.log("verifier http://localhost:8787"));
