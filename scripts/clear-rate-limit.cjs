#!/usr/bin/env node
/**
 * Nettoie le rate limit pour permettre de nouvelles tentatives
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearRateLimit() {
  console.log('\n🧹 Nettoyage du rate limit...\n');

  try {
    // Vérifier si les tables existent
    const { rows: tables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('rate_limit_log', 'rate_limit_violations')
    `);

    const existingTables = tables.map(t => t.table_name);

    if (existingTables.length === 0) {
      console.log('⚠️  Les tables de rate limit n\'existent pas');
      console.log('   Tables attendues: rate_limit_log, rate_limit_violations');
      await pool.end();
      return;
    }

    console.log(`✅ Tables trouvées: ${existingTables.join(', ')}`);

    // Afficher les entrées actuelles
    if (existingTables.includes('rate_limit_log')) {
      const { rows: current } = await pool.query(`
        SELECT type, COUNT(*) as count, MAX(created_at) as last_attempt
        FROM rate_limit_log
        GROUP BY type
        ORDER BY type
      `);

      if (current.length === 0) {
        console.log('\n📊 Aucune entrée de rate limit');
      } else {
        console.log('\n📊 Entrées actuelles:');
        current.forEach(row => {
          console.log(`   ${row.type}: ${row.count} tentative(s), dernière: ${row.last_attempt}`);
        });
      }
    }

    // Afficher les violations
    if (existingTables.includes('rate_limit_violations')) {
      const { rows: violations } = await pool.query(`
        SELECT ip, type, COUNT(*) as count
        FROM rate_limit_violations
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY ip, type
        ORDER BY count DESC
      `);

      if (violations.length > 0) {
        console.log('\n⚠️  Violations actives (24h):');
        violations.forEach(v => {
          console.log(`   ${v.ip} (${v.type}): ${v.count} violation(s)`);
        });
      }
    }

    // Nettoyer
    let totalDeleted = 0;

    if (existingTables.includes('rate_limit_log')) {
      const { rowCount: logCount } = await pool.query('DELETE FROM rate_limit_log');
      console.log(`\n✅ ${logCount} entrée(s) de rate_limit_log supprimée(s)`);
      totalDeleted += logCount;
    }

    if (existingTables.includes('rate_limit_violations')) {
      const { rowCount: violCount } = await pool.query('DELETE FROM rate_limit_violations');
      console.log(`✅ ${violCount} violation(s) supprimée(s)`);
      totalDeleted += violCount;
    }

    console.log(`\n✅ Total: ${totalDeleted} entrée(s) supprimée(s)`);
    console.log('\n💡 Vous pouvez maintenant réessayer de créer un compte');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

clearRateLimit();
