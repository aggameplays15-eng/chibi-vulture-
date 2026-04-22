-- Migration 019: Fix order status constraint to support French status values
-- The original constraint in 005 only allowed English values, but the app uses French

-- Drop old constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status;

-- Add new constraint supporting both French (app) and English (legacy) values
ALTER TABLE orders ADD CONSTRAINT check_order_status
  CHECK (status IN (
    'En attente', 'En préparation', 'Expédiée', 'Livrée', 'Annulée',
    'pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'
  ));
