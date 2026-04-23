require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('./handlers/_lib/db');

async function resetAdmin() {
  const newPassword = 'fantasangare2203';
  console.log(`[INIT] Generating hash for password: ${newPassword}...`);
  
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    console.log(`\n============================================================`);
    console.log(`NOUVEAU HASH POUR VOTRE .env :`);
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log(`============================================================\n`);
    
    // Clear rate limits
    await db.query(`DELETE FROM rate_limit_log WHERE type = 'admin-login'`);
    await db.query(`DELETE FROM rate_limit_violations WHERE type = 'admin-login'`);
    console.log(`[SUCCESS] Rate limits cleared for admin-login.`);
    
    console.log(`\nINSTRUCTIONS :`);
    console.log(`1. Copiez la ligne ADMIN_PASSWORD_HASH ci-dessus.`);
    console.log(`2. Collez-la dans votre fichier .env ou dans les variables Vercel.`);
    console.log(`3. Redémarrez le serveur.`);
    
    process.exit(0);
  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  }
}

resetAdmin();
