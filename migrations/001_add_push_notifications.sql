-- Migration: Add push notifications support
-- Run this on your PostgreSQL database

-- Table for push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_handle VARCHAR(50) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_handle)
);

-- Add notification preferences to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_handle ON push_subscriptions(user_handle);
