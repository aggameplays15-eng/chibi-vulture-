// Script pour appliquer la migration des tables de sécurité
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/013_add_security_tables.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Security tables created (security_log, ip_bans)');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
