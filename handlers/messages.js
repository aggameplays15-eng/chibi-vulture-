const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { sendEmail } = require('./_lib/email');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  
  if (req.method === 'POST') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { receiver_handle, text } = req.body;
    
    // Validation
    if (!receiver_handle || typeof receiver_handle !== 'string' || receiver_handle.length > 50) {
      return res.status(400).json({ error: 'Invalid receiver handle' });
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 1000) {
      return res.status(400).json({ error: 'Message text required (1-1000 chars)' });
    }
    
    try {
      const { rows } = await db.query(
        'INSERT INTO messages (sender_handle, receiver_handle, text) VALUES ($1, $2, $3) RETURNING *',
        [user.handle, receiver_handle, text]
      );
      // Email au destinataire (fire & forget)
      db.query('SELECT email, name FROM users WHERE handle = $1', [receiver_handle])
        .then(({ rows: recRows }) => {
          if (recRows.length > 0) {
            sendEmail(recRows[0].email, 'newMessage', {
              recipientName: recRows[0].name,
              senderName: user.name || user.handle,
              senderHandle: user.handle,
              preview: text,
            }).catch(() => {});
          }
        }).catch(() => {});
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  } else if (req.method === 'PATCH') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { sender_handle } = req.body;

    if (!sender_handle || typeof sender_handle !== 'string') {
      return res.status(400).json({ error: 'Invalid sender handle' });
    }

    try {
      await db.query(
        `UPDATE messages 
         SET is_read = true 
         WHERE sender_handle = $1 AND receiver_handle = $2 AND is_read = false`,
        [sender_handle, user.handle]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  } else if (req.method === 'GET') {
    // SECURITY FIX: Require authentication — anyone could read any conversation without this check.
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { user1, user2 } = req.query;

    // Validate params
    if (!user1 || !user2 || typeof user1 !== 'string' || typeof user2 !== 'string') {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }

    // Ensure the requester is one of the two participants
    if (user.handle !== user1 && user.handle !== user2) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const { rows } = await db.query(
        `SELECT * FROM messages 
         WHERE (sender_handle = $1 AND receiver_handle = $2) 
         OR (sender_handle = $2 AND receiver_handle = $1) 
         ORDER BY created_at ASC`,
        [user1, user2]
      );
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  } else {
    res.status(405).end();
  }
};
