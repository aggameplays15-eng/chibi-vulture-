-- Migration: Add order items for detailed order tracking
-- Run this on your PostgreSQL database

-- Order items table (to track products in each order)
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add artist_id to products table (for artist dashboard)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS artist_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add delivery zone to orders
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS delivery_zone VARCHAR(100),
  ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_artist_id ON products(artist_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
