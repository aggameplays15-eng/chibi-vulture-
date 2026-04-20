-- Migration: Add artist statistics tracking
-- Run this on your PostgreSQL database

-- Artist statistics table (aggregated data for artist dashboard)
CREATE TABLE IF NOT EXISTS artist_stats (
  id SERIAL PRIMARY KEY,
  artist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL, -- day, week, month, year
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  products_sold INTEGER DEFAULT 0,
  active_products INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(artist_id, period, period_start)
);

-- Top products per artist (for performance tracking)
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

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artist_stats_artist_id ON artist_stats(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_stats_period ON artist_stats(period, period_start);
CREATE INDEX IF NOT EXISTS idx_artist_product_stats_artist_id ON artist_product_stats(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_product_stats_product_id ON artist_product_stats(product_id);
