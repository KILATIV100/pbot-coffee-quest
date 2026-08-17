import http from 'node:http';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 3000);
const API_INTERNAL_URL = process.env.API_INTERNAL_URL || process.env.API_BASE_URL || 'http://127.0.0.1:3001';
const root = resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const mime = {
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'
};
const stage2Aliases = new Map([
  ['/assets/stage2/prod/bg-city.webp','assets/backgrounds/world01-level01.webp'],
  ['/assets/stage2/prod/bg-park.webp','assets/backgrounds/world01-level01.webp']
]);

function commonHeaders(extra={}){
  return {'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','permissions-policy':'camera=(), microphone=(), geolocation=()',...extra};
}

function proxyApi(req,res){
  let upstream;
  try { upstream = new URL(req.url || '/', API_INTERNAL_URL); }
  catch { res.writeHead(502, commonHeaders({'content-type':'application/json; charset=utf-8'})); return res.end(JSON.stringify({error:'bad_api_upstream'})); }
  const transport = upstream.protocol === 'https:' ? https : http;
  const headers = {...req.headers};headers.host = upstream.host;headers['x-forwarded-host'] = req.headers.host || '';headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'] || 'https';delete headers.connection;
  const upstreamReq = transport.request({protocol:upstream.protocol,hostname:upstream.hostname,port:upstream.port || undefined,method:req.method,path:`${upstream.pathname}${upstream.search}`,headers,timeout:15000}, upstreamRes => {
    const outHeaders = {...upstreamRes.headers};delete outHeaders.connection;res.writeHead(upstreamRes.statusCode || 502, commonHeaders(outHeaders));upstreamRes.pipe(res);
  });
  upstreamReq.on('timeout',()=>upstreamReq.destroy(new Error('api_timeout')));
  upstreamReq.on('error',err=>{console.error('API proxy error', err.message);if(!res.headersSent)res.writeHead(502, commonHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'}));if(!res.writableEnded)res.end(JSON.stringify({error:'api_unavailable'}));});
  req.pipe(upstreamReq);
}

async function sendStatic(res,filePath,{immutable=false}={}){
  const data = await readFile(filePath);
  const ext = extname(filePath).toLowerCase();
  const dynamic = ext === '.html' || ext === '.js' || ext === '.css' || ext === '.json';
  const cacheHeaders = dynamic
    ? {'cache-control':'no-store, max-age=0, must-revalidate','pragma':'no-cache','expires':'0'}
    : {'cache-control': immutable ? 'public,max-age=31536000,immutable' : 'public,max-age=3600'};
  res.writeHead(200, commonHeaders({'content-type':mime[ext] || 'application/octet-stream',...cacheHeaders}));
  res.end(data);
}

const server = http.createServer(async(req,res)=>{
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if(pathname === '/health'){
    res.writeHead(200, commonHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'}));
    return res.end(JSON.stringify({ok:true,service:'pbot-web',stage2:true,viewport:'960x540',deployment:process.env.RAILWAY_DEPLOYMENT_ID || null}));
  }
  if(pathname === '/api' || pathname.startsWith('/api/')) return proxyApi(req,res);
  if(pathname === '/config.js'){
    res.writeHead(200, commonHeaders({'content-type':'text/javascript; charset=utf-8','cache-control':'no-store, max-age=0, must-revalidate','pragma':'no-cache','expires':'0'}));
    return res.end(`window.__APP_CONFIG__={apiBase:window.location.origin,deployment:${JSON.stringify(process.env.RAILWAY_DEPLOYMENT_ID || 'local')}};`);
  }

  const alias = stage2Aliases.get(pathname);
  if(alias){try { return await sendStatic(res,resolve(root,alias),{immutable:true}); }catch { res.writeHead(404,commonHeaders({'content-type':'text/plain; charset=utf-8'})); return res.end('Asset not found'); }}

  let rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = resolve(root, rel);
  if(file !== root && !file.startsWith(root + sep)){res.writeHead(403, commonHeaders({'content-type':'text/plain; charset=utf-8'}));return res.end('Forbidden');}

  try{return await sendStatic(res,file);}
  catch {
    const ext = extname(file).toLowerCase();
    if(ext && ext !== '.html'){res.writeHead(404, commonHeaders({'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}));return res.end('Not found');}
    try{return await sendStatic(res,resolve(root,'index.html'));}
    catch {res.writeHead(404, commonHeaders({'content-type':'text/plain; charset=utf-8'}));return res.end('Not found');}
  }
});

server.keepAliveTimeout = 65000;server.headersTimeout = 66000;
function shutdown(signal){console.log(`${signal}: shutting down pbot-web`);server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));
server.listen(PORT,'0.0.0.0',()=>console.log(`P-BOT web listening on ${PORT}; Stage 2 landscape; API upstream ${API_INTERNAL_URL}`));
