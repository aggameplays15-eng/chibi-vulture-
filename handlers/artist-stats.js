// API handler for artist statistics
// GET /api/artist-stats?artist_id=X&period=month

const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const artistId = Number(req.query.artist_id);
    const period = req.query.period || 'month';

    if (!artistId || isNaN(artistId)) {
      return res.status(400).json({ error: 'artist_id is required' });
    }

    // Non-admin users can only see their own stats
    if (user.role !== 'Admin' && user.id !== artistId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const now = new Date();
    let periodStart, periodEnd;

    switch (period) {
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodEnd = now;
        break;
      case 'year':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = now;
        break;
      case 'month':
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = now;
    }

    try {
      const statsQuery = `
        SELECT
          COALESCE(SUM(oi.quantity), 0) AS total_sales,
          COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) AS total_revenue,
          COALESCE(COUNT(DISTINCT oi.product_id), 0) AS products_sold,
          (SELECT COUNT(*) FROM products WHERE artist_id = $1) AS active_products
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE p.artist_id = $1 AND o.created_at >= $2 AND o.created_at <= $3
      `;

      const topProductsQuery = `
        SELECT
          p.name,
          SUM(oi.quantity) AS sales,
          SUM(oi.price_at_purchase * oi.quantity) AS revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE p.artist_id = $1 AND o.created_at >= $2 AND o.created_at <= $3
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 5
      `;

      const statsResult = await db.query(statsQuery, [artistId, periodStart, periodEnd]);
      const topProductsResult = await db.query(topProductsQuery, [artistId, periodStart, periodEnd]);

      res.status(200).json({
        stats: {
          total_sales: statsResult.rows[0]?.total_sales || 0,
          total_revenue: statsResult.rows[0]?.total_revenue || 0,
          products_sold: statsResult.rows[0]?.products_sold || 0,
          active_products: statsResult.rows[0]?.active_products || 0,
        },
        topProducts: topProductsResult.rows || [],
        period,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      });

    } catch (error) {
      console.error('Artist stats error:', error);
      res.status(500).json({ error: 'Failed to fetch artist stats' });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
