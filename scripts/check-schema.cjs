require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query(`
  SELECT table_name, column_name, data_type, character_maximum_length
  FROM information_schema.columns 
  WHERE table_name IN ('orders','products') AND table_schema='public' 
  ORDER BY table_name, column_name
`).then(r => {
  r.rows.forEach(row => console.log(`${row.table_name}.${row.column_name} = ${row.data_type}${row.character_maximum_length ? '('+row.character_maximum_length+')' : ''}`));
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
