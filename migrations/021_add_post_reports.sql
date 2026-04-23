-- Add reports column to posts table for moderation
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reports INTEGER DEFAULT 0;
