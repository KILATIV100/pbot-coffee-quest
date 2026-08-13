import http from 'node:http';
import { URL } from 'node:url';
import { createPool, ensureSchema, waitForDatabase } from './db.js';

const PORT = Number(process.env.PORT || 3001);
const DATABASE_URL = process.env.DATABASE_URL || '';
const REQUIRE_DATABASE = String(process.env.REQUIRE_DATABASE ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')).toLowerCase() === 'true';
const AUTO_MIGRATE = String(process.env.AUTO_MIGRATE ?? (process.env.NODE_ENV === 'production' ? 'false' : 'true')).toLowerCase() === 'true';
const allowedOrigins = String(process.env.ALLOWED_ORIGIN || '*').split(',').map(v=>v.trim()).filter(Boolean);

const worlds = [
  {id:1, slug:'rozvylka', name:'Розвилка', subtitle:'The Crossroads', act:1, accent:'#42d6c8'},
  {id:2, slug:'peremohy', name:'Парк Перемоги', subtitle:'Green Core', act:1, accent:'#64d66d'},
  {id:3, slug:'pryozernyi', name:'Приозерний', subtitle:'Old Park', act:1, accent:'#6dc7e8'},
  {id:4, slug:'old-brovary', name:'Старі Бровари', subtitle:'Memory Streets', act:1, accent:'#d8a86b'},
  {id:5, slug:'shevchenko-way', name:'Шевченків шлях', subtitle:'Memory Route', act:1, accent:'#8eb0ff'},
  {id:6, slug:'fair', name:'Ярмарок Броварів', subtitle:'Market Pulse', act:2, accent:'#ffb84d'},
  {id:7, slug:'tram-23', name:'Трамвай 23', subtitle:'Retro Transit', act:2, accent:'#f08f63'},
  {id:8, slug:'airfield', name:'Аеродром', subtitle:'Sky Gate', act:2, accent:'#8fc9ff'},
  {id:9, slug:'station', name:'Станція Бровари', subtitle:'Rail Junction', act:2, accent:'#b5b9c8'},
  {id:10, slug:'torhmash', name:'Торгмаш', subtitle:'Industrial Pulse', act:2, accent:'#d89055'},
  {id:11, slug:'radio', name:'Радіодистрикт', subtitle:'Signal Noise', act:3, accent:'#b96dff'},
  {id:12, slug:'sport-city', name:'Спорт-Сіті', subtitle:'Velocity', act:3, accent:'#ff667e'},
  {id:13, slug:'terminal-city', name:'Термінал-Сіті', subtitle:'Urban Neon', act:3, accent:'#52e0c4'},
  {id:14, slug:'future-housing', name:'ЖК Майбутнього', subtitle:'Green Living', act:3, accent:'#7ae388'},
  {id:15, slug:'future-core', name:'Future Brovary Core', subtitle:'City 20XX', act:3, accent:'#44d9ff'}
];

const characters = [
  {id:'pbot', name:'P-BOT', description:'Головний кібер-кур’єр Brovary Universe.', runFrames:6},
  {id:'brovary-hero', name:'Brovary Hero', description:'Локальний герой Броварів.', runFrames:6},
  {id:'vitalii', name:'Vitalii', description:'Швидкий міський герой.', runFrames:5}
];

let pool = null;
let dbReady = false;
let memoryScores = [];

function corsOrigin(req){
  const origin = req.headers.origin;
  if(!origin || allowedOrigins.includes('*')) return '*';
  return allowedOrigins.includes(origin) ? origin : 'null';
}

function send(req,res,status,data){
  res.writeHead(status, {
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'access-control-allow-origin':corsOrigin(req),
    'access-control-allow-headers':'content-type',
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'x-content-type-options':'nosniff'
  });
  if(status === 204) return res.end();
  res.end(JSON.stringify(data));
}

async function body(req,maxBytes=32768){
  let raw='';
  let bytes=0;
  for await (const chunk of req){
    bytes += chunk.length;
    if(bytes > maxBytes){
      const err = new Error('payload_too_large');
      err.statusCode = 413;
      throw err;
    }
    raw += chunk;
  }
  if(!raw) return {};
  try{return JSON.parse(raw)}catch{return null}
}

function boundedInt(value,min,max){
  const n = Number(value);
  if(!Number.isFinite(n)) return min;
  return Math.max(min,Math.min(max,Math.trunc(n)));
}

async function initDb(){
  if(!DATABASE_URL){
    if(REQUIRE_DATABASE) throw new Error('DATABASE_URL is required in production');
    console.warn('DATABASE_URL missing; using in-memory leaderboard');
    return;
  }
  pool = createPool(DATABASE_URL);
  await waitForDatabase(pool,{attempts:15,delayMs:2000});
  if(AUTO_MIGRATE) await ensureSchema(pool);
  dbReady = true;
  console.log('Postgres connection ready');
}

const server = http.createServer(async (req,res)=>{
  if(req.method === 'OPTIONS'){
    const origin = corsOrigin(req);
    if(origin === 'null') return send(req,res,403,{error:'origin_not_allowed'});
    return send(req,res,204,{});
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try{
    if(url.pathname === '/health'){
      const ok = !REQUIRE_DATABASE || dbReady;
      return send(req,res,ok?200:503,{
        ok,
        service:'pbot-api',
        db:dbReady,
        persistence:dbReady?'postgres':'memory',
        deployment:process.env.RAILWAY_DEPLOYMENT_ID || null
      });
    }

    if(url.pathname === '/api/meta' && req.method === 'GET'){
      return send(req,res,200,{
        service:'pbot-api',
        version:'0.2.0',
        environment:process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV || 'local',
        deployment:process.env.RAILWAY_DEPLOYMENT_ID || null,
        db:dbReady
      });
    }

    if(url.pathname === '/api/worlds' && req.method === 'GET') return send(req,res,200,{worlds});
    if(url.pathname === '/api/characters' && req.method === 'GET') return send(req,res,200,{characters});

    if(url.pathname === '/api/leaderboard' && req.method === 'GET'){
      const worldId = boundedInt(url.searchParams.get('worldId') || 0,0,15);
      if(pool && dbReady){
        const q = worldId
          ? await pool.query('SELECT player_name,character_id,world_id,score,beans,time_ms,created_at FROM scores WHERE world_id=$1 ORDER BY score DESC,time_ms ASC,created_at ASC LIMIT 20',[worldId])
          : await pool.query('SELECT player_name,character_id,world_id,score,beans,time_ms,created_at FROM scores ORDER BY score DESC,time_ms ASC,created_at ASC LIMIT 20');
        return send(req,res,200,{scores:q.rows});
      }
      const rows = memoryScores
        .filter(s=>!worldId || s.world_id===worldId)
        .sort((a,b)=>b.score-a.score || a.time_ms-b.time_ms)
        .slice(0,20);
      return send(req,res,200,{scores:rows});
    }

    if(url.pathname === '/api/runs' && req.method === 'POST'){
      const data = await body(req);
      if(!data) return send(req,res,400,{error:'invalid_json'});
      const playerName = String(data.playerName || 'Гравець')
        .replace(/[\u0000-\u001f\u007f]/g,'')
        .trim()
        .slice(0,40) || 'Гравець';
      const characterId = characters.some(c=>c.id===data.characterId) ? data.characterId : 'pbot';
      const worldId = boundedInt(data.worldId,1,15);
      const beans = boundedInt(data.beans,0,10000);
      const timeMs = boundedInt(data.timeMs,0,86400000);
      const score = boundedInt(data.score,0,100000000);

      if(pool && dbReady){
        await pool.query(
          'INSERT INTO scores(player_name,character_id,world_id,score,beans,time_ms) VALUES($1,$2,$3,$4,$5,$6)',
          [playerName,characterId,worldId,score,beans,timeMs]
        );
      } else {
        memoryScores.push({
          player_name:playerName,
          character_id:characterId,
          world_id:worldId,
          score,
          beans,
          time_ms:timeMs,
          created_at:new Date().toISOString()
        });
        memoryScores = memoryScores.slice(-500);
      }
      return send(req,res,201,{ok:true});
    }

    return send(req,res,404,{error:'not_found'});
  } catch(err){
    console.error(err);
    return send(req,res,err.statusCode || 500,{error:err.statusCode===413?'payload_too_large':'internal_error'});
  }
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

async function shutdown(signal){
  console.log(`${signal}: shutting down pbot-api`);
  server.close(async()=>{
    if(pool) await pool.end().catch(()=>{});
    process.exit(0);
  });
  setTimeout(()=>process.exit(1),10000).unref();
}
process.on('SIGTERM',()=>shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));

try{
  await initDb();
} catch(err){
  console.error('Database initialization failed:',err);
  if(REQUIRE_DATABASE) process.exit(1);
  if(pool) await pool.end().catch(()=>{});
  pool = null;
  dbReady = false;
}

server.listen(PORT,'0.0.0.0',()=>console.log(`P-BOT API listening on ${PORT}; persistence=${dbReady?'postgres':'memory'}`));
