require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run(client, label, sql) {
  try {
    await client.query(sql);
    console.log(`  ✓ ${label}`);
  } catch (err) {
    if (err.message.includes('already exists') || err.code === '23505') {
      console.log(`  ⚠ Déjà existant: ${label}`);
    } else {
      console.error(`  ✗ [${err.code}] ${label}: ${err.message}`);
    }
  }
}

async function main() {
  const client = await pool.connect();
  console.log('✅ Connecté\n');

  // products.description manquante
  await run(client, 'products.description', `ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT`);

  // order_items — FK sur orders.id TEXT
  await run(client, 'TABLE order_items', `
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      price_at_purchase DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // delivery_tracking_events — FK sur orders.id TEXT
  await run(client, 'TABLE delivery_tracking_events', `
    CREATE TABLE IF NOT EXISTS delivery_tracking_events (
      id SERIAL PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      location VARCHAR(255),
      carrier VARCHAR(100),
      tracking_number VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Index pour ces tables
  await run(client, 'INDEX order_items_order_id',       `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`);
  await run(client, 'INDEX order_items_product_id',     `CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)`);
  await run(client, 'INDEX delivery_tracking_order_id', `CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking_events(order_id)`);
  await run(client, 'INDEX delivery_tracking_status',   `CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON delivery_tracking_events(status)`);

  // Seed products avec description
  await run(client, 'SEED products', `
    INSERT INTO products (name, description, price, image, stock, category, is_featured) VALUES
      ('T-Shirt Chibi Vulture', 'T-shirt coton premium avec logo Chibi', 250000, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300', 15, 'Vêtements', true),
      ('Stickers Pack Kawaii', 'Pack de 5 stickers autocollants', 125000, 'https://images.unsplash.com/photo-1572375927902-d60e60ad1710?q=80&w=300', 5, 'Accessoires', false),
      ('Art Print Limited', 'Tirage limité signé', 500000, 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=300', 3, 'Art Digital', true)
    ON CONFLICT DO NOTHING
  `);

  // Vérification finale
  const { rows } = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `);
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📋 Tables dans la DB (${rows.length}) :`);
  rows.forEach(r => console.log(`   • ${r.tablename}`));
  console.log('\n🎉 Tout est prêt !');

  client.release();
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
