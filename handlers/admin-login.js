const crypto = require('crypto');
const { handleCors } = require('./_lib/cors');
const { rateLimit } = require('./_lib/rateLimit');
const auth = require('./_lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.warn('WARNING: ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables');
}

// Timing-safe string comparison to prevent timing attacks
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const limit = await rateLimit(req, 'admin-login');
  Object.entries(limit.headers).forEach(([k, v]) => res.setHeader(k, v));
  if (!limit.allowed) {
    return res.status(429).json({ error: 'Too many attempts.', retryAfter: limit.resetInSeconds });
  }

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Admin credentials not configured' });
  }

  // Timing-safe comparison — prevents brute-force timing attacks
  const emailOk = safeEqual(String(email), ADMIN_EMAIL);
  const passOk  = safeEqual(String(password), ADMIN_PASSWORD);

  if (!emailOk || !passOk) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const adminUser = {
      id: 1, email: ADMIN_EMAIL, name: 'Admin', handle: '@admin',
      role: 'Admin', is_approved: true,
      status: 'Actif', bio: 'Administrator', avatar_color: '#DC2626'
    };
    const token = auth.signToken(adminUser);
    res.status(200).json({
      user: { ...adminUser, avatarColor: adminUser.avatar_color, isApproved: adminUser.is_approved },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};
