require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query(`
  SELECT table_name, column_name FROM information_schema.columns 
  WHERE table_name IN ('likes','follows','comments') AND table_schema='public' 
  ORDER BY table_name, column_name
`).then(r => {
  r.rows.forEach(row => console.log(`${row.table_name}.${row.column_name}`));
  pool.end();
});
