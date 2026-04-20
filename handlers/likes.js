const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { notifyLike } = require('./_lib/notifications');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'POST') {
    const user = auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { post_id } = req.body;
    
    // Validation
    if (!post_id || typeof post_id !== 'number') {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const user_handle = user.handle;
    try {
      // Toggle logic
      const { rows: existing } = await db.query(
        'SELECT * FROM likes WHERE user_handle = $1 AND post_id = $2',
        [user_handle, post_id]
      );

      if (existing.length > 0) {
        await db.query(
          'DELETE FROM likes WHERE user_handle = $1 AND post_id = $2',
          [user_handle, post_id]
        );
        res.status(200).json({ liked: false });
      } else {
        await db.query(
          'INSERT INTO likes (user_handle, post_id) VALUES ($1, $2)',
          [user_handle, post_id]
        );
        // Get post author and notify
        const { rows: [post] } = await db.query(
          'SELECT user_handle FROM posts WHERE id = $1',
          [post_id]
        );
        if (post) {
          notifyLike(user_handle, post_id, post.user_handle);
        }
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
