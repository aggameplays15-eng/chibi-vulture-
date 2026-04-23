const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const user = await auth.verify(req);
  if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

  if (req.method === 'GET') {
    try {
      const { limit = 100, offset = 0, type, ip } = req.query;
      const limitNum = Math.min(parseInt(limit) || 100, 500);
      const offsetNum = parseInt(offset) || 0;

      let query = `
        SELECT 
          id,
          ip,
          threat_type,
          detail,
          path,
          method,
          user_agent,
          created_at
        FROM security_log
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (type) {
        query += ` AND threat_type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (ip) {
        query += ` AND ip = $${paramIndex}`;
        params.push(ip);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limitNum, offsetNum);

      const { rows } = await db.query(query, params);

      // Get stats
      const { rows: stats } = await db.query(`
        SELECT 
          threat_type,
          COUNT(*) as count,
          COUNT(DISTINCT ip) as unique_ips
        FROM security_log
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY threat_type
        ORDER BY count DESC
      `);

      // Get total count
      const { rows: countRows } = await db.query(
        `SELECT COUNT(*) as total FROM security_log WHERE created_at > NOW() - INTERVAL '30 days'`
      );

      res.status(200).json({
        logs: rows,
        stats,
        total: parseInt(countRows[0]?.total || 0, 10),
      });
    } catch (error) {
      console.error('Security logs error:', error);
      res.status(500).json({ error: 'Failed to fetch security logs' });
    }
  } else {
    res.status(405).end();
  }
};
