// Authentication middleware — JWT verification
const jwt = require('jsonwebtoken');
const db = require('./db');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET is not set or too short (min 32 chars). Server will not start securely.');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

module.exports = {
  // Async — vérifie la signature ET la révocation DB
  verify: async (req) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, SECRET);
      // Vérifier si le token a été révoqué (logout)
      const hash = require('crypto').createHash('sha256').update(token).digest('hex');
      const { rows } = await db.query(
        `SELECT 1 FROM revoked_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
        [hash]
      );
      if (rows.length > 0) return false; // token révoqué
      return decoded;
    } catch {
      return false;
    }
  },

  signToken: (user) => {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, handle: user.handle },
      SECRET,
      { expiresIn: '24h' }
    );
  },

  // Révocation DB-backed — fonctionne sur toutes les instances serverless
  revokeToken: async (req) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return;
    const token = authHeader.slice(7);
    try {
      // Décoder sans vérifier pour récupérer l'expiry
      const decoded = jwt.decode(token);
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 86400000);
      await db.query(
        `INSERT INTO revoked_tokens (token_hash, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [require('crypto').createHash('sha256').update(token).digest('hex'), expiresAt]
      );
    } catch {
      // Fail silently — logout still clears client-side token
    }
  },

  // Vérifie si un token est révoqué (appelé dans verify si besoin)
  isRevoked: async (token) => {
    try {
      const hash = require('crypto').createHash('sha256').update(token).digest('hex');
      const { rows } = await db.query(
        `SELECT 1 FROM revoked_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
        [hash]
      );
      return rows.length > 0;
    } catch {
      return false;
    }
  }
};
