const { Pool } = require('pg');

const isLocal = process.env.DATABASE_URL?.includes('localhost');
const isProd = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : {
    rejectUnauthorized: false  // Required for Neon/Supabase/Vercel Postgres
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased for Vercel cold starts
});

module.exports = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      // Logs uniquement en dev — pas de données sensibles en prod
      if (!isProd) {
        console.log('Query', { sql: text.substring(0, 80), duration, rows: result.rowCount });
      }
      return result;
    } catch (error) {
      // En prod, log minimal sans données sensibles
      if (isProd) {
        console.error('DB error:', error.code, error.message);
      } else {
        console.error('Database query error:', error);
      }
      // Check for connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        console.error('Database connection failed - check DATABASE_URL');
      }
      throw error;
    }
  },
  pool
};
