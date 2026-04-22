require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  console.log('Connecté à Neon...');

  await client.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status`);
  console.log('Ancienne contrainte supprimée.');

  await client.query(`
    ALTER TABLE orders ADD CONSTRAINT check_order_status
      CHECK (status IN (
        'En attente', 'En préparation', 'Expédiée', 'Livrée', 'Annulée',
        'pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'
      ))
  `);
  console.log('Nouvelle contrainte ajoutée.');

  // Vérifier les tables orphelines
  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log('\nTables en DB:', rows.map(r => r.table_name).join(', '));

  await client.end();
  console.log('\nMigration 019 terminée avec succès.');
}

run().catch(e => { console.error('ERREUR:', e.message); client.end(); process.exit(1); });
