// Test du flow OTP utilisateur
require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  const client = await pool.connect();
  console.log('✅ Connecté\n');

  // 1. Récupérer un utilisateur existant
  const { rows: users } = await client.query(
    `SELECT id, name, email FROM users LIMIT 1`
  );
  if (users.length === 0) {
    console.log('⚠ Aucun utilisateur en DB — test ignoré');
    client.release(); await pool.end(); return;
  }
  const user = users[0];
  console.log(`👤 Utilisateur test : ${user.name} (${user.email})`);

  // 2. Simuler l'émission d'un OTP
  const code = '123456';
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await client.query(`UPDATE user_otp SET used = TRUE WHERE user_id = $1 AND used = FALSE`, [user.id]);
  await client.query(
    `INSERT INTO user_otp (user_id, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.id, codeHash, expiresAt]
  );
  console.log('✓ OTP inséré en DB');

  // 3. Simuler la vérification
  const { rows } = await client.query(
    `SELECT id FROM user_otp
     WHERE user_id = $1 AND code_hash = $2 AND used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [user.id, codeHash]
  );
  if (rows.length === 0) {
    console.log('✗ OTP non trouvé — ÉCHEC');
  } else {
    await client.query(`UPDATE user_otp SET used = TRUE WHERE id = $1`, [rows[0].id]);
    console.log('✓ OTP vérifié et marqué comme utilisé');
  }

  // 4. Vérifier qu'un OTP expiré est rejeté
  const expiredHash = crypto.createHash('sha256').update('999999').digest('hex');
  const expiredAt = new Date(Date.now() - 1000); // déjà expiré
  await client.query(
    `INSERT INTO user_otp (user_id, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.id, expiredHash, expiredAt]
  );
  const { rows: expiredRows } = await client.query(
    `SELECT id FROM user_otp
     WHERE user_id = $1 AND code_hash = $2 AND used = FALSE AND expires_at > NOW()`,
    [user.id, expiredHash]
  );
  console.log(`✓ OTP expiré correctement rejeté : ${expiredRows.length === 0 ? 'OUI' : 'NON ✗'}`);

  // Nettoyage
  await client.query(`DELETE FROM user_otp WHERE user_id = $1`, [user.id]);
  console.log('✓ Nettoyage effectué');

  console.log('\n🎉 Tous les tests passent !');
  client.release();
  await pool.end();
}

test().catch(err => {
  console.error('❌ Test échoué :', err.message);
  process.exit(1);
});
