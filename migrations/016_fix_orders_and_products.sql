-- Migration 016: Fix missing columns in orders and products tables

-- Add missing columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS carrier VARCHAR(100),
  ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP,
  ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMP;

-- Fix products table: rename featured -> is_featured if needed, add missing columns
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS artist_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- If 'featured' column exists (old name), migrate data and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'featured'
  ) THEN
    UPDATE products SET is_featured = featured WHERE featured IS NOT NULL;
    ALTER TABLE products DROP COLUMN featured;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_artist_id ON products(artist_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_handle ON orders(user_handle);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Add user_otp table for 2FA login (used by login.js and login-verify-otp.js)
CREATE TABLE IF NOT EXISTS user_otp (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(64) NOT NULL,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_otp_user_id ON user_otp(user_id);
CREATE INDEX IF NOT EXISTS idx_user_otp_expires ON user_otp(expires_at);
