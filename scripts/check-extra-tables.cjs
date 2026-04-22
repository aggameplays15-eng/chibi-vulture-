require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();

  // Vérifier token_blacklist
  const { rows: tb } = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'token_blacklist' ORDER BY ordinal_position`);
  console.log('token_blacklist columns:', tb.map(r => `${r.column_name}(${r.data_type})`).join(', '));
  const { rows: tbCount } = await client.query('SELECT COUNT(*) FROM token_blacklist');
  console.log('token_blacklist rows:', tbCount[0].count);

  // Vérifier audit_logs
  const { rows: al } = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_logs' ORDER BY ordinal_position`);
  console.log('audit_logs columns:', al.map(r => `${r.column_name}(${r.data_type})`).join(', '));
  const { rows: alCount } = await client.query('SELECT COUNT(*) FROM audit_logs');
  console.log('audit_logs rows:', alCount[0].count);

  // Vérifier la contrainte orders
  const { rows: constraints } = await client.query(`
    SELECT constraint_name, check_clause FROM information_schema.check_constraints
    WHERE constraint_name = 'check_order_status'
  `);
  console.log('\nConstrainte check_order_status:', constraints[0]?.check_clause || 'NON TROUVÉE');

  await client.end();
}

run().catch(e => { console.error(e.message); client.end(); });
