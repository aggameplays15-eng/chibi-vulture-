const crypto = require('crypto');
const { handleCors } = require('./_lib/cors');
const { rateLimit } = require('./_lib/rateLimit');
const auth = require('./_lib/auth');
const db = require('./_lib/db');
const { logAuthFailure } = require('./_lib/security');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const limit = await rateLimit(req, 'admin-verify-otp');
  Object.entries(limit.headers).forEach(([k, v]) => res.setHeader(k, v));
  if (!limit.allowed) {
    return res.status(429).json({ error: 'Too many attempts.', retryAfter: limit.resetInSeconds });
  }

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code requis' });
  }

  const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex');

  try {
    // Find a valid, unused OTP
    const { rows } = await db.query(
      `SELECT id FROM admin_otp
       WHERE code_hash = $1 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [codeHash]
    );

    if (rows.length === 0) {
      await logAuthFailure(req);
      return res.status(401).json({ error: 'Code invalide ou expiré' });
    }

    // Mark as used
    await db.query(`UPDATE admin_otp SET used = TRUE WHERE id = $1`, [rows[0].id]);

    // Issue admin JWT
    const adminUser = {
      id: 1, email: ADMIN_EMAIL, name: 'Admin', handle: '@admin',
      role: 'Admin', is_approved: true,
      status: 'Actif', bio: 'Administrator', avatar_color: '#DC2626'
    };
    const token = auth.signToken(adminUser);

    return res.status(200).json({
      user: { ...adminUser, avatarColor: adminUser.avatar_color, isApproved: adminUser.is_approved },
      token
    });
  } catch (error) {
    console.error('Admin OTP verify error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
