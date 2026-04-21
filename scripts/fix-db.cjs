const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('=== FIXING DATABASE SCHEMA ===\n');

    // 1. Fix orders table — add user_handle column (backend expects it)
    console.log('1. Adding user_handle to orders...');
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_handle VARCHAR(50)`);
    console.log('   ✓ user_handle added');

    // 2. Add home_logo to app_settings
    console.log('2. Adding header_logo and home_logo to app_settings...');
    await client.query(`
      INSERT INTO app_settings (key, value)
      VALUES ('header_logo', '/favicon.ico'), ('home_logo', '/favicon.ico')
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('   ✓ header_logo and home_logo added');

    // 3. Add reports column to posts (used by PostModeration)
    console.log('3. Adding reports column to posts...');
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS reports INTEGER DEFAULT 0`);
    console.log('   ✓ reports added');

    // 4. Add comments_count column to posts (used by Feed)
    console.log('4. Adding comments_count to posts...');
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0`);
    console.log('   ✓ comments_count added');

    // 5. Add likes column to posts (used by Feed)
    console.log('5. Adding likes column to posts...');
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0`);
    console.log('   ✓ likes added');

    // 6. Verify orders handler — check if user_handle FK can be added
    console.log('6. Checking orders user_handle FK...');
    try {
      await client.query(`
        ALTER TABLE orders
        ADD CONSTRAINT fk_orders_user_handle
        FOREIGN KEY (user_handle) REFERENCES users(handle) ON DELETE CASCADE
      `);
      console.log('   ✓ FK added');
    } catch (e) {
      console.log('   ~ FK already exists or skipped:', e.message);
    }

    await client.query('COMMIT');
    console.log('\n=== ALL FIXES APPLIED ===');

    // Final state check
    const settings = await pool.query('SELECT key FROM app_settings ORDER BY key');
    console.log('\napp_settings keys:', settings.rows.map(r => r.key).join(', '));

    const orderCols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position"
    );
    console.log('orders columns:', orderCols.rows.map(r => r.column_name).join(', '));

    const postCols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'posts' ORDER BY ordinal_position"
    );
    console.log('posts columns:', postCols.rows.map(r => r.column_name).join(', '));

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ERROR:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
