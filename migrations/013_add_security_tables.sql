-- ============================================================
-- Migration 013 — Tables de sécurité
-- security_log : journal des menaces détectées
-- ip_bans      : IPs bannies temporairement
-- ============================================================

-- Journal des menaces
CREATE TABLE IF NOT EXISTS security_log (
  id          BIGSERIAL PRIMARY KEY,
  ip          VARCHAR(64)  NOT NULL,
  threat_type VARCHAR(50)  NOT NULL,
  detail      TEXT,
  path        TEXT,
  method      VARCHAR(10),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_log_ip         ON security_log (ip);
CREATE INDEX IF NOT EXISTS idx_security_log_type       ON security_log (threat_type);
CREATE INDEX IF NOT EXISTS idx_security_log_created_at ON security_log (created_at);
CREATE INDEX IF NOT EXISTS idx_security_log_ip_type    ON security_log (ip, threat_type, created_at);

-- IPs bannies
CREATE TABLE IF NOT EXISTS ip_bans (
  ip         VARCHAR(64)  PRIMARY KEY,
  reason     TEXT,
  expires_at TIMESTAMPTZ  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_bans_expires ON ip_bans (expires_at);

-- Nettoyage automatique des entrées expirées (optionnel, à lancer via cron)
-- DELETE FROM security_log WHERE created_at < NOW() - INTERVAL '7 days';
-- DELETE FROM ip_bans WHERE expires_at < NOW();
