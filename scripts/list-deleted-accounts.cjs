#!/usr/bin/env node
/**
 * Liste tous les comptes supprimés (soft delete)
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function listDeletedAccounts() {
  console.log('\n🗑️  Comptes supprimés (soft delete)\n');

  try {
    const { rows: deleted } = await pool.query(`
      SELECT id, name, handle, email, created_at
      FROM users
      WHERE status = 'Supprimé'
      ORDER BY created_at DESC
    `);

    if (deleted.length === 0) {
      console.log('✅ Aucun compte supprimé');
      await pool.end();
      return;
    }

    console.log(`📊 ${deleted.length} compte(s) supprimé(s):\n`);
    
    for (const user of deleted) {
      // Compter les données associées
      const { rows: [postCount] } = await pool.query(
        'SELECT COUNT(*) as count FROM posts WHERE user_handle = $1',
        [user.handle]
      );
      const { rows: [orderCount] } = await pool.query(
        'SELECT COUNT(*) as count FROM orders WHERE user_handle = $1',
        [user.handle]
      );

      console.log(`${deleted.indexOf(user) + 1}. ${user.name} (${user.handle})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Créé: ${user.created_at}`);
      console.log(`   Posts: ${postCount.count}, Commandes: ${orderCount.count}`);
      console.log('');
    }

    // Statistiques
    console.log('📈 Statistiques:');
    console.log(`   Total comptes supprimés: ${deleted.length}`);

    console.log('\n💡 Pour restaurer un compte:');
    console.log('   node scripts/restore-deleted-account.cjs');

    console.log('\n💡 Pour supprimer définitivement (ATTENTION):');
    console.log('   node scripts/permanently-delete-account.cjs');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

listDeletedAccounts();
