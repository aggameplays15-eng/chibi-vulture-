const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const auth = {
  // Sign a new token
  signToken: (user) => {
    return jwt.sign(
      { id: user.id, handle: user.handle, role: user.role },
      SECRET,
      { expiresIn: '7d' }
    );
  },

  // Middleware to verify token and optionally check role
  verify: (req, requireAdmin = false) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, SECRET);
      if (requireAdmin && decoded.role !== 'Admin') return null;
      return decoded;
    } catch (err) {
      return null;
    }
  }
};

module.exports = auth;
