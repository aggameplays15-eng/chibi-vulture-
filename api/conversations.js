const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const user = auth.verify(req);
  if (!user) return res.status(401).json({ error: 'Auth required' });

  try {
    // Récupère la dernière conversation de chaque interlocuteur
    const { rows } = await db.query(`
      SELECT DISTINCT ON (other_handle)
        other_handle,
        u.name as other_name,
        u.avatar_image as other_avatar,
        last_msg,
        last_time,
        unread_count
      FROM (
        SELECT
          CASE WHEN sender_handle = $1 THEN receiver_handle ELSE sender_handle END as other_handle,
          text as last_msg,
          created_at as last_time,
          SUM(CASE WHEN receiver_handle = $1 AND is_read = false THEN 1 ELSE 0 END) OVER (
            PARTITION BY CASE WHEN sender_handle = $1 THEN receiver_handle ELSE sender_handle END
          ) as unread_count
        FROM messages
        WHERE sender_handle = $1 OR receiver_handle = $1
        ORDER BY created_at DESC
      ) sub
      JOIN users u ON u.handle = sub.other_handle
      ORDER BY other_handle, last_time DESC
    `, [user.handle]);

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};
