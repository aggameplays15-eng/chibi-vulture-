-- Migration 019: Fix order status constraint
-- Aligne la contrainte avec les valeurs françaises utilisées dans le code

ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status;

ALTER TABLE orders ADD CONSTRAINT check_order_status
  CHECK (status IN (
    'En attente', 'Préparation', 'Expédié', 'Livré', 'Annulé',
    'pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'
  ));
