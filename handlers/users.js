const db = require('./_lib/db');
const auth = require('./_lib/auth');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('./_lib/rateLimit');
const { handleCors } = require('./_lib/cors');
const { sendEmail } = require('./_lib/email');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const ALLOWED_FIELDS = ['name', 'handle', 'email', 'bio', 'avatar_color', 'avatar_image', 'is_approved', 'status'];
const COLUMN_MAP = {
  name: 'name', handle: 'handle', email: 'email', bio: 'bio',
  avatar_color: 'avatar_color', avatar_image: 'avatar_image',
  is_approved: 'is_approved', status: 'status'
};

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  // GET
  if (req.method === 'GET') {
    if (req.query.handle) {
      const handle = req.query.handle;
      try {
        const { rows } = await db.query(
          'SELECT id, name, handle, bio, avatar_color, avatar_image, role FROM users WHERE handle = $1 AND is_approved = true',
          [handle]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        return res.status(200).json(rows[0]);
      } catch {
        return res.status(500).json({ error: 'Failed to fetch user' });
      }
    }

    const requester = await auth.verify(req);
    const isAdmin = requester && requester.role === 'Admin';

    try {
      let query;
      if (isAdmin) {
        query = "SELECT id, name, handle, email, bio, avatar_color, avatar_image, role, is_approved, status, created_at FROM users WHERE status != $1 OR status IS NULL ORDER BY created_at DESC";
      } else {
        query = "SELECT id, name, handle, bio, avatar_color, avatar_image, role FROM users WHERE is_approved = true AND (status != $1 OR status IS NULL) ORDER BY created_at DESC";
      }
      const { rows } = await db.query(query, ['Supprimé']);
      res.status(200).json(rows);
    } catch {
      res.status(500).json({ error: 'Failed to fetch users' });
    }

  // PATCH — mise à jour utilisateur
  } else if (req.method === 'PATCH') {
    const requester = await auth.verify(req);
    if (!requester) return res.status(401).json({ error: 'Auth required' });

    const { id, ...data } = req.body;

    if (requester.role !== 'Admin' && requester.id !== id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if ('role' in data) {
      return res.status(403).json({ error: 'Role changes are not allowed.' });
    }

    const dataKeys = Object.keys(data).filter(key => ALLOWED_FIELDS.includes(key));
    if (dataKeys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // BUG FIX: $1 = id (WHERE), $2...$N = values
    const values = [id];
    const setClauses = [];
    for (const key of dataKeys) {
      values.push(data[key]);
      setClauses.push(COLUMN_MAP[key] + ' = $' + values.length);
    }

    try {
      const { rows: before } = await db.query('SELECT is_approved FROM users WHERE id = $1', [id]);
      const wasApproved = before[0]?.is_approved ?? false;

      const { rows } = await db.query(
        'UPDATE users SET ' + setClauses.join(', ') + ' WHERE id = $1 RETURNING id, name, handle, email, bio, avatar_color, avatar_image, role, is_approved, status',
        values
      );
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const user = rows[0];

      if (data.is_approved === true && !wasApproved) {
        sendEmail(user.email, 'accountApproved', { name: user.name, handle: user.handle }).catch(() => {});
        if (ADMIN_EMAIL) {
          sendEmail(ADMIN_EMAIL, 'approvalConfirmAdmin', { name: user.name, handle: user.handle, email: user.email }).catch(() => {});
        }
      }

      if (data.status === 'Banni' && ADMIN_EMAIL) {
        sendEmail(ADMIN_EMAIL, 'accountBanned', { name: user.name, handle: user.handle, email: user.email }).catch(() => {});
      }

      res.status(200).json({
        ...user,
        avatarColor: user.avatar_color,
        avatarImage: user.avatar_image,
        isApproved: user.is_approved
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update user' });
    }

  // POST — inscription
  } else if (req.method === 'POST') {
    const { name, handle: rawHandle, email, avatarColor, password } = req.body;
    let { bio } = req.body;
    const handle = rawHandle
      ? (rawHandle.startsWith('@') ? rawHandle : '@' + rawHandle)
      : rawHandle;

    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 50)
      return res.status(400).json({ error: 'Invalid name (2-50 chars)' });
    if (!handle || typeof handle !== 'string' || !/^@[a-zA-Z0-9_]{3,20}$/.test(handle))
      return res.status(400).json({ error: 'Invalid handle format (@username, 3-20 chars)' });
    if (!email || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      return res.status(400).json({ error: 'Invalid email format' });
    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    if (ADMIN_EMAIL && email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'This email is reserved' });
    }

    bio = (bio && typeof bio === 'string') ? bio.slice(0, 300) : '';

    const limit = await rateLimit(req, 'signup');
    Object.entries(limit.headers).forEach(([key, value]) => res.setHeader(key, value));
    if (!limit.allowed) {
      return res.status(429).json({ error: 'Too many signup attempts. Please try again later.', retryAfter: limit.resetInSeconds });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { rows } = await db.query(
        'INSERT INTO users (name, handle, email, bio, avatar_color, password, is_approved) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, handle, email, bio, avatar_color, avatar_image, role, is_approved, status',
        [name.trim(), handle.toLowerCase(), email.toLowerCase().trim(), bio, avatarColor || '#94a3b8', hashedPassword, true]
      );
      const user = rows[0];
      const token = auth.signToken(user);

      sendEmail(user.email, 'welcome', { name: user.name, handle: user.handle }).catch(() => {});
      if (ADMIN_EMAIL) {
        sendEmail(ADMIN_EMAIL, 'newSignupAdmin', { name: user.name, handle: user.handle, email: user.email }).catch(() => {});
      }

      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          handle: user.handle,
          email: user.email,
          bio: user.bio,
          avatarColor: user.avatar_color,
          avatarImage: user.avatar_image,
          role: user.role,
          isApproved: user.is_approved
        }
      });
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Handle or email already exists' });
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }

  // DELETE — suppression soft (admin only)
  } else if (req.method === 'DELETE') {
    const requester = await auth.verify(req);
    if (!requester || requester.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.query;
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid id' });

    try {
      const { rows } = await db.query('SELECT id, email, name, handle FROM users WHERE id = $1', [Number(id)]);
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

      const user = rows[0];

      if (ADMIN_EMAIL && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return res.status(403).json({ error: 'Cannot delete the admin account' });
      }

      await db.query("UPDATE users SET status = 'Supprimé', is_approved = false WHERE id = $1", [Number(id)]);

      if (ADMIN_EMAIL) {
        sendEmail(ADMIN_EMAIL, 'accountDeleted', {
          name: user.name, handle: user.handle, email: user.email
        }).catch(() => {});
      }

      res.status(200).json({ status: 'Deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete user' });
    }

  } else {
    res.status(405).end();
  }
};
