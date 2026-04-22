const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clean() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminEmail = process.env.ADMIN_EMAIL;
    console.log(`\n🔒 Préservation de l'admin: ${adminEmail}\n`);

    // Récupérer le handle admin
    const adminRes = await client.query('SELECT handle FROM users WHERE email = $1', [adminEmail]);
    const adminHandle = adminRes.rows[0]?.handle;
    if (adminHandle) console.log(`   Handle admin: ${adminHandle}`);

    // Tables à vider complètement (pas liées aux users directement)
    const fullTruncate = [
      'push_subscriptions',
      'revoked_tokens',
      'otp_codes',
      'admin_otp',
      'user_otp',
      'rate_limit_log',
      'security_events',
      'ip_blacklist',
      'delivery_tracking',
      'order_items',
      'notifications',
      'messages',
      'conversations',
      'follows',
      'likes',
      'comments',
      'posts',
      'orders',
    ];

    for (const table of fullTruncate) {
      try {
        await client.query('SAVEPOINT sp');
        const res = await client.query(`DELETE FROM ${table}`);
        await client.query('RELEASE SAVEPOINT sp');
        console.log(`✅ ${table}: ${res.rowCount} ligne(s) supprimée(s)`);
      } catch (e) {
        await client.query('ROLLBACK TO SAVEPOINT sp');
        if (e.message.includes('does not exist')) {
          console.log(`⏭️  ${table}: table inexistante, ignorée`);
        } else {
          console.warn(`⚠️  ${table}: ${e.message}`);
        }
      }
    }

    // Supprimer tous les users sauf l'admin
    const usersRes = await client.query(
      `DELETE FROM users WHERE email != $1`,
      [adminEmail]
    );
    console.log(`✅ users: ${usersRes.rowCount} compte(s) de test supprimé(s)`);

    await client.query('COMMIT');
    console.log('\n✅ Nettoyage terminé avec succès.\n');

    // Vérification finale
    const counts = await pool.query(`
      SELECT 'users' as t, COUNT(*) FROM users
      UNION ALL SELECT 'posts', COUNT(*) FROM posts
      UNION ALL SELECT 'orders', COUNT(*) FROM orders
      UNION ALL SELECT 'comments', COUNT(*) FROM comments
      UNION ALL SELECT 'follows', COUNT(*) FROM follows
    `);
    console.log('=== ÉTAT FINAL ===');
    counts.rows.forEach(r => console.log(` - ${r.t}: ${r.count}`));

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur, rollback effectué:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

clean();
