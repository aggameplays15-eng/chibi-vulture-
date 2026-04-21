const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const r = await pool.query('SELECT email, password, role, is_approved FROM users WHERE email = $1', ['admin@chibi.com']);
  if (!r.rows.length) { console.log('User not found'); return; }
  const user = r.rows[0];
  console.log('email:', user.email, '| role:', user.role, '| is_approved:', user.is_approved);
  const ok = await bcrypt.compare(process.env.ADMIN_PASSWORD, user.password);
  console.log('Password match with ADMIN_PASSWORD:', ok);
  // Try a known password
  const ok2 = await bcrypt.compare('admin123', user.password);
  console.log('Password match with "admin123":', ok2);
  await pool.end();
}
run().catch(console.error);
