require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  console.log('Connecté à Neon...');

  const migrationSQL = fs.readFileSync('./migrations/023_add_message_read_status.sql', 'utf8');
  
  await client.query(migrationSQL);
  console.log('Colonne is_read ajoutée à la table messages.');

  // Vérifier la colonne
  const { rows } = await client.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'is_read'
  `);
  
  if (rows.length > 0) {
    console.log('Vérification:', rows[0]);
  }

  await client.end();
  console.log('\nMigration 023 terminée avec succès.');
}

run().catch(e => { console.error('ERREUR:', e.message); client.end(); process.exit(1); });
