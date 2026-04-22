#!/usr/bin/env node
/**
 * Suppression DÉFINITIVE d'un compte de la base de données
 * ⚠️ ATTENTION: Cette action est IRRÉVERSIBLE !
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function permanentlyDeleteAccount() {
  console.log('\n⚠️  SUPPRESSION DÉFINITIVE DE COMPTE\n');
  console.log('⚠️  ATTENTION: Cette action est IRRÉVERSIBLE !');
  console.log('⚠️  Toutes les données associées seront perdues.\n');

  try {
    // Lister les comptes supprimés
    const { rows: deleted } = await pool.query(`
      SELECT id, name, handle, email, created_at
      FROM users
      WHERE status = 'Supprimé'
      ORDER BY created_at DESC
    `);

    if (deleted.length === 0) {
      console.log('✅ Aucun compte supprimé à supprimer définitivement');
      await pool.end();
      return;
    }

    console.log(`📋 ${deleted.length} compte(s) supprimé(s) disponible(s):\n`);
    
    for (const user of deleted) {
      // Compter les données
      const { rows: [posts] } = await pool.query('SELECT COUNT(*) as count FROM posts WHERE user_handle = $1', [user.handle]);
      const { rows: [orders] } = await pool.query('SELECT COUNT(*) as count FROM orders WHERE user_handle = $1', [user.handle]);
      const { rows: [likes] } = await pool.query('SELECT COUNT(*) as count FROM likes WHERE user_handle = $1', [user.handle]);
      const { rows: [comments] } = await pool.query('SELECT COUNT(*) as count FROM comments WHERE user_handle = $1', [user.handle]);

      user.post_count = posts.count;
      user.order_count = orders.count;
      user.like_count = likes.count;
      user.comment_count = comments.count;

      console.log(`${deleted.indexOf(user) + 1}. ${user.name} (${user.handle}) - ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Données: ${user.post_count} posts, ${user.order_count} commandes, ${user.like_count} likes, ${user.comment_count} commentaires`);
      console.log('');
    }

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Entrez l\'ID du compte à supprimer DÉFINITIVEMENT (ou 0 pour annuler): ', async (answer) => {
      const userId = parseInt(answer.trim());

      if (userId === 0 || isNaN(userId)) {
        console.log('\n✅ Suppression annulée');
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

      // Confirmation finale
      readline.question(`\n⚠️  CONFIRMER la suppression définitive de ${user.handle} ? (tapez "SUPPRIMER" pour confirmer): `, async (confirm) => {
        if (confirm.trim() !== 'SUPPRIMER') {
          console.log('\n✅ Suppression annulée');
          readline.close();
          await pool.end();
          return;
        }

        try {
          console.log('\n🗑️  Suppression en cours...');

          // Supprimer les données associées (en fonction de votre schéma)
          await pool.query('DELETE FROM likes WHERE user_handle = $1', [user.handle]);
          console.log(`   ✅ ${user.like_count} like(s) supprimé(s)`);

          await pool.query('DELETE FROM comments WHERE user_handle = $1', [user.handle]);
          console.log(`   ✅ ${user.comment_count} commentaire(s) supprimé(s)`);

          await pool.query('DELETE FROM follows WHERE follower_handle = $1 OR following_handle = $1', [user.handle]);
          console.log(`   ✅ Relations de suivi supprimées`);

          await pool.query('DELETE FROM posts WHERE user_handle = $1', [user.handle]);
          console.log(`   ✅ ${user.post_count} post(s) supprimé(s)`);

          await pool.query('DELETE FROM messages WHERE sender_handle = $1 OR recipient_handle = $1', [user.handle]);
          console.log(`   ✅ Messages supprimés`);

          await pool.query('DELETE FROM notifications WHERE recipient_handle = $1 OR sender_handle = $1', [user.handle]);
          console.log(`   ✅ Notifications supprimées`);

          // Supprimer l'utilisateur
          await pool.query('DELETE FROM users WHERE id = $1', [userId]);
          console.log(`   ✅ Compte utilisateur supprimé`);

          console.log(`\n✅ Suppression définitive terminée !`);
          console.log(`   ${user.name} (${user.handle}) a été complètement supprimé de la base de données.`);

        } catch (error) {
          console.error('\n❌ Erreur lors de la suppression:', error.message);
        }

        readline.close();
        await pool.end();
      });
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await pool.end();
  }
}

permanentlyDeleteAccount();
