const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'GET') {
    try {
      const { rows } = await db.query('SELECT * FROM products ORDER BY id DESC');
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  } else if (req.method === 'POST') {
    // Admin only
    if (!auth.verify(req, true)) return res.status(403).json({ error: 'Admin only' });

    const { name, price, image, category, stock, featured } = req.body;
    
    // Validation des entrées
    if (!name || typeof name !== 'string' || name.length > 200) {
      return res.status(400).json({ error: 'Invalid product name' });
    }
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    if (!image || typeof image !== 'string' || image.length > 1000) {
      return res.status(400).json({ error: 'Invalid image URL' });
    }
    if (!category || typeof category !== 'string' || category.length > 50) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    try {
      const { rows } = await db.query(
        'INSERT INTO products (name, price, image, category, stock, featured) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, price, image, category, stock || 0, featured || false]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  } else if (req.method === 'DELETE') {
    // Admin only
    if (!auth.verify(req, true)) return res.status(403).json({ error: 'Admin only' });

    const { id } = req.query;
    try {
      await db.query('DELETE FROM products WHERE id = $1', [id]);
      res.status(200).json({ status: 'Deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  } else {
    res.status(405).end();
  }
};
