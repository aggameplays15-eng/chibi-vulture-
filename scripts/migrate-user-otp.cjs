// Migration 016 — user_otp table for user 2FA login
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run(client, label, sql) {
  try {
    await client.query(sql);
    console.log(`  ✓ ${label}`);
  } catch (err) {
    if (err.message.includes('already exists') || err.code === '23505') {
      console.log(`  ⚠ Déjà existant: ${label}`);
    } else {
      console.error(`  ✗ ERREUR [${err.code}] ${label}: ${err.message}`);
      throw err;
    }
  }
}

async function migrate() {
  const client = await pool.connect();
  console.log('✅ Connecté à Neon PostgreSQL\n');

  await run(client, 'TABLE user_otp', `
    CREATE TABLE IF NOT EXISTS user_otp (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash   TEXT        NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      used        BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await run(client, 'INDEX idx_user_otp_user_id', `
    CREATE INDEX IF NOT EXISTS idx_user_otp_user_id ON user_otp (user_id)
  `);

  await run(client, 'INDEX idx_user_otp_expires', `
    CREATE INDEX IF NOT EXISTS idx_user_otp_expires ON user_otp (expires_at)
  `);

  // Vérification
  const { rows } = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'user_otp' ORDER BY ordinal_position
  `);
  console.log('\n📋 Colonnes de user_otp :');
  rows.forEach(r => console.log(`   • ${r.column_name} (${r.data_type})`));
  console.log('\n🎉 Migration 016 complète !');

  client.release();
  await pool.end();
}

migrate().catch(err => {
  console.error('❌ Migration échouée :', err.message);
  process.exit(1);
});
