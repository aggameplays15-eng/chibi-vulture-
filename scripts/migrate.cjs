// Script de migration automatique vers Neon PostgreSQL
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run(client, label, sql) {
  try {
    await client.query(sql);
    console.log(`  ✓ ${label}`);
  } catch (err) {
    if (err.message.includes('already exists') || err.code === '23505') {
      console.log(`  ⚠ Déjà existant: ${label}`);
    } else {
      console.error(`  ✗ ERREUR [${err.code}] ${label}: ${err.message}`);
    }
  }
}

async function migrate() {
  const client = await pool.connect();
  console.log('✅ Connecté à Neon PostgreSQL\n');

  // ── Colonnes manquantes sur tables existantes ──────────────────────────────
  await run(client, 'users.notification_push',        `ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true`);
  await run(client, 'users.notification_email',       `ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true`);
  await run(client, 'users.onboarding_completed',     `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false`);
  await run(client, 'users.onboarding_completed_at',  `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP`);
  await run(client, 'orders.shipping_address',        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT`);
  await run(client, 'orders.phone',                   `ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);
  await run(client, 'orders.delivery_zone',           `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone VARCHAR(100)`);
  await run(client, 'orders.delivery_price',          `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10,2) DEFAULT 0`);
  await run(client, 'orders.tracking_number',         `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100)`);
  await run(client, 'orders.carrier',                 `ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(100) DEFAULT 'Chibi Express'`);
  await run(client, 'orders.estimated_delivery',      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP`);
  await run(client, 'orders.actual_delivery',         `ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMP`);
  await run(client, 'products.artist_id',             `ALTER TABLE products ADD COLUMN IF NOT EXISTS artist_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
  await run(client, 'products.category',              `ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general'`);
  await run(client, 'products.featured',              `ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false`);
  await run(client, 'products.is_featured',           `ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`);
  await run(client, 'messages.is_read',               `ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false`);

  // ── Nouvelles tables ───────────────────────────────────────────────────────
  await run(client, 'TABLE push_subscriptions', `
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
      subscription JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_handle)
    )
  `);

  await run(client, 'TABLE app_settings', `
    CREATE TABLE IF NOT EXISTS app_settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) UNIQUE NOT NULL,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run(client, 'TABLE order_items', `
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      price_at_purchase DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(client, 'TABLE delivery_tracking_events', `
    CREATE TABLE IF NOT EXISTS delivery_tracking_events (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      location VARCHAR(255),
      carrier VARCHAR(100),
      tracking_number VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(client, 'TABLE artist_stats', `
    CREATE TABLE IF NOT EXISTS artist_stats (
      id SERIAL PRIMARY KEY,
      artist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      period VARCHAR(20) NOT NULL,
      period_start TIMESTAMP NOT NULL,
      period_end TIMESTAMP NOT NULL,
      total_sales INTEGER DEFAULT 0,
      total_revenue DECIMAL(10,2) DEFAULT 0,
      products_sold INTEGER DEFAULT 0,
      active_products INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(artist_id, period, period_start)
    )
  `);

  await run(client, 'TABLE product_categories', `
    CREATE TABLE IF NOT EXISTS product_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      color VARCHAR(7) DEFAULT '#EC4899',
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(client, 'TABLE user_onboarding', `
    CREATE TABLE IF NOT EXISTS user_onboarding (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tutorial_completed BOOLEAN DEFAULT false,
      tutorial_skipped BOOLEAN DEFAULT false,
      current_step INTEGER DEFAULT 0,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id)
    )
  `);

  // ── Seed data ──────────────────────────────────────────────────────────────
  await run(client, 'SEED app_settings', `
    INSERT INTO app_settings (key, value) VALUES
      ('app_name', 'Chibi Vulture'),
      ('app_logo', '/favicon.ico'),
      ('app_description', 'Le réseau social artistique'),
      ('primary_color', '#EC4899')
    ON CONFLICT (key) DO NOTHING
  `);

  await run(client, 'SEED product_categories', `
    INSERT INTO product_categories (name, description, icon, color, sort_order) VALUES
      ('Art Digital', 'Œuvres numériques et créations digitales', 'Palette', '#8B5CF6', 1),
      ('Merch', 'Produits dérivés et goodies', 'ShoppingBag', '#EC4899', 2),
      ('Accessoires', 'Accessoires et objets personnalisés', 'Sparkles', '#F59E0B', 3),
      ('Vêtements', 'T-shirts, hoodies et vêtements personnalisés', 'Shirt', '#3B82F6', 4),
      ('Livres', 'Livres, comics et publications', 'Book', '#10B981', 5),
      ('Limited', 'Éditions limitées et exclusives', 'Star', '#EF4444', 0)
    ON CONFLICT (name) DO NOTHING
  `);

  await run(client, 'SEED products', `
    INSERT INTO products (name, description, price, image, stock, category, is_featured) VALUES
      ('T-Shirt Chibi Vulture', 'T-shirt coton premium avec logo Chibi', 250000, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300', 15, 'Vêtements', true),
      ('Stickers Pack Kawaii', 'Pack de 5 stickers autocollants', 125000, 'https://images.unsplash.com/photo-1572375927902-d60e60ad1710?q=80&w=300', 5, 'Accessoires', false),
      ('Art Print Limited', 'Tirage limité signé', 500000, 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=300', 3, 'Art Digital', true)
    ON CONFLICT DO NOTHING
  `);

  // ── Index ──────────────────────────────────────────────────────────────────
  const indexes = [
    ['idx_push_subscriptions_user_handle', 'push_subscriptions(user_handle)'],
    ['idx_order_items_order_id',           'order_items(order_id)'],
    ['idx_order_items_product_id',         'order_items(product_id)'],
    ['idx_delivery_tracking_order_id',     'delivery_tracking_events(order_id)'],
    ['idx_delivery_tracking_status',       'delivery_tracking_events(status)'],
    ['idx_orders_tracking_number',         'orders(tracking_number)'],
    ['idx_artist_stats_artist_id',         'artist_stats(artist_id)'],
    ['idx_artist_product_stats_artist',    'artist_product_stats(artist_id)'],
    ['idx_artist_product_stats_product',   'artist_product_stats(product_id)'],
    ['idx_products_artist_id',             'products(artist_id)'],
    ['idx_products_category',              'products(category)'],
    ['idx_product_categories_name',        'product_categories(name)'],
    ['idx_product_categories_active',      'product_categories(is_active)'],
    ['idx_user_onboarding_user_id',        'user_onboarding(user_id)'],
    ['idx_user_onboarding_completed',      'user_onboarding(tutorial_completed)'],
  ];

  for (const [name, on] of indexes) {
    await run(client, `INDEX ${name}`, `CREATE INDEX IF NOT EXISTS ${name} ON ${on}`);
  }

  // ── Résumé ─────────────────────────────────────────────────────────────────
  const { rows } = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `);
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`📋 Tables dans la DB (${rows.length}) :`);
  rows.forEach(r => console.log(`   • ${r.tablename}`));
  console.log(`\n🎉 Migration complète !`);

  client.release();
  await pool.end();
}

migrate().catch(err => {
  console.error('❌ Migration échouée :', err.message);
  process.exit(1);
});
