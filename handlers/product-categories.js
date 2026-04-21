// API handler for product categories
// GET /api/product-categories - Get all product categories
// POST /api/product-categories - Create a new category (admin only)

const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    try {
      // Real database query for all active categories
      const query = `
        SELECT 
          id,
          name,
          description,
          icon,
          color,
          sort_order
        FROM product_categories
        WHERE is_active = true
        ORDER BY sort_order ASC, name ASC
      `;

      const result = await db.query(query);

      res.status(200).json(result.rows || []);

    } catch (error) {
      console.error('Product categories error:', error);
      res.status(500).json({ error: 'Failed to fetch product categories' });
    }

  } else if (req.method === 'POST') {
    const user = auth.verify(req);
    if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    try {
      const { name, description, icon, color, sort_order } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }

      // Insert new category into database
      const insertQuery = `
        INSERT INTO product_categories (name, description, icon, color, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await db.query(insertQuery, [name, description, icon, color, sort_order]);

      res.status(201).json(result.rows[0]);

    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
