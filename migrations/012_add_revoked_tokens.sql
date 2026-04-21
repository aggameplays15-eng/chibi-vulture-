-- Table pour la révocation de tokens JWT (logout DB-backed)
-- Fonctionne sur toutes les instances serverless Vercel

CREATE TABLE IF NOT EXISTS revoked_tokens (
  token_hash  VARCHAR(64) PRIMARY KEY,  -- SHA-256 hex du token
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accélérer la vérification et le nettoyage
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens (expires_at);

-- Nettoyage automatique des tokens expirés (PostgreSQL 13+)
-- À exécuter via un cron job ou manuellement
-- DELETE FROM revoked_tokens WHERE expires_at < NOW();
