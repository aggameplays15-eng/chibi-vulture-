// Authentication middleware — JWT verification
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set — using insecure fallback (dev only)');
}
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-min-32-chars!!';

// Token blacklist (in-memory — survives process lifetime)
// In production with multiple instances, use Redis
const tokenBlacklist = new Set();

// Cleanup expired tokens every hour
setInterval(() => {
  // We can't easily check expiry without decoding, so we just clear periodically
  // Tokens expire in 24h anyway, so clearing every hour is safe
  if (tokenBlacklist.size > 10000) tokenBlacklist.clear();
}, 60 * 60 * 1000);

module.exports = {
  verify: (req) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.slice(7);

    // Check blacklist
    if (tokenBlacklist.has(token)) return false;

    try {
      const decoded = jwt.verify(token, SECRET);
      return decoded;
    } catch {
      return false;
    }
  },

  signToken: (user) => {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, handle: user.handle },
      SECRET,
      { expiresIn: '24h' }  // Réduit de 7j à 24h
    );
  },

  revokeToken: (req) => {
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      tokenBlacklist.add(authHeader.slice(7));
    }
  }
};
