// Migration complète — crée toutes les tables manquantes et corrige le schéma
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

let ok = 0, warn = 0, fail = 0;

async function run(client, label, sql) {
  try {
    await client.query(sql);
    console.log(`  ✓ ${label}`);
    ok++;
  } catch (err) {
    if (err.message.includes('already exists') || err.code === '23505') {
      console.log(`  ~ ${label} (déjà existant)`);
      warn++;
    } else {
      console.error(`  ✗ [${err.code}] ${label}: ${err.message}`);
      fail++;
    }
  }
}

async function migrate() {
  const client = await pool.connect();
  console.log('✅ Connecté à Neon PostgreSQL\n');

  // ── 1. TABLES DE BASE ─────────────────────────────────────────────────────
  console.log('── Tables de base ──');

  await run(client, 'TABLE users', `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      handle VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      bio TEXT,
      avatar_color VARCHAR(7) DEFAULT '#94a3b8',
      avatar_image TEXT,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'Member',
      is_approved BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'Actif',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(client, 'TABLE posts', `
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
      image TEXT NOT NULL,
      caption VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(client, 'TABLE likes', `
    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_handle, post_id)
    )
  `);

  await run(client, 'TABLE comments', `
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
      text VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(client, 'TABLE follows', `
    CREATE TABLE IF NOT EXISTS follows (
      id SERIAL PRIMARY KEY,
      follower_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
      following_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_handle, following_handle)
    )
  `);

  await run(client, 'TABLE products', `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      category VARCHAR(50) DEFAULT 'general',
      is_featured BOOLEAN DEFAULT false,
      artist_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(client, 'TABLE orders', `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'En attente',
      shipping_address TEXT,
      phone VARCHAR(30),
      tracking_number VARCHAR(100),
      carrier VARCHAR(100) DEFAULT 'Chibi Express',
      estimated_delivery TIMESTAMP,
      actual_delivery TIMESTAMP,
      delivery_zone VARCHAR(100),
      delivery_price DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(client, 'TABLE messages', `
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
      receiver_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
      text TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(client, 'TABLE notifications', `
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      content TEXT,
      related_id INTEGER,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── 2. COLONNES MANQUANTES ────────────────────────────────────────────────
  console.log('\n── Colonnes manquantes ──');

  // users
  await run(client, 'users.notification_push',       `ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true`);
  await run(client, 'users.notification_email',      `ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true`);
  await run(client, 'users.onboarding_completed',    `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false`);
  await run(client, 'users.onboarding_completed_at', `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP`);

  // orders
  await run(client, 'orders.shipping_address',   `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT`);
  await run(client, 'orders.phone',              `ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(30)`);
  await run(client, 'orders.tracking_number',    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100)`);
  await run(client, 'orders.carrier',            `ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(100) DEFAULT 'Chibi Express'`);
  await run(client, 'orders.estimated_delivery', `ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP`);
  await run(client, 'orders.actual_delivery',    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMP`);
  await run(client, 'orders.delivery_zone',      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone VARCHAR(100)`);
  await run(client, 'orders.delivery_price',     `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10,2) DEFAULT 0`);

  // products
  await run(client, 'products.category',    `ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general'`);
  await run(client, 'products.is_featured', `ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`);
  await run(client, 'products.artist_id',   `ALTER TABLE products ADD COLUMN IF NOT EXISTS artist_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);

  // Migrer featured -> is_featured si l'ancienne colonne existe
  await run(client, 'products: migrate featured->is_featured', `
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='featured') THEN
        UPDATE products SET is_featured = featured WHERE featured IS NOT NULL;
        ALTER TABLE products DROP COLUMN IF EXISTS featured;
      END IF;
    END $$
  `);

  // messages
  await run(client, 'messages.is_read', `ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false`);

  // ── 3. TABLES FONCTIONNELLES ──────────────────────────────────────────────
  console.log('\n── Tables fonctionnelles ──');

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

  await run(client, 'TABLE music_playlist', `
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

  // ── 4. TABLES DE SÉCURITÉ ─────────────────────────────────────────────────
  console.log('\n── Tables de sécurité ──');

  await run(client, 'TABLE admin_otp', `
    CREATE TABLE IF NOT EXISTS admin_otp (
      id SERIAL PRIMARY KEY,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await run(client, 'TABLE user_otp', `
    CREATE TABLE IF NOT EXISTS user_otp (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash VARCHAR(64) NOT NULL,
      used BOOLEAN DEFAULT false,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(client, 'TABLE revoked_tokens', `
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      token_hash VARCHAR(64) PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await run(client, 'TABLE security_log', `
    CREATE TABLE IF NOT EXISTS security_log (
      id BIGSERIAL PRIMARY KEY,
      ip VARCHAR(64) NOT NULL,
      threat_type VARCHAR(50) NOT NULL,
      detail TEXT,
      path TEXT,
      method VARCHAR(10),
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await run(client, 'TABLE ip_bans', `
    CREATE TABLE IF NOT EXISTS ip_bans (
      ip VARCHAR(64) PRIMARY KEY,
      reason TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await run(client, 'TABLE rate_limit_log', `
    CREATE TABLE IF NOT EXISTS rate_limit_log (
      id BIGSERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      ip TEXT,
      type TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await run(client, 'rate_limit_log.ip',   `ALTER TABLE rate_limit_log ADD COLUMN IF NOT EXISTS ip TEXT`);
  await run(client, 'rate_limit_log.type', `ALTER TABLE rate_limit_log ADD COLUMN IF NOT EXISTS type TEXT`);

  await run(client, 'TABLE rate_limit_violations', `
    CREATE TABLE IF NOT EXISTS rate_limit_violations (
      id BIGSERIAL PRIMARY KEY,
      ip TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ── 5. SEED DATA ──────────────────────────────────────────────────────────
  console.log('\n── Seed data ──');

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

  // ── 6. INDEX ──────────────────────────────────────────────────────────────
  console.log('\n── Index ──');

  const indexes = [
    ['idx_push_subscriptions_user',    'push_subscriptions(user_handle)'],
    ['idx_order_items_order_id',       'order_items(order_id)'],
    ['idx_order_items_product_id',     'order_items(product_id)'],
    ['idx_delivery_tracking_order',    'delivery_tracking_events(order_id)'],
    ['idx_delivery_tracking_status',   'delivery_tracking_events(status)'],
    ['idx_orders_tracking_number',     'orders(tracking_number)'],
    ['idx_orders_user_handle',         'orders(user_handle)'],
    ['idx_orders_status',              'orders(status)'],
    ['idx_artist_stats_artist_id',     'artist_stats(artist_id)'],
    ['idx_products_artist_id',         'products(artist_id)'],
    ['idx_products_category',          'products(category)'],
    ['idx_product_categories_name',    'product_categories(name)'],
    ['idx_product_categories_active',  'product_categories(is_active)'],
    ['idx_music_playlist_active',      'music_playlist(is_active)'],
    ['idx_music_playlist_order',       'music_playlist(sort_order)'],
    ['idx_user_onboarding_user_id',    'user_onboarding(user_id)'],
    ['idx_admin_otp_expires',          'admin_otp(expires_at)'],
    ['idx_user_otp_user_id',           'user_otp(user_id)'],
    ['idx_user_otp_expires',           'user_otp(expires_at)'],
    ['idx_revoked_tokens_expires',     'revoked_tokens(expires_at)'],
    ['idx_security_log_ip',            'security_log(ip)'],
    ['idx_security_log_type',          'security_log(threat_type)'],
    ['idx_security_log_created_at',    'security_log(created_at)'],
    ['idx_ip_bans_expires',            'ip_bans(expires_at)'],
    ['idx_rate_limit_log_ip_created',  'rate_limit_log(ip, created_at)'],
    ['idx_rate_limit_violations_ip',   'rate_limit_violations(ip, type, created_at)'],
  ];

  for (const [name, on] of indexes) {
    await run(client, `INDEX ${name}`, `CREATE INDEX IF NOT EXISTS ${name} ON ${on}`);
  }

  // ── RÉSUMÉ ────────────────────────────────────────────────────────────────
  const { rows } = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `);

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`📋 Tables dans la DB (${rows.length}) :`);
  rows.forEach(r => console.log(`   • ${r.tablename}`));
  console.log(`\n✅ ${ok} opérations réussies  ⚠ ${warn} déjà existantes  ✗ ${fail} erreurs`);
  console.log(fail === 0 ? '\n🎉 Migration complète sans erreur !' : '\n⚠️  Migration terminée avec des erreurs.');

  client.release();
  await pool.end();
}

migrate().catch(err => {
  console.error('❌ Migration échouée :', err.message);
  process.exit(1);
});
