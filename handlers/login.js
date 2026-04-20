const db = require('./_lib/db');
const auth = require('./_lib/auth');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('./_lib/rateLimit');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'POST') return res.status(405).end();

  // Rate limiting
  const limit = rateLimit(req, 'login');
  Object.entries(limit.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  if (!limit.allowed) {
    return res.status(429).json({ 
      error: 'Too many login attempts. Please try again later.',
      retryAfter: limit.resetInSeconds
    });
  }

  const { email, password } = req.body;

  // Validation des entrées
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password || '');
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign JWT token
    const token = auth.signToken(user);

    // Filter sensitive data and map snake_case to camelCase
    const { password: _, ...safeUser } = user;
    const mappedUser = {
      ...safeUser,
      avatarColor: safeUser.avatar_color,
      avatarImage: safeUser.avatar_image,
      isApproved: safeUser.is_approved
    };

    res.status(200).json({
      user: mappedUser,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};
