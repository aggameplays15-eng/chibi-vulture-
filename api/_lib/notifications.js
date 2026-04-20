const db = require('./db');
const { notifyUser } = require('./push');
const { sendNotificationEmail } = require('./email');

async function createNotification({ type, actorHandle, targetHandle, postId, commentText }) {
  if (actorHandle === targetHandle) return;

  try {
    // Get actor info
    const { rows: [actor] } = await db.query(
      'SELECT name, avatar_image FROM users WHERE handle = $1',
      [actorHandle]
    );

    if (!actor) return;

    // Get target user email and notification preferences
    const { rows: [targetUser] } = await db.query(
      'SELECT email, notification_email, notification_push FROM users WHERE handle = $1',
      [targetHandle]
    );

    if (!targetUser) return;

    let title, body, url;

    switch (type) {
      case 'like':
        title = `${actor.name} a aimé votre post`;
        body = 'Quelqu\'un a aimé votre publication';
        url = `/post/${postId}`;
        break;
      case 'follow':
        title = `${actor.name} vous suit`;
        body = 'Vous avez un nouveau follower';
        url = `/profile/${actorHandle}`;
        break;
      case 'comment':
        title = `${actor.name} a commenté votre post`;
        body = commentText ? commentText.slice(0, 100) : 'Nouveau commentaire';
        url = `/post/${postId}`;
        break;
      default:
        return;
    }

    const notification = { title, body, url, type, actorHandle };

    // Send push notification if enabled
    if (targetUser.notification_push !== false) {
      try {
        await notifyUser(targetHandle, notification);
      } catch (error) {
        console.error('[Notification] Push failed:', error.message);
      }
    }

    // Send email notification if enabled
    if (targetUser.notification_email !== false && targetUser.email) {
      try {
        await sendNotificationEmail(targetUser.email, notification);
      } catch (error) {
        console.error('[Notification] Email failed:', error.message);
      }
    }

  } catch (error) {
    console.error('[Notification] Failed to create notification:', error);
  }
}

async function notifyLike(userHandle, postId, postAuthorHandle) {
  return createNotification({
    type: 'like',
    actorHandle: userHandle,
    targetHandle: postAuthorHandle,
    postId,
  });
}

async function notifyFollow(followerHandle, followingHandle) {
  return createNotification({
    type: 'follow',
    actorHandle: followerHandle,
    targetHandle: followingHandle,
  });
}

async function notifyComment(userHandle, postId, postAuthorHandle, commentText) {
  return createNotification({
    type: 'comment',
    actorHandle: userHandle,
    targetHandle: postAuthorHandle,
    postId,
    commentText,
  });
}

module.exports = {
  createNotification,
  notifyLike,
  notifyFollow,
  notifyComment,
};
