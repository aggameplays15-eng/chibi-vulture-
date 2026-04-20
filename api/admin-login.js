const { handleCors } = require('./_lib/cors');
const { rateLimit } = require('./_lib/rateLimit');
const auth = require('./_lib/auth');

const ADMIN_EMAIL    = 'papicamara22@gmail.com';
const ADMIN_PASSWORD = 'fantasangare2203';

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const limit = rateLimit(req, 'admin-login');
  Object.entries(limit.headers).forEach(([k, v]) => res.setHeader(k, v));
  if (!limit.allowed) {
    return res.status(429).json({ error: 'Too many attempts.', retryAfter: limit.resetInSeconds });
  }

  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const adminUser = {
      id: 1, email: ADMIN_EMAIL, name: 'Admin', handle: '@admin',
      role: 'Admin', is_approved: true, isApproved: true,
      status: 'Actif', bio: 'Administrator', avatar_color: '#DC2626'
    };
    const token = auth.signToken(adminUser);
    res.status(200).json({ user: adminUser, token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};
