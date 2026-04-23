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
      // S'assurer que la table existe
      await db.query(`
        CREATE TABLE IF NOT EXISTS product_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          icon VARCHAR(50),
          color VARCHAR(7) DEFAULT '#EC4899',
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // S'assurer que l'index existe
      await db.query('CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name)');

      // Vérifier si des catégories existent
      const { rows: countCheck } = await db.query('SELECT COUNT(*) FROM product_categories');
      if (parseInt(countCheck[0].count) === 0) {
        // Seeding initial
        await db.query(`
          INSERT INTO product_categories (name, description, icon, color, sort_order) VALUES
          ('Art Digital', 'Œuvres numériques et créations digitales', 'Palette', '#8B5CF6', 1),
          ('Merch', 'Produits dérivés et goodies', 'ShoppingBag', '#EC4899', 2),
          ('Accessoires', 'Accessoires et objets personnalisés', 'Sparkles', '#F59E0B', 3),
          ('Vêtements', 'T-shirts, hoodies et vêtements personnalisés', 'Shirt', '#3B82F6', 4),
          ('Livres', 'Livres, comics et publications', 'Book', '#10B981', 5),
          ('Limited', 'Éditions limitées et exclusives', 'Star', '#EF4444', 0)
          ON CONFLICT (name) DO NOTHING
        `);
      }

      // Real database query for all active categories
      const result = await db.query('SELECT * FROM product_categories WHERE is_active = true ORDER BY sort_order ASC, name ASC');
      res.status(200).json(result.rows || []);

    } catch (error) {
      console.error('Product categories error:', error);
      res.status(500).json({ error: 'Failed to fetch product categories' });
    }

  } else if (req.method === 'POST') {
    const user = await auth.verify(req);
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
