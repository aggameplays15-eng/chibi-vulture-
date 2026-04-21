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
    
    // Validation des entrées — limite 5MB en base64 (~6.7M chars) ou URL normale
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image required' });
    }
    // Bloquer SVG — vecteur XSS (JS embarqué dans SVG)
    if (image.startsWith('data:image/svg')) {
      return res.status(400).json({ error: 'SVG images are not allowed' });
    }
    const isBase64 = image.startsWith('data:image/');
    const maxSize = isBase64 ? 7 * 1024 * 1024 : 2000; // 5MB base64 ou URL 2000 chars
    if (image.length > maxSize) {
      return res.status(400).json({ error: 'Image too large (max 5MB)' });
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
    const user = auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { id } = req.query;
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid id' });

    try {
      const { rows } = await db.query('SELECT user_handle FROM posts WHERE id = $1', [Number(id)]);
      if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });

      // L'auteur ou un admin peut supprimer
      if (rows[0].user_handle !== user.handle && user.role !== 'Admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await db.query('DELETE FROM posts WHERE id = $1', [Number(id)]);
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
