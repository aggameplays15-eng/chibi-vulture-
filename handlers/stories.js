const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  // Initialisation de la table si elle n'existe pas
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        user_handle TEXT NOT NULL,
        image TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error("Failed to ensure stories table:", e);
  }

  if (req.method === 'POST') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Image required' });

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
