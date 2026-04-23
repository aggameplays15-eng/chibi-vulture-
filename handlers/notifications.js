const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const user = await auth.verify(req);
  if (!user) return res.status(401).json({ error: 'Auth required' });

  if (req.method === 'GET') {
    try {
      const results = await Promise.allSettled([
        // Likes sur mes posts
        db.query(`
          SELECT 
            l.id,
            'like' as type,
            l.user_handle as actor_handle,
            u.name as actor_name,
            u.avatar_image as actor_avatar,
            p.id as post_id,
            p.image as post_image,
            l.created_at
          FROM likes l
          JOIN posts p ON l.post_id = p.id
          JOIN users u ON l.user_handle = u.handle
          WHERE p.user_handle = $1 AND l.user_handle != $1
          ORDER BY l.created_at DESC
          LIMIT 20
        `, [user.handle]),

        // Nouveaux followers
        db.query(`
          SELECT
            f.id,
            'follow' as type,
            f.follower_handle as actor_handle,
            u.name as actor_name,
            u.avatar_image as actor_avatar,
            NULL as post_id,
            NULL as post_image,
            f.created_at
          FROM follows f
          JOIN users u ON f.follower_handle = u.handle
          WHERE f.following_handle = $1
          ORDER BY f.created_at DESC
          LIMIT 20
        `, [user.handle]),

        // Commentaires sur mes posts
        db.query(`
          SELECT
            c.id,
            'comment' as type,
            c.user_handle as actor_handle,
            u.name as actor_name,
            u.avatar_image as actor_avatar,
            c.post_id,
            p.image as post_image,
            c.text as comment_text,
            c.created_at
          FROM comments c
          JOIN posts p ON c.post_id = p.id
          JOIN users u ON c.user_handle = u.handle
          WHERE p.user_handle = $1 AND c.user_handle != $1
          ORDER BY c.created_at DESC
          LIMIT 20
        `, [user.handle]),

        // Annonces globales
        db.query(`
          SELECT
            id,
            'announcement' as type,
            'Admin' as actor_handle,
            'Système' as actor_name,
            icon as actor_avatar,
            NULL as post_id,
            NULL as post_image,
            title as comment_text,
            body as extra_text,
            url,
            created_at
          FROM announcements
          ORDER BY created_at DESC
          LIMIT 5
        `).catch(err => {
          console.warn('Announcements table might be missing:', err.message);
          return { rows: [] };
        })
      ]);

      const likeNotifs = results[0].status === 'fulfilled' ? results[0].value.rows : [];
      const followNotifs = results[1].status === 'fulfilled' ? results[1].value.rows : [];
      const commentNotifs = results[2].status === 'fulfilled' ? results[2].value.rows : [];
      const announcements = results[3].status === 'fulfilled' ? results[3].value.rows : [];

      // Merge et trier par date
      const all = [...likeNotifs, ...followNotifs, ...commentNotifs, ...announcements]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 30);

      res.status(200).json(all);
    } catch (error) {
      console.error('Fatal notifications error:', error);
      res.status(200).json([]); // Fallback to empty instead of 500
    }
  } else {
    res.status(405).end();
  }
};
