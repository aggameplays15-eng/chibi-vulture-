const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { sendEmail } = require('./_lib/email');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'POST') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { post_id } = req.body;

    // Accept both number and numeric string (JSON body always sends number, but be safe)
    const postIdNum = Number(post_id);
    if (!post_id || isNaN(postIdNum) || postIdNum < 1) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const user_handle = user.handle;
    try {
      const { rows: existing } = await db.query(
        'SELECT * FROM likes WHERE user_handle = $1 AND post_id = $2',
        [user_handle, postIdNum]
      );

      if (existing.length > 0) {
        await db.query(
          'DELETE FROM likes WHERE user_handle = $1 AND post_id = $2',
          [user_handle, postIdNum]
        );
        res.status(200).json({ liked: false });
      } else {
        await db.query(
          'INSERT INTO likes (user_handle, post_id) VALUES ($1, $2)',
          [user_handle, postIdNum]
        );
        // Email au propriétaire du post (fire & forget)
        db.query(
          `SELECT p.user_handle, u.email, u.name FROM posts p
           JOIN users u ON u.handle = p.user_handle
           WHERE p.id = $1 AND p.user_handle != $2`,
          [postIdNum, user_handle]
        ).then(({ rows }) => {
          if (rows.length > 0) {
            sendEmail(rows[0].email, 'newLike', {
              recipientName: rows[0].name,
              likerName: user.name || user_handle,
              likerHandle: user_handle,
              postId: postIdNum,
            }).catch(() => {});
          }
        }).catch(() => {});
        res.status(201).json({ liked: true });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to toggle like' });
    }

  } else if (req.method === 'GET') {
    const { user_handle } = req.query;
    if (!user_handle || typeof user_handle !== 'string' || user_handle.length > 50) {
      return res.status(400).json({ error: 'Invalid user handle' });
    }
    try {
      const { rows } = await db.query('SELECT post_id FROM likes WHERE user_handle = $1', [user_handle]);
      res.status(200).json(rows.map(r => r.post_id));
    } catch (error) {
      res.status(500).json({ error: 'Failed to get likes' });
    }

  } else {
    res.status(405).end();
  }
};
