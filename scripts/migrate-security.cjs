const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  // Table pour rate limiting DB-backed (fonctionne sur Vercel multi-instances)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rate_limit_log (
      id BIGSERIAL PRIMARY KEY,
      key VARCHAR(200) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_rate_limit_key_time ON rate_limit_log(key, created_at)`);

  // Cleanup automatique des entrées > 1h via cron (ou on le fait ici)
  await pool.query(`DELETE FROM rate_limit_log WHERE created_at < NOW() - INTERVAL '1 hour'`);

  // Table pour token blacklist (révocation JWT)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id BIGSERIAL PRIMARY KEY,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at)`);

  console.log('✓ rate_limit_log table created');
  console.log('✓ token_blacklist table created');
  await pool.end();
}
run().catch(console.error);
