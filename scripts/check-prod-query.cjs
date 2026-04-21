const { Pool } = require('pg');

// Test avec l'URL exacte que Vercel utilise (depuis les env vars)
const url = process.env.DATABASE_URL;
console.log('URL prefix:', url ? url.substring(0, 60) + '...' : 'NOT SET');

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const r1 = await pool.query('SELECT COUNT(*) FROM products');
    console.log('✅ products query OK —', r1.rows[0].count, 'rows');

    const r2 = await pool.query('SELECT COUNT(*) FROM posts');
    console.log('✅ posts query OK —', r2.rows[0].count, 'rows');

    const r3 = await pool.query('SELECT COUNT(*) FROM music_playlist');
    console.log('✅ music_playlist query OK —', r3.rows[0].count, 'rows');

    const r4 = await pool.query('SELECT COUNT(*) FROM product_categories');
    console.log('✅ product_categories query OK —', r4.rows[0].count, 'rows');

    console.log('\n✅ ALL QUERIES PASS — DB is fine locally');
    console.log('⚠️  The 500s on Vercel are likely due to missing env vars on Vercel dashboard');
  } catch (e) {
    console.error('❌ Query failed:', e.message);
    console.error('Code:', e.code);
  } finally {
    await pool.end();
  }
}

main();
