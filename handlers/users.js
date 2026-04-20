const db = require('./_lib/db');
const auth = require('./_lib/auth');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('./_lib/rateLimit');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  
  if (req.method === 'GET') {
    // Only Admin can list all users
    const admin = auth.verify(req, true);
    if (!admin) return res.status(403).json({ error: 'Admin access required' });

    try {
      const { rows } = await db.query('SELECT id, name, handle, email, bio, avatar_color, role, is_approved, status, created_at FROM users ORDER BY created_at DESC');
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else if (req.method === 'PATCH') {
    const requester = auth.verify(req);
    if (!requester) return res.status(401).json({ error: 'Auth required' });

    const { id, ...data } = req.body;

    // Check permissions: Admin can update anyone, Member can only update themselves
    if (requester.role !== 'Admin' && requester.id !== id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Whitelist des champs autorisés pour prévenir l'injection SQL
    const ALLOWED_FIELDS = ['name', 'handle', 'email', 'bio', 'avatar_color', 'avatar_image', 'role', 'is_approved', 'status'];
    const dataKeys = Object.keys(data).filter(key => ALLOWED_FIELDS.includes(key));
    
    if (dataKeys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const fields = dataKeys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = dataKeys.map(key => data[key]);
    
    try {
      const { rows } = await db.query(
        `UPDATE users SET ${fields} WHERE id = $1 RETURNING id, name, handle, email, bio, avatar_color, role`,
        [id, ...values]
      );
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  } else if (req.method === 'POST') {
    // Rate limiting for signup
    const limit = rateLimit(req, 'signup');
    Object.entries(limit.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    if (!limit.allowed) {
      return res.status(429).json({ 
        error: 'Too many signup attempts. Please try again later.',
        retryAfter: limit.resetInSeconds
      });
    }

    // Signup
    const { name, handle, email, bio, avatarColor, password } = req.body;
    
    // Validation
    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 50) {
      return res.status(400).json({ error: 'Invalid name (2-50 chars)' });
    }
    if (!handle || typeof handle !== 'string' || !/^@[a-zA-Z0-9_]{3,20}$/.test(handle)) {
      return res.status(400).json({ error: 'Invalid handle format (@username, 3-20 chars)' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { rows } = await db.query(
        'INSERT INTO users (name, handle, email, bio, avatar_color, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, handle, email, bio, avatar_color, role',
        [name.trim(), handle.toLowerCase(), email.toLowerCase().trim(), bio || '', avatarColor || '#94a3b8', hashedPassword]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Handle or email already exists' });
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  } else {
    res.status(405).end();
  }
}; 
