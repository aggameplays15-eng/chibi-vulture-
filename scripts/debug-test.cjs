require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  process.stdout.write('Step 1: connecting to DB...\n');
  try {
    await pool.query('SELECT 1');
    process.stdout.write('Step 2: DB OK\n');
  } catch(e) {
    process.stdout.write('DB ERROR: ' + e.message + '\n');
  }

  process.stdout.write('Step 3: clearing bans...\n');
  try {
    await pool.query('DELETE FROM ip_bans');
    process.stdout.write('Step 4: bans cleared\n');
  } catch(e) {
    process.stdout.write('BAN CLEAR ERROR: ' + e.message + '\n');
  }

  process.stdout.write('Step 5: making HTTP request...\n');
  const http = require('http');
  await new Promise((resolve) => {
    const r = http.request({ hostname: 'localhost', port: 3000, path: '/api/.env', method: 'GET',
      headers: { 'Origin': 'http://localhost:5173' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        process.stdout.write('Step 6: response status=' + res.statusCode + ' body=' + d.substring(0,100) + '\n');
        resolve();
      });
    });
    r.on('error', e => { process.stdout.write('HTTP ERROR: ' + e.message + '\n'); resolve(); });
    r.end();
  });

  await pool.end();
  process.stdout.write('Done.\n');
}

main().catch(e => { process.stdout.write('MAIN ERROR: ' + e.message + '\n' + e.stack + '\n'); pool.end(); });
