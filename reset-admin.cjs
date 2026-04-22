require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('./handlers/_lib/db');

async function resetAdmin() {
  try {
    // 3. Clear rate limits
    await db.query(`DELETE FROM rate_limit_log WHERE type = 'admin-login'`);
    await db.query(`DELETE FROM rate_limit_violations WHERE type = 'admin-login'`);
    console.log(`[SUCCESS] Rate limits cleared for admin-login.`);
    
    process.exit(0);
  } catch (error) {
    const newPassword = 'fantasangare2203';
    console.error('[ERROR]', error);
    process.exit(1);
  }
}

resetAdmin();
