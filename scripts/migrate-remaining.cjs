#!/usr/bin/env node
/**
 * Apply all remaining migrations safely (idempotent — IF NOT EXISTS everywhere)
 */
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const migrations = [
  {
    name: '008 — onboarding tracking columns',
    sql: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;
      CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
    `
  },
  {
    name: '015 — DoS protection columns',
    sql: `
      ALTER TABLE rate_limit_log ADD COLUMN IF NOT EXISTS ip TEXT;
      ALTER TABLE rate_limit_log ADD COLUMN IF NOT EXISTS type TEXT;
      CREATE INDEX IF NOT EXISTS idx_rate_limit_log_ip_created ON rate_limit_log (ip, created_at);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip_type ON rate_limit_violations (ip, type, created_at);
    `
  },
  {
    name: '016 — orders & products columns',
    sql: `
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMP;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS artist_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_products_artist_id ON products(artist_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_orders_user_handle ON orders(user_handle);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `
  },
  {
    name: '017 — password reset tokens',
    sql: `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        token_hash  TEXT NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        used        BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
  },
  {
    name: '018 — comment replies (parent_id)',
    sql: `
      ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
    `
  },
];

(async () => {
  let ok = 0, fail = 0;
  for (const m of migrations) {
    try {
      await pool.query(m.sql);
      console.log(`✅ ${m.name}`);
      ok++;
    } catch (err) {
      console.error(`❌ ${m.name}: ${err.message}`);
      fail++;
    }
  }
  console.log(`\n${ok} applied, ${fail} failed`);
  await pool.end();
})();
