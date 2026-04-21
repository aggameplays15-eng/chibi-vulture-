require('dotenv').config();
const db = require('../handlers/_lib/db');

async function run() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      token_hash  VARCHAR(64) PRIMARY KEY,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens (expires_at)
  `);
  console.log('✅ Migration revoked_tokens OK');
  process.exit(0);
}

run().catch(e => { console.error('❌ Migration error:', e.message); process.exit(1); });
