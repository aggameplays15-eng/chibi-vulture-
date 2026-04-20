const webpush = require('web-push');
const db = require('./db');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@chibivulture.com';

let isConfigured = false;

function configureVAPID() {
  if (isConfigured) return true;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured. Push notifications disabled.');
    return false;
  }

  try {
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    isConfigured = true;
    console.log('[Push] VAPID configured successfully');
    return true;
  } catch (error) {
    console.error('[Push] Failed to configure VAPID:', error.message);
    return false;
  }
}

async function saveSubscription(userHandle, subscription) {
  try {
    await db.query(
      `INSERT INTO push_subscriptions (user_handle, subscription, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_handle) 
       DO UPDATE SET subscription = $2, created_at = NOW()`,
      [userHandle, JSON.stringify(subscription)]
    );
    return true;
  } catch (error) {
    console.error('[Push] Failed to save subscription:', error.message);
    throw error;
  }
}

async function deleteSubscription(userHandle) {
  try {
    await db.query(
      'DELETE FROM push_subscriptions WHERE user_handle = $1',
      [userHandle]
    );
    return true;
  } catch (error) {
    console.error('[Push] Failed to delete subscription:', error.message);
    throw error;
  }
}

async function getSubscriptionsForUser(userHandle) {
  try {
    const { rows } = await db.query(
      'SELECT subscription FROM push_subscriptions WHERE user_handle = $1',
      [userHandle]
    );
    return rows.map(r => JSON.parse(r.subscription));
  } catch (error) {
    console.error('[Push] Failed to get subscriptions:', error.message);
    return [];
  }
}

async function sendPushNotification(subscription, payload) {
  if (!configureVAPID()) {
    console.log('[Push] Would send notification:', payload);
    return { status: 'mock' };
  }

  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return result;
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('[Push] Subscription expired, removing...');
      return { expired: true };
    }
    console.error('[Push] Failed to send notification:', error.message);
    throw error;
  }
}

async function notifyUser(userHandle, notification) {
  const subscriptions = await getSubscriptionsForUser(userHandle);
  
  if (subscriptions.length === 0) {
    console.log(`[Push] No subscriptions for user ${userHandle}`);
    return [];
  }

  const results = [];
  for (const subscription of subscriptions) {
    try {
      const result = await sendPushNotification(subscription, notification);
      results.push(result);
      
      if (result.expired) {
        await deleteSubscription(userHandle);
      }
    } catch (error) {
      console.error('[Push] Error sending to subscription:', error.message);
    }
  }

  return results;
}

function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

module.exports = {
  configureVAPID,
  saveSubscription,
  deleteSubscription,
  getSubscriptionsForUser,
  sendPushNotification,
  notifyUser,
  getVapidPublicKey,
};
