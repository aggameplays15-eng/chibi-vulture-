require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const { rows } = await pool.query("SELECT id, password FROM users WHERE handle = '@guest'");
  if (rows.length === 0) {
    console.log('✅ Pas de compte @guest en DB.');
    await pool.end();
    return;
  }

  const current = rows[0].password;
  if (current && current.startsWith('$2b$')) {
    console.log('✅ Mot de passe @guest déjà hashé.');
    await pool.end();
    return;
  }

  // Générer un hash aléatoire non-loginable
  const randomPwd = require('crypto').randomBytes(32).toString('hex');
  const hash = await bcrypt.hash(randomPwd, 12);
  await pool.query("UPDATE users SET password = $1 WHERE handle = '@guest'", [hash]);
  console.log('✅ Mot de passe @guest sécurisé (hash bcrypt, non-loginable).');
  await pool.end();
}

main().catch(e => { console.error('❌', e.message); pool.end(); process.exit(1); });
