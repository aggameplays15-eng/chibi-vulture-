require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run(client, label, sql) {
  try { await client.query(sql); console.log(`  ✓ ${label}`); }
  catch (err) {
    if (err.message.includes('already exists')) console.log(`  ⚠ Déjà existant: ${label}`);
    else console.error(`  ✗ [${err.code}] ${label}: ${err.message}`);
  }
}

async function main() {
  const client = await pool.connect();
  console.log('✅ Connecté\n');
  await run(client, 'likes.created_at',   `ALTER TABLE likes   ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await run(client, 'follows.created_at', `ALTER TABLE follows ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  console.log('\n🎉 Done');
  client.release();
  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
