require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('./handlers/_lib/db');

async function resetAdmin() {
  try {
    const newPassword = 'fantasangare2203';
    const hash = await bcrypt.hash(newPassword, 10); 

    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    envContent = envContent.replace(
      /^ADMIN_PASSWORD_HASH=.*$/m,
      `ADMIN_PASSWORD_HASH=${hash}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log(`[SUCCESS] Admin password reset to: ${newPassword}`);

    // Clear rate limits just in case
    await db.query(`DELETE FROM rate_limit_log WHERE type = 'admin-login'`);
    await db.query(`DELETE FROM rate_limit_violations WHERE type = 'admin-login'`);
    
    process.exit(0);
  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  }
}

resetAdmin();
