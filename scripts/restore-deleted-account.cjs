#!/usr/bin/env node
/**
 * Restaure un compte supprimé (soft delete)
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function restoreAccount() {
  console.log('\n🔄 Restauration de compte supprimé\n');

  // Lister les comptes supprimés
  try {
    const { rows: deleted } = await pool.query(`
      SELECT id, name, handle, email, created_at
      FROM users
      WHERE status = 'Supprimé'
      ORDER BY created_at DESC
    `);

    if (deleted.length === 0) {
      console.log('✅ Aucun compte supprimé à restaurer');
      await pool.end();
      return;
    }

    console.log(`📋 ${deleted.length} compte(s) supprimé(s):\n`);
    deleted.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.handle}) - ${user.email}`);
      console.log(`   ID: ${user.id}, Créé: ${user.created_at}\n`);
    });

    // Demander quel compte restaurer
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Entrez l\'ID du compte à restaurer (ou 0 pour annuler): ', async (answer) => {
      const userId = parseInt(answer.trim());

      if (userId === 0 || isNaN(userId)) {
        console.log('\n❌ Restauration annulée');
        readline.close();
        await pool.end();
        return;
      }

      const user = deleted.find(u => u.id === userId);
      if (!user) {
        console.log('\n❌ ID invalide');
        readline.close();
        await pool.end();
        return;
      }

      try {
        // Restaurer le compte
        await pool.query(
          `UPDATE users SET status = 'Actif', is_approved = true WHERE id = $1`,
          [userId]
        );

        console.log(`\n✅ Compte restauré avec succès !`);
        console.log(`   ${user.name} (${user.handle}) - ${user.email}`);
        console.log(`   Statut: Actif, Approuvé: Oui`);

      } catch (error) {
        console.error('\n❌ Erreur lors de la restauration:', error.message);
      }

      readline.close();
      await pool.end();
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await pool.end();
  }
}

restoreAccount();
