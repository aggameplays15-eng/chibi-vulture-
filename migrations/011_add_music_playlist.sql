-- Migration: Add music playlist table
CREATE TABLE IF NOT EXISTS music_playlist (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  artist VARCHAR(200),
  youtube_url TEXT NOT NULL,
  youtube_id VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_music_playlist_active ON music_playlist(is_active);
CREATE INDEX IF NOT EXISTS idx_music_playlist_order ON music_playlist(sort_order);
