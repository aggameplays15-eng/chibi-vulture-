const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const r = await pool.query(
    "SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position"
  );
  r.rows.forEach(c => console.log(c));

  // Check constraints
  const c = await pool.query(
    "SELECT conname, contype, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'orders'::regclass"
  );
  console.log('\nConstraints:');
  c.rows.forEach(r => console.log(r));

  await pool.end();
}
run().catch(console.error);
