-- ============================================
-- Combined Migrations for Chibi Vulture
-- Run this file on a fresh PostgreSQL database
-- ============================================

-- ============================================
-- Migration 003: Core tables (must run first)
-- ============================================

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
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  image TEXT NOT NULL,
  caption VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_handle, post_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  text VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  following_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_handle, following_handle)
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  category VARCHAR(50) DEFAULT 'general',
  featured BOOLEAN DEFAULT false,
  artist_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'En attente',
  shipping_address TEXT,
  phone VARCHAR(20),
  delivery_zone VARCHAR(100),
  delivery_price DECIMAL(10, 2) DEFAULT 0,
  tracking_number VARCHAR(100) UNIQUE,
  carrier VARCHAR(100) DEFAULT 'Chibi Express',
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_order_status
    CHECK (status IN ('En attente', 'pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  receiver_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user1_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  user2_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_handle, user2_handle)
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT,
  related_id INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Migration 001: Push notifications
-- ============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_handle)
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_handle ON push_subscriptions(user_handle);

-- ============================================
-- Migration 002: App settings
-- ============================================

CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('app_name', 'Chibi Vulture'),
  ('app_logo', '/favicon.ico'),
  ('app_description', 'Le réseau social artistique'),
  ('primary_color', '#EC4899')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Migration 005: Delivery tracking
-- ============================================

CREATE TABLE IF NOT EXISTS delivery_tracking_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  carrier VARCHAR(100),
  tracking_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_events_order_id ON delivery_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_events_status ON delivery_tracking_events(status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);

-- ============================================
-- Migration 006: Artist statistics
-- ============================================

CREATE TABLE IF NOT EXISTS artist_stats (
  id SERIAL PRIMARY KEY,
  artist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  products_sold INTEGER DEFAULT 0,
  active_products INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(artist_id, period, period_start)
);

CREATE TABLE IF NOT EXISTS artist_product_stats (
  id SERIAL PRIMARY KEY,
  artist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  sales_count INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(artist_id, product_id, period, period_start)
);

CREATE INDEX IF NOT EXISTS idx_artist_stats_artist_id ON artist_stats(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_stats_period ON artist_stats(period, period_start);
CREATE INDEX IF NOT EXISTS idx_artist_product_stats_artist_id ON artist_product_stats(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_product_stats_product_id ON artist_product_stats(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_artist_id ON products(artist_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ============================================
-- Migration 007: Product categories
-- ============================================

CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#EC4899',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO product_categories (name, description, icon, color, sort_order) VALUES
  ('Art Digital', 'Œuvres numériques et créations digitales', 'Palette', '#8B5CF6', 1),
  ('Merch', 'Produits dérivés et goodies', 'ShoppingBag', '#EC4899', 2),
  ('Accessoires', 'Accessoires et objets personnalisés', 'Sparkles', '#F59E0B', 3),
  ('Vêtements', 'T-shirts, hoodies et vêtements personnalisés', 'Shirt', '#3B82F6', 4),
  ('Livres', 'Livres, comics et publications', 'Book', '#10B981', 5),
  ('Limited', 'Éditions limitées et exclusives', 'Star', '#EF4444', 0)
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);

-- ============================================
-- Migration 008: Onboarding tracking
-- ============================================

CREATE TABLE IF NOT EXISTS user_onboarding (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_completed BOOLEAN DEFAULT false,
  tutorial_skipped BOOLEAN DEFAULT false,
  current_step INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(tutorial_completed);

-- ============================================
-- Migration 009: Seed data
-- ============================================

-- Sample products (no user dependency)
INSERT INTO products (name, description, price, image, stock, category, is_featured) VALUES
  ('T-Shirt Chibi Vulture', 'T-shirt coton premium avec logo Chibi', 250000, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300', 15, 'Vêtements', true),
  ('Stickers Pack Kawaii', 'Pack de 5 stickers autocollants', 125000, 'https://images.unsplash.com/photo-1572375927902-d60e60ad1710?q=80&w=300', 5, 'Accessoires', false),
  ('Art Print Limited', 'Tirage limité signé', 500000, 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=300', 3, 'Art Digital', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- Migration 010: Add is_read to messages
-- (safe to run on existing DB)
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
