-- Migration 016: User OTP for 2FA login
CREATE TABLE IF NOT EXISTS user_otp (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_otp_user_id  ON user_otp (user_id);
CREATE INDEX IF NOT EXISTS idx_user_otp_expires  ON user_otp (expires_at);
