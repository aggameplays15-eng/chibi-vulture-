require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const cols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'rate_limit_log' ORDER BY ordinal_position`
  );
  console.log('rate_limit_log colonnes:', cols.rows.map(x => x.column_name).join(', '));

  const tbl = await pool.query(`SELECT to_regclass('public.rate_limit_violations') as t`);
  console.log('rate_limit_violations:', tbl.rows[0].t ? '✅ existe' : '❌ manquante');

  await pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
