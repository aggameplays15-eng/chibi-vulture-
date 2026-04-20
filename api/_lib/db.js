const { Pool } = require('pg');
const { validateEnv } = require('./validateEnv');

// Validate environment variables on first import
validateEnv();

// SECURITY FIX: Never use VITE_ prefixed vars on the server — they get bundled into the client bundle.
// Use DATABASE_URL only (set in Vercel environment variables, not exposed to frontend).
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
