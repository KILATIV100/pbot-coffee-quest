import { createPool, ensureSchema, waitForDatabase } from './db.js';

const DATABASE_URL = process.env.DATABASE_URL || '';
if(!DATABASE_URL){
  console.error('DATABASE_URL is required for migration');
  process.exit(1);
}

const pool = createPool(DATABASE_URL);
try{
  await waitForDatabase(pool,{attempts:15,delayMs:2000});
  await ensureSchema(pool);
  console.log('P-BOT database schema is ready');
} catch(err){
  console.error('Migration failed:',err);
  process.exitCode=1;
} finally {
  await pool.end().catch(()=>{});
}
