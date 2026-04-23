require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  console.log('Creating announcements table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id         SERIAL PRIMARY KEY,
      title      VARCHAR(200) NOT NULL,
      body       TEXT,
      icon       VARCHAR(100) DEFAULT '📢',
      url        TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ announcements table created.');
  await pool.end();
}

main().catch(e => { console.error('❌', e.message); pool.end(); process.exit(1); });
