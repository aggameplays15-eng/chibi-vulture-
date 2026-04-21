const db = require('./_lib/db');
const auth = require('./_lib/auth');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('./_lib/rateLimit');
const { handleCors } = require('./_lib/cors');
const { sendEmail } = require('./_lib/email');

// L'email admin est défini uniquement via .env — aucun utilisateur DB ne peut avoir ce rôle
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  // GET — liste des utilisateurs (admin only)
  if (req.method === 'GET') {
    const admin = await auth.verify(req);
    if (!admin || admin.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });

    try {
      const { rows } = await db.query(
        'SELECT id, name, handle, email, bio, avatar_color, role, is_approved, status, created_at FROM users ORDER BY created_at DESC'
      );
      res.status(200).json(rows);
    } catch {
      res.status(500).json({ error: 'Failed to fetch users' });
    }

  // PATCH — mise à jour d'un utilisateur
  } else if (req.method === 'PATCH') {
    const requester = await auth.verify(req);
    if (!requester) return res.status(401).json({ error: 'Auth required' });

    const { id, ...data } = req.body;

    // Un membre ne peut modifier que son propre profil
    if (requester.role !== 'Admin' && requester.id !== id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Bloquer tout changement de rôle sauf si c'est un admin qui change le rôle d'un autre user
    if ('role' in data) {
      if (requester.role !== 'Admin') {
        return res.status(403).json({ error: 'Role changes are not allowed' });
      }
      // L'admin ne peut assigner que Member — jamais Admin
      const ALLOWED_ROLES = ['Member'];
      if (!ALLOWED_ROLES.includes(data.role)) {
        return res.status(403).json({ error: 'Invalid role' });
      }
    }

    // Whitelist — role autorisé uniquement pour les admins (déjà validé ci-dessus)
    const ALLOWED_FIELDS = ['name', 'handle', 'email', 'bio', 'avatar_color', 'avatar_image', 'is_approved', 'status', ...(requester.role === 'Admin' ? ['role'] : [])];
    const dataKeys = Object.keys(data).filter(key => ALLOWED_FIELDS.includes(key));

    if (dataKeys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const fields = dataKeys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = dataKeys.map(key => data[key]);

    // Sécurité : valider que chaque clé correspond exactement à une colonne autorisée
    const COLUMN_MAP = {
      name: 'name', handle: 'handle', email: 'email', bio: 'bio',
      avatar_color: 'avatar_color', avatar_image: 'avatar_image',
      is_approved: 'is_approved', status: 'status', role: 'role'
    };
    const safeFields = dataKeys.map((key, i) => `${COLUMN_MAP[key]} = $${i + 2}`).join(', ');

    try {
      // Récupérer l'état AVANT la mise à jour pour détecter le changement d'approbation
      const { rows: before } = await db.query('SELECT is_approved FROM users WHERE id = $1', [id]);
      const wasApproved = before[0]?.is_approved ?? false;

      const { rows } = await db.query(
        `UPDATE users SET ${safeFields} WHERE id = $1 RETURNING id, name, handle, email, bio, avatar_color, avatar_image, role, is_approved, status`,
        [id, ...values]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const user = rows[0];

      // Email au membre si son compte vient d'être approuvé (false → true)
      if (data.is_approved === true && !wasApproved) {
        sendEmail(user.email, 'accountApproved', { name: user.name, handle: user.handle }).catch(() => {});
      }

      // Email à l'admin si le compte vient d'être banni
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
    const limit = await rateLimit(req, 'signup');
    Object.entries(limit.headers).forEach(([key, value]) => res.setHeader(key, value));
    if (!limit.allowed) {
      return res.status(429).json({ error: 'Too many signup attempts. Please try again later.', retryAfter: limit.resetInSeconds });
    }

    const { name, handle, email, bio, avatarColor, password } = req.body;

    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 50)
      return res.status(400).json({ error: 'Invalid name (2-50 chars)' });
    if (!handle || typeof handle !== 'string' || !/^@[a-zA-Z0-9_]{3,20}$/.test(handle))
      return res.status(400).json({ error: 'Invalid handle format (@username, 3-20 chars)' });
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email format' });
    if (!password || typeof password !== 'string' || password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Bloquer l'inscription avec l'email admin
    if (ADMIN_EMAIL && email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'This email is reserved' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { rows } = await db.query(
        'INSERT INTO users (name, handle, email, bio, avatar_color, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, handle, email, bio, avatar_color, avatar_image, role, is_approved, status',
        [name.trim(), handle.toLowerCase(), email.toLowerCase().trim(), bio || '', avatarColor || '#94a3b8', hashedPassword]
      );
      const user = rows[0];
      // Email de bienvenue au nouveau membre (fire & forget)
      sendEmail(user.email, 'welcome', { name: user.name, handle: user.handle }).catch(() => {});
      // Alerte à l'admin — nouveau membre en attente d'approbation
      if (ADMIN_EMAIL) {
        sendEmail(ADMIN_EMAIL, 'newSignupAdmin', { name: user.name, handle: user.handle, email: user.email }).catch(() => {});
      }
      res.status(201).json({
        ...user,
        avatarColor: user.avatar_color,
        avatarImage: user.avatar_image,
        isApproved: user.is_approved
      });
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Handle or email already exists' });
      res.status(500).json({ error: 'Failed to create user' });
    }

  // DELETE — suppression (admin only, ne peut pas supprimer l'admin .env)
  } else if (req.method === 'DELETE') {
    const requester = await auth.verify(req);
    if (!requester || requester.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.query;
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid id' });

    try {
      const { rows } = await db.query('SELECT id, email FROM users WHERE id = $1', [Number(id)]);
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

      // Bloquer la suppression de l'admin .env
      if (ADMIN_EMAIL && rows[0].email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return res.status(403).json({ error: 'Cannot delete the admin account' });
      }

      await db.query('DELETE FROM users WHERE id = $1', [Number(id)]);
      res.status(200).json({ status: 'Deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete user' });
    }

  } else {
    res.status(405).end();
  }
};
