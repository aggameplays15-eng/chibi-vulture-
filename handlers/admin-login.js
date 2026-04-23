const crypto = require('crypto');
const { handleCors } = require('./_lib/cors');
const { rateLimit } = require('./_lib/rateLimit');
const bcrypt = require('bcryptjs');
const auth = require('./_lib/auth');
const { logAuthFailure } = require('./_lib/security');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
  console.warn('WARNING: ADMIN_EMAIL or ADMIN_PASSWORD_HASH not set');
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  // Rate limiting strict
  const limit = await rateLimit(req, 'admin-login');
  Object.entries(limit.headers).forEach(([k, v]) => res.setHeader(k, v));
  if (!limit.allowed) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.', retryAfter: limit.resetInSeconds });
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
    return res.status(500).json({ error: 'Admin credentials not configured' });
  }

  // Vérification email en timing-safe (anti timing attack)
  const emailOk = crypto.timingSafeEqual(
    Buffer.from(String(email || '').toLowerCase().trim().padEnd(100)),
    Buffer.from(String(ADMIN_EMAIL || '').toLowerCase().trim().padEnd(100))
  );

  // Vérification mot de passe — bcrypt hash uniquement
  const passOk = await bcrypt.compare(String(password), ADMIN_PASSWORD_HASH);

  if (!emailOk || !passOk) {
    await logAuthFailure(req);
    return res.status(401).json({ error: 'Access denied' });
  }

  // Connexion directe — JWT signé avec expiration courte (8h)
  const adminUser = {
    id: 0,
    email: ADMIN_EMAIL,
    name: 'Admin',
    handle: '@admin',
    role: 'Admin',
    is_approved: true,
    status: 'Actif',
    bio: 'Administrator',
    avatar_color: '#DC2626'
  };

  const token = auth.signToken(adminUser);

  return res.status(200).json({
    token,
    role: 'Admin',
    user: {
      ...adminUser,
      avatarColor: adminUser.avatar_color,
      isApproved: adminUser.is_approved
    }
  });
};
