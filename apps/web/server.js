import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 3000);
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const root = fileURLToPath(new URL('./public/', import.meta.url));
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};

http.createServer(async(req,res)=>{
  if(req.url==='/health'){
    res.writeHead(200,{'content-type':'application/json'}); return res.end(JSON.stringify({ok:true,service:'pbot-web'}));
  }
  if(req.url==='/config.js'){
    res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'});
    return res.end(`window.__APP_CONFIG__=${JSON.stringify({apiBase:API_BASE_URL})};`);
  }
  const pathname = decodeURIComponent((req.url||'/').split('?')[0]);
  let rel = pathname==='/' ? 'index.html' : pathname.replace(/^\/+/, '');
  rel = normalize(rel).replace(/^\.\.(\/|\\|$)+/, '');
  const file = join(root, rel);
  try{
    const data = await readFile(file);
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':extname(file)==='.html'?'no-cache':'public,max-age=604800,immutable'});
    res.end(data);
  } catch {
    try{
      const data=await readFile(join(root,'index.html'));
      res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-cache'}); res.end(data);
    } catch {res.writeHead(404);res.end('Not found')}
  }
}).listen(PORT,'0.0.0.0',()=>console.log(`P-BOT web listening on ${PORT}`));
