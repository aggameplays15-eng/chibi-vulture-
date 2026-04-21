const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const { rows } = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('\n=== TABLES IN PRODUCTION DB ===');
    if (rows.length === 0) {
      console.log('❌ NO TABLES FOUND — migrations have never been run!');
    } else {
      rows.forEach(r => console.log(' ✅', r.table_name));
    }

    // Check specific critical tables
    const critical = ['users', 'posts', 'products', 'orders', 'music_playlist', 'product_categories', 'app_settings'];
    console.log('\n=== CRITICAL TABLES STATUS ===');
    for (const t of critical) {
      const exists = rows.some(r => r.table_name === t);
      if (exists) {
        const count = await pool.query(`SELECT COUNT(*) FROM ${t}`);
        console.log(` ✅ ${t} — ${count.rows[0].count} rows`);
      } else {
        console.log(` ❌ ${t} — MISSING`);
      }
    }
  } catch (e) {
    console.error('DB connection error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
