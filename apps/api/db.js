import pg from 'pg';

export function createPool(connectionString){
  if(!connectionString) return null;
  const sslMode = String(process.env.PGSSLMODE || '').toLowerCase();
  const local = /(^|@)(localhost|127\.0\.0\.1)(:|\/|$)/i.test(connectionString);
  const ssl = local || sslMode === 'disable' ? false : {rejectUnauthorized:false};
  return new pg.Pool({
    connectionString,
    ssl,
    max:Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis:30000,
    connectionTimeoutMillis:5000
  });
}

export async function ensureSchema(pool){
  await pool.query(`CREATE TABLE IF NOT EXISTS scores (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    character_id TEXT NOT NULL,
    world_id INTEGER NOT NULL CHECK (world_id BETWEEN 1 AND 15),
    score INTEGER NOT NULL CHECK (score >= 0),
    beans INTEGER NOT NULL DEFAULT 0 CHECK (beans >= 0),
    time_ms INTEGER NOT NULL DEFAULT 0 CHECK (time_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS scores_world_rank_idx
    ON scores(world_id, score DESC, time_ms ASC, created_at ASC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS scores_global_rank_idx
    ON scores(score DESC, time_ms ASC, created_at ASC)`);
}

export async function waitForDatabase(pool, {attempts=12, delayMs=2000}={}){
  let lastError;
  for(let attempt=1; attempt<=attempts; attempt++){
    try{
      await pool.query('SELECT 1');
      return;
    } catch(err){
      lastError = err;
      console.error(`Database connection attempt ${attempt}/${attempts} failed:`, err.message);
      if(attempt < attempts) await new Promise(resolve=>setTimeout(resolve,delayMs));
    }
  }
  throw lastError || new Error('Database unavailable');
}
