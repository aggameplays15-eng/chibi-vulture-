-- Migration: Add delivery tracking system
-- Run this on your PostgreSQL database

-- Delivery tracking events table
CREATE TABLE IF NOT EXISTS delivery_tracking_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- pending, processing, shipped, in_transit, delivered, cancelled
  description TEXT NOT NULL,
  location VARCHAR(255),
  carrier VARCHAR(100),
  tracking_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add tracking fields to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS carrier VARCHAR(100) DEFAULT 'Chibi Express',
  ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP,
  ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMP;

-- Update orders table status to include more delivery statuses
ALTER TABLE orders 
  ALTER COLUMN status SET DEFAULT 'pending',
  ADD CONSTRAINT check_order_status 
    CHECK (status IN ('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_events_order_id ON delivery_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_events_status ON delivery_tracking_events(status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
