import http from 'node:http';
import { URL } from 'node:url';
import pg from 'pg';

const PORT = Number(process.env.PORT || 3001);
const DATABASE_URL = process.env.DATABASE_URL || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

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
  {id:'pbot', name:'P-BOT', description:'Маскот Perk UP. Найзбалансованіший герой.', runFrames:6},
  {id:'brovary-hero', name:'Brovary Hero', description:'Локальний герой у кепці «Бровари».', runFrames:6},
  {id:'vitalii', name:'Vitalii', description:'Швидкий міський герой.', runFrames:5}
];

let pool = null;
let memoryScores = [];

async function initDb(){
  if(!DATABASE_URL) return;
  pool = new pg.Pool({connectionString:DATABASE_URL, ssl: DATABASE_URL.includes('localhost') ? false : {rejectUnauthorized:false}});
  await pool.query(`CREATE TABLE IF NOT EXISTS scores (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    character_id TEXT NOT NULL,
    world_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    beans INTEGER NOT NULL DEFAULT 0,
    time_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

function send(res, status, data){
  res.writeHead(status, {
    'content-type':'application/json; charset=utf-8',
    'access-control-allow-origin':ALLOWED_ORIGIN,
    'access-control-allow-headers':'content-type',
    'access-control-allow-methods':'GET,POST,OPTIONS'
  });
  res.end(JSON.stringify(data));
}

async function body(req){
  let raw='';
  for await (const chunk of req) raw += chunk;
  if(!raw) return {};
  try{return JSON.parse(raw)}catch{return null}
}

const server = http.createServer(async (req,res)=>{
  if(req.method==='OPTIONS') return send(res,204,{});
  const url = new URL(req.url, `http://${req.headers.host}`);

  try{
    if(url.pathname==='/health') return send(res,200,{ok:true, service:'pbot-api', db:!!pool});
    if(url.pathname==='/api/worlds' && req.method==='GET') return send(res,200,{worlds});
    if(url.pathname==='/api/characters' && req.method==='GET') return send(res,200,{characters});

    if(url.pathname==='/api/leaderboard' && req.method==='GET'){
      const worldId = Number(url.searchParams.get('worldId') || 0);
      if(pool){
        const q = worldId
          ? await pool.query('SELECT player_name,character_id,world_id,score,beans,time_ms,created_at FROM scores WHERE world_id=$1 ORDER BY score DESC,time_ms ASC LIMIT 20',[worldId])
          : await pool.query('SELECT player_name,character_id,world_id,score,beans,time_ms,created_at FROM scores ORDER BY score DESC,time_ms ASC LIMIT 20');
        return send(res,200,{scores:q.rows});
      }
      const rows = memoryScores.filter(s=>!worldId || s.world_id===worldId).sort((a,b)=>b.score-a.score || a.time_ms-b.time_ms).slice(0,20);
      return send(res,200,{scores:rows});
    }

    if(url.pathname==='/api/runs' && req.method==='POST'){
      const data = await body(req);
      if(!data) return send(res,400,{error:'invalid_json'});
      const playerName = String(data.playerName || 'Гравець').slice(0,40);
      const characterId = characters.some(c=>c.id===data.characterId) ? data.characterId : 'pbot';
      const worldId = Math.max(1,Math.min(15,Number(data.worldId)||1));
      const beans = Math.max(0,Number(data.beans)||0);
      const timeMs = Math.max(0,Number(data.timeMs)||0);
      const score = Math.max(0,Number(data.score)||0);
      if(pool){
        await pool.query('INSERT INTO scores(player_name,character_id,world_id,score,beans,time_ms) VALUES($1,$2,$3,$4,$5,$6)',[playerName,characterId,worldId,score,beans,timeMs]);
      } else {
        memoryScores.push({player_name:playerName,character_id:characterId,world_id:worldId,score,beans,time_ms:timeMs,created_at:new Date().toISOString()});
        memoryScores = memoryScores.slice(-500);
      }
      return send(res,201,{ok:true});
    }

    return send(res,404,{error:'not_found'});
  } catch(err){
    console.error(err);
    return send(res,500,{error:'internal_error'});
  }
});

initDb().catch(err=>console.error('DB init failed; continuing without persistence',err)).finally(()=>{
  server.listen(PORT,'0.0.0.0',()=>console.log(`P-BOT API listening on ${PORT}`));
});
