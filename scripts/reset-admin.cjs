const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const newPassword = process.env.ADMIN_PASSWORD;
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    'UPDATE users SET password = $1 WHERE email = $2',
    [hash, 'admin@chibi.com']
  );
  console.log('Admin password reset to ADMIN_PASSWORD from .env');
  await pool.end();
}
run().catch(console.error);
