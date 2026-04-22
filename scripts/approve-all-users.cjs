#!/usr/bin/env node
/**
 * Approuve automatiquement tous les utilisateurs en attente
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('\n🔓 Approbation automatique des utilisateurs...\n');

  try {
    // Lister d'abord les utilisateurs en attente
    const { rows: pending } = await pool.query(
      'SELECT id, name, handle, email FROM users WHERE is_approved = false'
    );

    if (pending.length === 0) {
      console.log('✅ Aucun utilisateur en attente d\'approbation');
      await pool.end();
      return;
    }

    console.log(`📋 ${pending.length} utilisateur(s) en attente:\n`);
    pending.forEach(user => {
      console.log(`   - ${user.name} (${user.handle}) - ${user.email}`);
    });

    // Approuver tous
    const { rowCount } = await pool.query(
      'UPDATE users SET is_approved = true WHERE is_approved = false'
    );

    console.log(`\n✅ ${rowCount} utilisateur(s) approuvé(s) avec succès!`);
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces comptes.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

main();
