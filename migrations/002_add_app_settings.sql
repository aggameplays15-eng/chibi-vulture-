-- Migration: Add app settings table
-- Run this on your PostgreSQL database

-- Table for application settings (logo, name, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default values
INSERT INTO app_settings (key, value) VALUES
  ('app_name', 'Chibi Vulture'),
  ('app_logo', '/favicon.ico'),
  ('app_description', 'Le réseau social artistique'),
  ('primary_color', '#EC4899')
ON CONFLICT (key) DO NOTHING;
