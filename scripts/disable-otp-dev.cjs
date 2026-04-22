#!/usr/bin/env node
/**
 * Crée des versions temporaires des handlers sans OTP pour le développement
 * ATTENTION: À utiliser uniquement en développement local!
 */

const fs = require('fs');
const path = require('path');

console.log('\n⚠️  ATTENTION: Ce script désactive l\'OTP pour le développement\n');
console.log('Ceci est UNIQUEMENT pour le développement local.');
console.log('Ne JAMAIS utiliser en production!\n');

// Backup des fichiers originaux
const files = [
  'handlers/admin-login.js',
  'handlers/login.js'
];

console.log('📦 Création des backups...');
files.forEach(file => {
  const backupFile = file.replace('.js', '.backup.js');
  if (!fs.existsSync(backupFile)) {
    fs.copyFileSync(file, backupFile);
    console.log(`   ✅ ${file} → ${backupFile}`);
  } else {
    console.log(`   ⚠️  ${backupFile} existe déjà`);
  }
});

console.log('\n💡 Pour désactiver l\'OTP manuellement:');
console.log('\n1. Dans handlers/admin-login.js, remplacez la fin par:');
console.log(`
  if (!emailOk || !passOk) {
    await logAuthFailure(req);
    return res.status(401).json({ error: 'Access denied' });
  }

  // MODE DEV: Retourner directement un token sans OTP
  const token = require('jsonwebtoken').sign(
    { email: ADMIN_EMAIL, role: 'Admin' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return res.status(200).json({ token, role: 'Admin' });
`);

console.log('\n2. Dans handlers/login.js, remplacez la fin par:');
console.log(`
  if (!isMatch) {
    await logAuthFailure(req);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // MODE DEV: Retourner directement un token sans OTP
  const token = auth.signToken(user);
  return res.status(200).json({ 
    token, 
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      handle: user.handle,
      role: user.role
    }
  });
`);

console.log('\n3. Pour restaurer les fichiers originaux:');
console.log('   cp handlers/admin-login.backup.js handlers/admin-login.js');
console.log('   cp handlers/login.backup.js handlers/login.js');

console.log('\n✅ Backups créés. Modifiez manuellement les fichiers selon les instructions ci-dessus.\n');
