const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./_lib/db');
const { handleCors } = require('./_lib/cors');
const { rateLimit } = require('./_lib/rateLimit');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const limit = await rateLimit(req, 'reset');
  Object.entries(limit.headers).forEach(([k, v]) => res.setHeader(k, v));
  if (!limit.allowed) return res.status(429).json({ error: 'Too many requests' });

  const { token, password } = req.body || {};
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Token required' });
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await db.query(
      `SELECT prt.user_id, prt.expires_at, u.email, u.name
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
      [tokenHash]
    );

    if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

    const { user_id } = rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user_id]);
    await db.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1', [user_id]);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
