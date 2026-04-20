const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { saveSubscription, deleteSubscription, getVapidPublicKey } = require('./_lib/push');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const user = auth.verify(req);
  if (!user) return res.status(401).json({ error: 'Auth required' });

  // GET - Return VAPID public key
  if (req.method === 'GET') {
    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      return res.status(503).json({ error: 'Push notifications not configured' });
    }
    return res.status(200).json({ publicKey });
  }

  // POST - Subscribe to push notifications
  if (req.method === 'POST') {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    try {
      await saveSubscription(user.handle, subscription);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Push Subscribe] Error:', error);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }
  }

  // DELETE - Unsubscribe from push notifications
  if (req.method === 'DELETE') {
    try {
      await deleteSubscription(user.handle);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Push Unsubscribe] Error:', error);
      return res.status(500).json({ error: 'Failed to delete subscription' });
    }
  }

  res.status(405).end();
};
