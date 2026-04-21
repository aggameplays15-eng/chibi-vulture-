const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS music_playlist (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      artist VARCHAR(200),
      youtube_url TEXT NOT NULL,
      youtube_id VARCHAR(20) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_music_playlist_active ON music_playlist(is_active)`);
  console.log('✓ music_playlist table created');
  await pool.end();
}
run().catch(console.error);
