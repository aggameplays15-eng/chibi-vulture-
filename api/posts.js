const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;
  if (req.method === 'POST') {
    // Authenticated user only
    const user = auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { image, caption } = req.body;
    
    // Validation des entrées
    if (!image || typeof image !== 'string' || image.length > 1000) {
      return res.status(400).json({ error: 'Invalid image URL' });
    }
    if (!caption || typeof caption !== 'string' || caption.length > 500) {
      return res.status(400).json({ error: 'Invalid caption' });
    }
    
    try {
      const { rows } = await db.query(
        'INSERT INTO posts (user_handle, image, caption) VALUES ($1, $2, $3) RETURNING *',
        [user.handle, image, caption]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  } else if (req.method === 'DELETE') {
    // Admin only
    if (!auth.verify(req, true)) return res.status(403).json({ error: 'Admin only' });

    const { id } = req.query;
    try {
      await db.query('DELETE FROM posts WHERE id = $1', [id]);
      res.status(200).json({ status: 'Deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  } else if (req.method === 'GET') {
    try {
      const { handle } = req.query;
      let query, params;

      if (handle) {
        // Filter by user handle — used for profile post count
        if (typeof handle !== 'string' || handle.length > 50) {
          return res.status(400).json({ error: 'Invalid handle' });
        }
        query = `
          SELECT p.*, u.name as user_name, u.avatar_image as user_avatar 
          FROM posts p 
          LEFT JOIN users u ON p.user_handle = u.handle 
          WHERE p.user_handle = $1
          ORDER BY p.created_at DESC
        `;
        params = [handle];
      } else {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;
        query = `
          SELECT p.*, u.name as user_name, u.avatar_image as user_avatar 
          FROM posts p 
          LEFT JOIN users u ON p.user_handle = u.handle 
          ORDER BY p.created_at DESC
          LIMIT $1 OFFSET $2
        `;
        params = [limit, offset];
      }

      const { rows } = await db.query(query, params);
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).end();
  }
};
