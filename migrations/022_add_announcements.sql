-- Migration 022: Table announcements (notifications globales admin)
CREATE TABLE IF NOT EXISTS announcements (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  body       TEXT,
  icon       VARCHAR(100) DEFAULT '📢',
  url        TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
