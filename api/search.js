const db = require('./_lib/db');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const { q } = req.query;
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  const term = `%${q.trim().toLowerCase()}%`;

  try {
    const [{ rows: users }, { rows: posts }] = await Promise.all([
      db.query(`
        SELECT id, name, handle, avatar_image, bio, role
        FROM users
        WHERE (LOWER(name) LIKE $1 OR LOWER(handle) LIKE $1)
          AND is_approved = true AND status != 'Banni'
        LIMIT 10
      `, [term]),
      db.query(`
        SELECT p.id, p.image, p.caption, p.user_handle, u.name as user_name, u.avatar_image as user_avatar
        FROM posts p
        JOIN users u ON p.user_handle = u.handle
        WHERE LOWER(p.caption) LIKE $1
        ORDER BY p.created_at DESC
        LIMIT 20
      `, [term]),
    ]);

    res.status(200).json({ users, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
};
