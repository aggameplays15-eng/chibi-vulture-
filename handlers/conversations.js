const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const user = await auth.verify(req);
  if (!user) return res.status(401).json({ error: 'Auth required' });

  try {
    // Dernière conversation par interlocuteur, sans is_read (colonne inexistante)
    const { rows } = await db.query(`
      SELECT
        other_handle,
        u.name  AS other_name,
        u.avatar_image AS other_avatar,
        last_msg,
        last_time
      FROM (
        SELECT DISTINCT ON (other_handle)
          CASE WHEN sender_handle = $1 THEN receiver_handle ELSE sender_handle END AS other_handle,
          text    AS last_msg,
          created_at AS last_time
        FROM messages
        WHERE sender_handle = $1 OR receiver_handle = $1
        ORDER BY other_handle, created_at DESC
      ) sub
      JOIN users u ON u.handle = sub.other_handle
      ORDER BY last_time DESC
    `, [user.handle]);

    // Ajouter unread_count à 0 (pas de colonne is_read pour l'instant)
    res.status(200).json(rows.map(r => ({ ...r, unread_count: 0 })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};
