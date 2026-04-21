// Utilitaire pour générer le hash bcrypt du mot de passe admin
// Usage: node scripts/generate-admin-hash.cjs MON_MOT_DE_PASSE
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/generate-admin-hash.cjs MON_MOT_DE_PASSE');
  process.exit(1);
}

bcrypt.hash(password, 12).then(hash => {
  console.log('\n✅ Copie cette valeur dans ADMIN_PASSWORD_HASH sur Vercel:\n');
  console.log(hash);
  console.log('');
});
