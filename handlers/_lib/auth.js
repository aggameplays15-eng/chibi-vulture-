// Authentication middleware for handlers
// Verifies JWT tokens for protected routes

const jwt = require('jsonwebtoken');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

module.exports = {
  verify: (req, requireAdmin = false) => {
    const authHeader = req.headers['authorization'];
    
    if (requireAdmin) {
      // For admin routes, check if email/password match environment variables
      const email = req.headers['x-admin-email'] || req.body?.admin_email;
      const password = req.headers['x-admin-password'] || req.body?.admin_password;
      
      if (!email || !password) {
        return false;
      }
      
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return false;
      }
      
      return true;
    }
    
    // For regular user routes, verify JWT token
    if (!authHeader) {
      return false;
    }
    
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      return false;
    }
  },

  signToken: (user) => {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
};
