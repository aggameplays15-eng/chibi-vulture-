-- Migration 015 — Protection DoS/DDoS renforcée
-- Ajoute les colonnes ip/type à rate_limit_log et crée rate_limit_violations

-- Ajouter ip et type à rate_limit_log si absents
ALTER TABLE rate_limit_log
  ADD COLUMN IF NOT EXISTS ip   TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT;

-- Index pour les requêtes de détection flood/DDoS
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_ip_created
  ON rate_limit_log (ip, created_at);

-- Table des violations de rate limit (pour ban progressif)
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id         BIGSERIAL PRIMARY KEY,
  ip         TEXT        NOT NULL,
  type       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip_type
  ON rate_limit_violations (ip, type, created_at);

-- Étendre ip_bans pour conserver l'historique (GREATEST dans le ON CONFLICT)
-- La colonne expires_at existe déjà, rien à faire.

-- Nettoyage automatique des vieilles entrées (si pg_cron disponible)
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *',
--   $$DELETE FROM rate_limit_log WHERE created_at < NOW() - INTERVAL '2 hours';
--     DELETE FROM rate_limit_violations WHERE created_at < NOW() - INTERVAL '48 hours';$$);
