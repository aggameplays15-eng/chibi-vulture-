const db = require('./_lib/db');
const auth = require('./_lib/auth');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('./_lib/rateLimit');
const { handleCors } = require('./_lib/cors');
const { logAuthFailure } = require('./_lib/security');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') return res.status(405).end();
  
  let { email, password } = req.body || {};
  if (email) email = String(email).toLowerCase().trim();




  if (!email || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

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

  try {
    // 1. Vérification si c'est l'Admin Principal (.env)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

    if (ADMIN_EMAIL && email === ADMIN_EMAIL.toLowerCase().trim()) {
      const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      if (isMatch) {
        const adminUser = {
          id: 0,
          email: ADMIN_EMAIL,
          name: 'Admin',
          handle: '@admin',
          role: 'Admin',
          isApproved: true,
          status: 'Actif',
          bio: 'Administrator',
          avatarColor: '#DC2626'
        };
        const token = auth.signToken(adminUser);
        return res.status(200).json({
          token,
          user: { ...adminUser, avatar_color: adminUser.avatarColor }
        });
      }
    }

    // 2. Sinon, recherche dans la base de données (Membres)
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      await logAuthFailure(req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Compte supprimé
    if (user.status === 'Supprimé') {
      return res.status(403).json({ error: 'This account has been deleted. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      await logAuthFailure(req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compte non approuvé
    if (!user.is_approved) {
      return res.status(403).json({ error: 'Account pending approval. Please contact an administrator.' });
    }

    // Connexion directe
    const token = auth.signToken(user);
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        handle: user.handle,
        role: user.role,
        avatarColor: user.avatar_color,
        avatarImage: user.avatar_image,
        bio: user.bio,
        isApproved: user.is_approved
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
