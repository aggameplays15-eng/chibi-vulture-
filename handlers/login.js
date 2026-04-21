const crypto = require('crypto');
const db = require('./_lib/db');
const auth = require('./_lib/auth');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('./_lib/rateLimit');
const { handleCors } = require('./_lib/cors');
const { logAuthFailure } = require('./_lib/security');
const { sendEmail } = require('./_lib/email');

// Generate a 6-digit OTP, store its hash, return the plain code
async function issueUserOtp(userId) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any previous unused OTPs for this user
  await db.query(
    `UPDATE user_otp SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
    [userId]
  );

  await db.query(
    `INSERT INTO user_otp (user_id, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, codeHash, expiresAt]
  );

  return code;
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') return res.status(405).end();

  // Rate limiting
  const limit = await rateLimit(req, 'login');
  Object.entries(limit.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  if (!limit.allowed) {
    return res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
      retryAfter: limit.resetInSeconds
    });
  }

  const { email, password } = req.body || {};

  // Validation des entrées
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      await logAuthFailure(req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password || '');

    if (!isMatch) {
      await logAuthFailure(req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Credentials OK — issue OTP
    const code = await issueUserOtp(user.id);

    // Respond immediately, send email async
    res.status(200).json({ otpRequired: true });

    sendEmail(user.email, 'userOtp', { name: user.name, code }).then(sent => {
      if (!sent) {
        console.warn(`[Login OTP] Email non envoyé à ${user.email} — code: ${code}`);
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
