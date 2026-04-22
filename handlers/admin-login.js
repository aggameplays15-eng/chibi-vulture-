const crypto = require('crypto');
const { handleCors } = require('./_lib/cors');
const { rateLimit } = require('./_lib/rateLimit');
const bcrypt = require('bcryptjs');
const auth = require('./_lib/auth');
const { logAuthFailure } = require('./_lib/security');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD_PLAIN)) {
  console.warn('WARNING: ADMIN credentials not set in environment variables');
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  // Rate limiting strict — 3 tentatives / 15 min
  const limit = await rateLimit(req, 'admin-login');
  Object.entries(limit.headers).forEach(([k, v]) => res.setHeader(k, v));
  if (!limit.allowed) {
    return res.status(429).json({ error: 'Too many attempts.', retryAfter: limit.resetInSeconds });
  }

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  if (!ADMIN_EMAIL || (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD_PLAIN)) {
    return res.status(500).json({ error: 'Admin credentials not configured' });
  }

  // Vérification email en timing-safe (anti timing attack)
  const emailOk = crypto.timingSafeEqual(
    Buffer.from(String(email).toLowerCase().padEnd(100)),
    Buffer.from(String(ADMIN_EMAIL).toLowerCase().padEnd(100))
  );

  // Vérification mot de passe — bcrypt hash en prod, plain en dev
  let passOk = false;
  if (ADMIN_PASSWORD_HASH) {
    passOk = await bcrypt.compare(String(password), ADMIN_PASSWORD_HASH);
  } else if (ADMIN_PASSWORD_PLAIN) {
    passOk = crypto.timingSafeEqual(
      Buffer.from(String(password).padEnd(100)),
      Buffer.from(String(ADMIN_PASSWORD_PLAIN).padEnd(100))
    );
  }

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

  console.log(`[Admin] Connexion réussie depuis ${req.headers['x-forwarded-for'] || req.socket?.remoteAddress}`);

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
