// API handler for artist statistics
// GET /api/artist-stats - Get artist statistics
// POST /api/artist-stats - Create/update artist stats

const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    try {
      const artistId = req.query.artist_id;
      const period = req.query.period || 'month';

      if (!artistId) {
        return res.status(400).json({ error: 'artist_id is required' });
      }

      // Calculate period boundaries
      const now = new Date();
      let periodStart, periodEnd;

      switch (period) {
        case 'week':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          periodEnd = now;
          break;
        case 'month':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = now;
          break;
        case 'year':
          periodStart = new Date(now.getFullYear(), 0, 1);
          periodEnd = now;
          break;
        default:
          periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          periodEnd = now;
      }

      // Real database queries using PostgreSQL
      const statsQuery = `
        SELECT 
          COALESCE(SUM(oi.quantity), 0) as total_sales,
          COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) as total_revenue,
          COALESCE(COUNT(DISTINCT oi.product_id), 0) as products_sold,
          (SELECT COUNT(*) FROM products WHERE artist_id = $1) as active_products
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= $2 AND o.created_at <= $3
      `;

      const topProductsQuery = `
        SELECT 
          p.name,
          SUM(oi.quantity) as sales,
          SUM(oi.price_at_purchase * oi.quantity) as revenue
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

      const stats = {
        total_sales: statsResult.rows[0]?.total_sales || 0,
        total_revenue: statsResult.rows[0]?.total_revenue || 0,
        products_sold: statsResult.rows[0]?.products_sold || 0,
        active_products: statsResult.rows[0]?.active_products || 0,
      };

      const topProducts = topProductsResult.rows || [];

      res.status(200).json({
        stats,
        topProducts,
        period,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      });

    } catch (error) {
      console.error('Artist stats error:', error);
      res.status(500).json({ error: 'Failed to fetch artist stats' });
    }

  } else if (req.method === 'POST') {
    try {
      const { artist_id, period, period_start, period_end } = req.body;

      if (!artist_id || !period || !period_start || !period_end) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Calculate real stats from orders
      const statsQuery = `
        INSERT INTO artist_stats (artist_id, period, period_start, period_end, total_sales, total_revenue, products_sold, active_products)
        SELECT 
          $1,
          $2,
          $3,
          $4,
          COALESCE(SUM(oi.quantity), 0),
          COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0),
          COALESCE(COUNT(DISTINCT oi.product_id), 0),
          (SELECT COUNT(*) FROM products WHERE artist_id = $1)
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= $3 AND o.created_at <= $4
        ON CONFLICT (artist_id, period, period_start) 
        DO UPDATE SET
          total_sales = EXCLUDED.total_sales,
          total_revenue = EXCLUDED.total_revenue,
          products_sold = EXCLUDED.products_sold,
          active_products = EXCLUDED.active_products
      `;

      await db.query(statsQuery, [artist_id, period, period_start, period_end]);

      res.status(200).json({ success: true });

    } catch (error) {
      console.error('Create artist stats error:', error);
      res.status(500).json({ error: 'Failed to create artist stats' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
