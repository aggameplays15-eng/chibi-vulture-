const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

// Extract YouTube ID from various URL formats
function extractYoutubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // raw ID
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  // GET — public, returns active tracks
  if (req.method === 'GET') {
    try {
      const { rows } = await db.query(
        'SELECT * FROM music_playlist WHERE is_active = true ORDER BY sort_order ASC, created_at ASC'
      );
      return res.status(200).json(rows);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to fetch playlist' });
    }
  }

  // POST — admin only, add track
  if (req.method === 'POST') {
    const user = auth.verify(req);
    if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { title, artist, youtube_url } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0)
      return res.status(400).json({ error: 'Title required' });
    if (!youtube_url || typeof youtube_url !== 'string')
      return res.status(400).json({ error: 'YouTube URL required' });

    const youtube_id = extractYoutubeId(youtube_url.trim());
    if (!youtube_id) return res.status(400).json({ error: 'Invalid YouTube URL' });

    try {
      const { rows } = await db.query(
        'INSERT INTO music_playlist (title, artist, youtube_url, youtube_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [title.trim(), (artist || '').trim(), youtube_url.trim(), youtube_id]
      );
      return res.status(201).json(rows[0]);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to add track' });
    }
  }

  // PATCH — admin only, toggle active / update order
  if (req.method === 'PATCH') {
    const user = auth.verify(req);
    if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { id, is_active, sort_order } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });

    const updates = [];
    const values = [];
    if (typeof is_active === 'boolean') { updates.push(`is_active = $${values.length + 1}`); values.push(is_active); }
    if (typeof sort_order === 'number') { updates.push(`sort_order = $${values.length + 1}`); values.push(sort_order); }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    values.push(id);
    try {
      const { rows } = await db.query(
        `UPDATE music_playlist SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
      );
      return res.status(200).json(rows[0]);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to update track' });
    }
  }

  // DELETE — admin only
  if (req.method === 'DELETE') {
    const user = auth.verify(req);
    if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });

    try {
      await db.query('DELETE FROM music_playlist WHERE id = $1', [Number(id)]);
      return res.status(200).json({ status: 'Deleted' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to delete track' });
    }
  }

  res.status(405).end();
};
