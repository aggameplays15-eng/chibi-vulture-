const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { sendEmail } = require('./_lib/email');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    // Auth requise pour lire les commentaires
    const viewer = await auth.verify(req);
    if (!viewer) return res.status(401).json({ error: 'Auth required' });

    const { post_id } = req.query;
    if (!post_id || isNaN(Number(post_id))) {
      return res.status(400).json({ error: 'Invalid post_id' });
    }
    try {
      // Fetch top-level comments
      const { rows: topComments } = await db.query(
        `SELECT c.*, u.name as user_name, u.avatar_image as user_avatar
         FROM comments c
         LEFT JOIN users u ON c.user_handle = u.handle
         WHERE c.post_id = $1 AND (c.parent_id IS NULL)
         ORDER BY c.created_at ASC`,
        [Number(post_id)]
      );
      // Fetch replies
      const { rows: replies } = await db.query(
        `SELECT c.*, u.name as user_name, u.avatar_image as user_avatar
         FROM comments c
         LEFT JOIN users u ON c.user_handle = u.handle
         WHERE c.post_id = $1 AND c.parent_id IS NOT NULL
         ORDER BY c.created_at ASC`,
        [Number(post_id)]
      );
      // Nest replies under their parent
      const result = topComments.map(c => ({
        ...c,
        replies: replies.filter(r => r.parent_id === c.id)
      }));
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }

  } else if (req.method === 'POST') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { post_id, text, parent_id } = req.body;

    if (!post_id || typeof post_id !== 'number') {
      return res.status(400).json({ error: 'Invalid post_id' });
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 500) {
      return res.status(400).json({ error: 'Invalid comment text (1-500 chars)' });
    }

    try {
      const { rows } = await db.query(
        'INSERT INTO comments (post_id, user_handle, text, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [post_id, user.handle, text.trim(), parent_id || null]
      );
      // Email au propriétaire du post (fire & forget)
      db.query(
        `SELECT p.user_handle, u.email, u.name FROM posts p
         JOIN users u ON u.handle = p.user_handle
         WHERE p.id = $1 AND p.user_handle != $2`,
        [post_id, user.handle]
      ).then(({ rows: postRows }) => {
        if (postRows.length > 0) {
          sendEmail(postRows[0].email, 'newComment', {
            recipientName: postRows[0].name,
            commenterName: user.name || user.handle,
            commenterHandle: user.handle,
            postId: post_id,
            commentText: text.trim(),
          }).catch(() => {});
        }
      }).catch(() => {});
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create comment' });
    }

  } else if (req.method === 'DELETE') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { id } = req.query;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid comment id' });
    }

    try {
      // Only the comment author or an admin can delete
      const { rows } = await db.query('SELECT user_handle FROM comments WHERE id = $1', [Number(id)]);
      if (rows.length === 0) return res.status(404).json({ error: 'Comment not found' });
      if (rows[0].user_handle !== user.handle && user.role !== 'Admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      await db.query('DELETE FROM comments WHERE id = $1', [Number(id)]);
      res.status(200).json({ status: 'Deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }

  } else {
    res.status(405).end();
  }
};
