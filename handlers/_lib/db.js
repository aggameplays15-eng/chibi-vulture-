const { Pool } = require('pg');

const isLocal = process.env.DATABASE_URL?.includes('localhost');
const isProd = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : {
    rejectUnauthorized: true  // Vérifie le certificat SSL en prod
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
        console.error('DB error:', error.code, error.constraint);
      } else {
        console.error('Database query error:', error);
      }
      throw error;
    }
  },
  pool
};
