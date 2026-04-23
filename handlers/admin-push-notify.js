const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { sendPushNotification } = require('./_lib/push');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const user = await auth.verify(req);
  if (!user || user.role !== 'Admin') return res.status(401).json({ error: 'Admin access required' });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, body, url = '/', icon = '/favicon.ico' } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  try {
    // Save as global announcement in DB for in-app display
    await db.query(
      'INSERT INTO announcements (title, body, url, icon) VALUES ($1, $2, $3, $4)',
      [title, body, url, icon]
    );

    // Get all push subscriptions
    const { rows: subscriptions } = await db.query(
      'SELECT user_handle, subscription FROM push_subscriptions'
    );

    if (subscriptions.length === 0) {
      return res.status(200).json({ 
        sent: 0, 
        message: 'No active subscriptions found' 
      });
    }

    const payload = { title, body, url, icon, tag: 'admin-broadcast' };
    let sent = 0;
    let failed = 0;
    const expiredSubscriptions = [];

    // Send to all subscriptions
    for (const { user_handle, subscription } of subscriptions) {
      try {
        const sub = JSON.parse(subscription);
        const result = await sendPushNotification(sub, payload);
        
        if (result.expired) {
          expiredSubscriptions.push(user_handle);
        } else {
          sent++;
        }
      } catch (error) {
        console.error(`[Admin Push] Failed to send to ${user_handle}:`, error.message);
        failed++;
        
        // If subscription is expired/gone, mark for removal
        if (error.statusCode === 410 || error.statusCode === 404) {
          expiredSubscriptions.push(user_handle);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await db.query(
        'DELETE FROM push_subscriptions WHERE user_handle = ANY($1)',
        [expiredSubscriptions]
      );
      console.log(`[Admin Push] Cleaned up ${expiredSubscriptions.length} expired subscriptions`);
    }

    res.status(200).json({
      sent,
      failed,
      cleaned: expiredSubscriptions.length,
      total: subscriptions.length,
      message: `Notification sent to ${sent} users${failed > 0 ? `, ${failed} failed` : ''}`
    });

  } catch (error) {
    console.error('[Admin Push] Error:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
};
