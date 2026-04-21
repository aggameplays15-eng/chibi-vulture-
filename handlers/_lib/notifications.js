// In-app notification helpers
const db = require('./db');

async function createNotification(recipientHandle, type, actorHandle, postId = null, text = null) {
  if (recipientHandle === actorHandle) return; // Don't notify yourself
  try {
    await db.query(
      `INSERT INTO notifications (user_handle, type, actor_handle, post_id, text)
       VALUES ($1, $2, $3, $4, $5)`,
      [recipientHandle, type, actorHandle, postId, text]
    );
  } catch (err) {
    console.error('[Notifications] Failed to create notification:', err.message);
  }
}

function notifyLike(actorHandle, postId, postAuthorHandle) {
  return createNotification(postAuthorHandle, 'like', actorHandle, postId);
}

function notifyComment(actorHandle, postId, postAuthorHandle, text) {
  return createNotification(postAuthorHandle, 'comment', actorHandle, postId, text);
}

function notifyFollow(actorHandle, targetHandle) {
  return createNotification(targetHandle, 'follow', actorHandle);
}

module.exports = { notifyLike, notifyComment, notifyFollow };
