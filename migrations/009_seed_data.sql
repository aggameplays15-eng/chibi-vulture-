-- Seed Data Script for Chibi Vulture
-- This script inserts real data for testing and production
-- Run this after all migrations are executed

-- Insert sample users
INSERT INTO users (name, handle, email, bio, avatar_color, password, role, is_approved, status) VALUES
('ChibiMomo', '@momo', 'momo@example.com', 'Artiste digital passionné ✨', '#EC4899', '$2b$10$hash', 'Artist', true, 'Actif'),
('VultureKing', '@king', 'king@example.com', 'Créateur de contenu 🦅', '#8B5CF6', '$2b$10$hash', 'Artist', true, 'Actif'),
('ArtLover', '@artlover', 'art@example.com', 'Amateur d''art', '#3B82F6', '$2b$10$hash', 'Member', true, 'Actif')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, image, stock, category, is_featured) VALUES
('T-Shirt Chibi Vulture', 'T-shirt coton premium avec logo Chibi', 250000, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300', 15, 'Vêtements', true),
('Stickers Pack Kawaii', 'Pack de 5 stickers autocollants', 125000, 'https://images.unsplash.com/photo-1572375927902-d60e60ad1710?q=80&w=300', 5, 'Accessoires', false),
('Art Print Limited', 'Tirage limité signé', 500000, 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=300', 3, 'Art Digital', true)
ON CONFLICT DO NOTHING;

-- Insert sample posts
INSERT INTO posts (user_handle, image, caption) VALUES
('@momo', 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=600', 'Mon premier dessin ! ✨'),
('@king', 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=600', 'Style Vulture activé 🦅')
ON CONFLICT DO NOTHING;

-- Insert sample order
INSERT INTO orders (user_handle, total, status) VALUES
('@artlover', 375000, 'pending')
ON CONFLICT DO NOTHING;

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
(1, 1, 1, 250000),
(1, 2, 1, 125000)
ON CONFLICT DO NOTHING;

-- Insert delivery tracking events
INSERT INTO delivery_tracking_events (order_id, status, description, location, carrier, tracking_number) VALUES
(1, 'pending', 'Commande reçue', 'Conakry', 'Chibi Express', 'CV-TEST001'),
(1, 'processing', 'Commande en préparation', 'Conakry', 'Chibi Express', 'CV-TEST001')
ON CONFLICT DO NOTHING;

-- Update order with tracking info
UPDATE orders SET 
  tracking_number = 'CV-TEST001',
  carrier = 'Chibi Express',
  estimated_delivery = NOW() + INTERVAL '2 days'
WHERE id = 1;
