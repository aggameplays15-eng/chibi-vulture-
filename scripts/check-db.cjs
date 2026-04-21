const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // 1. List all tables
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('\n=== TABLES ===');
    tables.rows.forEach(r => console.log(' -', r.table_name));

    // 2. Check app_settings keys
    const settings = await pool.query('SELECT key, value FROM app_settings ORDER BY key');
    console.log('\n=== APP_SETTINGS ===');
    settings.rows.forEach(r => console.log(` - ${r.key}: ${r.value}`));

    // 3. Check orders columns
    const orderCols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position"
    );
    console.log('\n=== ORDERS COLUMNS ===');
    orderCols.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

    // 4. Check products columns
    const prodCols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position"
    );
    console.log('\n=== PRODUCTS COLUMNS ===');
    prodCols.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

    // 5. Check comments columns
    const commentCols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'comments' ORDER BY ordinal_position"
    );
    console.log('\n=== COMMENTS COLUMNS ===');
    commentCols.rows.forEach(r => console.log(` - ${r.column_name}`));

    // 6. Count rows in key tables
    const counts = await pool.query(`
      SELECT 'users' as t, COUNT(*) FROM users
      UNION ALL SELECT 'posts', COUNT(*) FROM posts
      UNION ALL SELECT 'products', COUNT(*) FROM products
      UNION ALL SELECT 'orders', COUNT(*) FROM orders
      UNION ALL SELECT 'comments', COUNT(*) FROM comments
    `);
    console.log('\n=== ROW COUNTS ===');
    counts.rows.forEach(r => console.log(` - ${r.t}: ${r.count}`));

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await pool.end();
  }
}

run();
