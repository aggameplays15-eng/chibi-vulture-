#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  try {
    await pool.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)`);
    console.log('✅ Migration 018 applied — comment replies support added');
  } catch (err) { console.error('❌', err.message); process.exit(1); }
  finally { await pool.end(); }
})();
