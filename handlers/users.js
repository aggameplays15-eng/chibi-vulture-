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

  // GET — liste des utilisateurs (admin only) ou profil public par handle
  if (req.method === 'GET') {
    // Profil public par handle : /api/users?handle=@xxx
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
        // Admin sees everyone (except deleted)
        query = 'SELECT id, name, handle, email, bio, avatar_color, avatar_image, role, is_approved, status, created_at FROM users WHERE status != $1 OR status IS NULL ORDER BY created_at DESC';
      } else {
        // Public sees only approved artists
        query = 'SELECT id, name, handle, bio, avatar_color, avatar_image, role FROM users WHERE is_approved = true AND (status != $1 OR status IS NULL) ORDER BY created_at DESC';
      }
      
      const { rows } = await db.query(query, ['Supprimé']);
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

    // Bloquer tout changement de rôle — l'architecture est à admin unique (.env)
    if ('role' in data) {
      return res.status(403).json({ error: 'Role changes are not allowed. There is only one unique Administrator.' });
    }

    // Whitelist des champs modifiables
    const ALLOWED_FIELDS = ['name', 'handle', 'email', 'bio', 'avatar_color', 'avatar_image', 'is_approved', 'status'];
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
        // Confirmation à l'admin
        if (ADMIN_EMAIL) {
          sendEmail(ADMIN_EMAIL, 'approvalConfirmAdmin', { name: user.name, handle: user.handle, email: user.email }).catch(() => {});
        }
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
    const { name, handle: rawHandle, email, avatarColor, password } = req.body;
    let { bio } = req.body;
    // Normaliser le handle — accepter avec ou sans @
    const handle = rawHandle
      ? (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`)
      : rawHandle;

    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 50)
      return res.status(400).json({ error: 'Invalid name (2-50 chars)' });
    if (!handle || typeof handle !== 'string' || !/^@[a-zA-Z0-9_]{3,20}$/.test(handle))
      return res.status(400).json({ error: 'Invalid handle format (@username, 3-20 chars)' });
    if (!email || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      return res.status(400).json({ error: 'Invalid email format' });
    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Bloquer l'inscription avec l'email admin
    if (ADMIN_EMAIL && email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'This email is reserved' });
    }

    if (!bio || typeof bio !== 'string' || bio.length > 300)
      bio = (bio || '').toString().slice(0, 300);

    const limit = await rateLimit(req, 'signup');
    Object.entries(limit.headers).forEach(([key, value]) => res.setHeader(key, value));
    if (!limit.allowed) {
      return res.status(429).json({ error: 'Too many signup attempts. Please try again later.', retryAfter: limit.resetInSeconds });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { rows } = await db.query(
        'INSERT INTO users (name, handle, email, bio, avatar_color, password, is_approved) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, handle, email, bio, avatar_color, avatar_image, role, is_approved, status',
        [name.trim(), handle.toLowerCase(), email.toLowerCase().trim(), bio || '', avatarColor || '#94a3b8', hashedPassword, true]
      );
      const user = rows[0];

      // Générer le token pour connexion automatique immédiate
      const token = auth.signToken(user);

      // Email de bienvenue au nouveau membre (fire & forget)
      sendEmail(user.email, 'welcome', { name: user.name, handle: user.handle }).catch(() => {});
      
      // Alerte à l'admin (fire & forget)
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

  // DELETE — suppression soft (admin only, ne peut pas supprimer l'admin .env)
  } else if (req.method === 'DELETE') {
    const requester = await auth.verify(req);
    if (!requester || requester.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.query;
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid id' });

    try {
      const { rows } = await db.query('SELECT id, email, name, handle FROM users WHERE id = $1', [Number(id)]);
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

      const user = rows[0];

      // Bloquer la suppression de l'admin .env
      if (ADMIN_EMAIL && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return res.status(403).json({ error: 'Cannot delete the admin account' });
      }

      // Suppression soft : marquer comme supprimé au lieu de supprimer définitivement
      await db.query(
        `UPDATE users SET status = 'Supprimé', is_approved = false WHERE id = $1`,
        [Number(id)]
      );

      // Email à l'admin pour confirmation
      if (ADMIN_EMAIL) {
        sendEmail(ADMIN_EMAIL, 'accountDeleted', { 
          name: user.name, 
          handle: user.handle, 
          email: user.email 
        }).catch(() => {});
      }

      console.log(`[Admin] Compte supprimé (soft): ${user.handle} (${user.email})`);
      res.status(200).json({ status: 'Deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete user' });
    }

  } else {
    res.status(405).end();
  }
};
