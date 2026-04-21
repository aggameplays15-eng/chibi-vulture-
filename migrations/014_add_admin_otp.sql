-- Migration 014: Admin OTP for 2FA
CREATE TABLE IF NOT EXISTS admin_otp (
  id          SERIAL PRIMARY KEY,
  code_hash   TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active OTP at a time (clean old ones on insert via app logic)
CREATE INDEX IF NOT EXISTS idx_admin_otp_expires ON admin_otp (expires_at);
