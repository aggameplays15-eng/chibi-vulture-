-- Migration: Add product categories management
-- Run this on your PostgreSQL database

-- Product categories table
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

-- Insert default categories
INSERT INTO product_categories (name, description, icon, color, sort_order) VALUES
  ('Art Digital', 'Œuvres numériques et créations digitales', 'Palette', '#8B5CF6', 1),
  ('Merch', 'Produits dérivés et goodies', 'ShoppingBag', '#EC4899', 2),
  ('Accessoires', 'Accessoires et objets personnalisés', 'Sparkles', '#F59E0B', 3),
  ('Vêtements', 'T-shirts, hoodies et vêtements personnalisés', 'Shirt', '#3B82F6', 4),
  ('Livres', 'Livres, comics et publications', 'Book', '#10B981', 5),
  ('Limited', 'Éditions limitées et exclusives', 'Star', '#EF4444', 0)
ON CONFLICT (name) DO NOTHING;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);
