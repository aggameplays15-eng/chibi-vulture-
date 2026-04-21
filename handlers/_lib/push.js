// Web Push helpers using VAPID
const webpush = require('web-push');
const db = require('./db');

// Configure VAPID keys if available
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@chibivulture.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

function getVapidPublicKey() {
  return vapidPublicKey || null;
}

async function saveSubscription(userHandle, subscription) {
  const subJson = JSON.stringify(subscription);
  await db.query(
    `INSERT INTO push_subscriptions (user_handle, subscription)
     VALUES ($1, $2)
     ON CONFLICT (user_handle) DO UPDATE SET subscription = $2, created_at = NOW()`,
    [userHandle, subJson]
  );
}

async function deleteSubscription(userHandle) {
  await db.query('DELETE FROM push_subscriptions WHERE user_handle = $1', [userHandle]);
}

async function sendPushNotification(subscription, payload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[Push] VAPID keys not configured, skipping push notification');
    return { skipped: true };
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { expired: true };
    }
    throw err;
  }
}

module.exports = { getVapidPublicKey, saveSubscription, deleteSubscription, sendPushNotification };
