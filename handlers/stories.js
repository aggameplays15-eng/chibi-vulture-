const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { rateLimit } = require('./_lib/rateLimit');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'POST') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    // Rate limiting
    const limit = await rateLimit(req, 'default');
    Object.entries(limit.headers).forEach(([k, v]) => res.setHeader(k, v));
    if (!limit.allowed) return res.status(429).json({ error: 'Too many requests' });

    const { image } = req.body;

    // Validation robuste de l'image
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image required' });
    }
    // Bloquer SVG — vecteur XSS (JS embarqué dans SVG)
    if (image.startsWith('data:image/svg')) {
      return res.status(400).json({ error: 'SVG images are not allowed' });
    }
    // Vérifier la taille (max ~5MB en base64)
    const isBase64 = image.startsWith('data:image/');
    const maxSize = isBase64 ? 7 * 1024 * 1024 : 2000;
    if (image.length > maxSize) {
      return res.status(400).json({ error: 'Image too large (max 5MB)' });
    }

    try {
      // Vérifier la limite de 5 stories actives
      const { rows: countRows } = await db.query(
        "SELECT COUNT(*) FROM stories WHERE user_handle = $1 AND created_at > NOW() - INTERVAL '12 hours'",
        [user.handle]
      );
      if (parseInt(countRows[0].count) >= 5) {
        return res.status(400).json({ error: 'Limite de 5 stories atteinte (expirent après 12h)' });
      }

      const { rows } = await db.query(
        'INSERT INTO stories (user_handle, image) VALUES ($1, $2) RETURNING *',
        [user.handle, image]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add story' });
    }

  } else if (req.method === 'GET') {
    try {
      // Récupérer les stories des dernières 24 heures
      const { rows } = await db.query(`
        SELECT s.*, u.name as user_name, u.avatar_image as user_avatar 
        FROM stories s
        JOIN users u ON s.user_handle = u.handle
        WHERE s.created_at > NOW() - INTERVAL '12 hours'
        ORDER BY s.created_at DESC
      `);
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch stories' });
    }
  } else {
    res.status(405).end();
  }
};
