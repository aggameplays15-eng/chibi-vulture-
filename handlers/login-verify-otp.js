const crypto = require('crypto');
const { handleCors } = require('./_lib/cors');
const { rateLimit } = require('./_lib/rateLimit');
const auth = require('./_lib/auth');
const db = require('./_lib/db');
const { logAuthFailure } = require('./_lib/security');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const limit = await rateLimit(req, 'login-verify-otp');
  Object.entries(limit.headers).forEach(([k, v]) => res.setHeader(k, v));
  if (!limit.allowed) {
    return res.status(429).json({ error: 'Too many attempts.', retryAfter: limit.resetInSeconds });
  }

  const { email, code } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email requis' });
  }
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code requis' });
  }

  const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex');

  try {
    // Find user
    const { rows: userRows } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (userRows.length === 0) {
      await logAuthFailure(req);
      return res.status(401).json({ error: 'Code invalide ou expiré' });
    }
    const user = userRows[0];

    // Find valid OTP
    const { rows } = await db.query(
      `SELECT id FROM user_otp
       WHERE user_id = $1 AND code_hash = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, codeHash]
    );

    if (rows.length === 0) {
      await logAuthFailure(req);
      return res.status(401).json({ error: 'Code invalide ou expiré' });
    }

    // Mark OTP as used
    await db.query(`UPDATE user_otp SET used = TRUE WHERE id = $1`, [rows[0].id]);

    // Issue JWT
    const token = auth.signToken(user);

    const { password: _, ...safeUser } = user;
    const mappedUser = {
      ...safeUser,
      avatarColor: safeUser.avatar_color,
      avatarImage: safeUser.avatar_image,
      isApproved: safeUser.is_approved,
    };

    return res.status(200).json({ user: mappedUser, token });
  } catch (error) {
    console.error('Login verify OTP error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
