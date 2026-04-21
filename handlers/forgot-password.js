const crypto = require('crypto');
const db = require('./_lib/db');
const { handleCors } = require('./_lib/cors');
const { rateLimit } = require('./_lib/rateLimit');
const { sendEmail } = require('./_lib/email');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://chibivulture.com';

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const limit = await rateLimit(req, 'forgot');
  Object.entries(limit.headers).forEach(([k, v]) => res.setHeader(k, v));
  if (!limit.allowed) return res.status(429).json({ error: 'Too many requests' });

  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    const { rows } = await db.query('SELECT id, name, email FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    // Always respond 200 to avoid email enumeration
    if (rows.length === 0) return res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = $3, used = FALSE`,
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
    sendEmail(user.email, 'passwordReset', { name: user.name, resetUrl }).catch(() => {});

    res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
