const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { sendEmail } = require('./_lib/email');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    // Returns follower/following counts and list for a given handle
    const { handle } = req.query;
    if (!handle || typeof handle !== 'string' || handle.length > 50) {
      return res.status(400).json({ error: 'Invalid handle' });
    }
    try {
      const [{ rows: followers }, { rows: following }] = await Promise.all([
        db.query('SELECT follower_handle FROM follows WHERE following_handle = $1', [handle]),
        db.query('SELECT following_handle FROM follows WHERE follower_handle = $1', [handle]),
      ]);
      res.status(200).json({
        followersCount: followers.length,
        followingCount: following.length,
        followers: followers.map(r => r.follower_handle),
        following: following.map(r => r.following_handle),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch follow data' });
    }

  } else if (req.method === 'POST') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { following_handle } = req.body;

    if (!following_handle || typeof following_handle !== 'string' || !/^@[a-zA-Z0-9_]{3,20}$/.test(following_handle)) {
      return res.status(400).json({ error: 'Invalid following handle' });
    }
    if (following_handle === user.handle) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const follower_handle = user.handle;
    try {
      const { rows: existing } = await db.query(
        'SELECT id FROM follows WHERE follower_handle = $1 AND following_handle = $2',
        [follower_handle, following_handle]
      );

      if (existing.length > 0) {
        await db.query(
          'DELETE FROM follows WHERE follower_handle = $1 AND following_handle = $2',
          [follower_handle, following_handle]
        );
        res.status(200).json({ following: false });
      } else {
        await db.query(
          'INSERT INTO follows (follower_handle, following_handle) VALUES ($1, $2)',
          [follower_handle, following_handle]
        );
        // Email au user suivi (fire & forget)
        db.query('SELECT email, name FROM users WHERE handle = $1', [following_handle])
          .then(({ rows }) => {
            if (rows.length > 0) {
              sendEmail(rows[0].email, 'newFollower', {
                recipientName: rows[0].name,
                followerName: user.name || follower_handle,
                followerHandle: follower_handle,
              }).catch(() => {});
            }
          }).catch(() => {});
        res.status(201).json({ following: true });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to toggle follow' });
    }

  } else {
    res.status(405).end();
  }
};
