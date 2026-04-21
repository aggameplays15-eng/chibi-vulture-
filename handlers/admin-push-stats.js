const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { getVapidPublicKey } = require('./_lib/push');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const user = await auth.verify(req);
  if (!user || user.role !== 'Admin') return res.status(401).json({ error: 'Admin access required' });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get push subscription stats
    const { rows: [stats] } = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM push_subscriptions) as total_subscriptions,
        (SELECT COUNT(DISTINCT user_handle) FROM push_subscriptions) as unique_users,
        (SELECT COUNT(*) FROM users WHERE notification_push = true) as users_enabled,
        (SELECT COUNT(*) FROM users WHERE notification_push = false) as users_disabled
    `);

    // Get recent subscriptions (last 7 days)
    const { rows: recentSubs } = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM push_subscriptions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.status(200).json({
      configured: !!getVapidPublicKey(),
      stats: {
        totalSubscriptions: parseInt(stats.total_subscriptions) || 0,
        uniqueUsers: parseInt(stats.unique_users) || 0,
        usersEnabled: parseInt(stats.users_enabled) || 0,
        usersDisabled: parseInt(stats.users_disabled) || 0,
      },
      recentSubscriptions: recentSubs,
    });

  } catch (error) {
    console.error('[Admin Push Stats] Error:', error);
    res.status(500).json({ error: 'Failed to fetch push stats' });
  }
};
