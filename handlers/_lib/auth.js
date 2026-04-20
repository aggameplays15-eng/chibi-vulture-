// Authentication middleware for handlers
// Verifies admin token for protected routes

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

module.exports = {
  verify: (req, requireAdmin = false) => {
    // Check for admin credentials in headers or body
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
    
    // For regular user routes, check for valid token
    if (!authHeader) {
      return false;
    }
    
    const token = authHeader.replace('Bearer ', '');
    // In production, verify JWT token here
    // For now, just check if token exists
    return !!token;
  }
};
