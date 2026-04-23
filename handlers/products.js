const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

// Colonnes produit à ajouter si absentes — exécuté une seule fois, pas à chaque GET
let schemaChecked = false;
async function ensureProductSchema() {
  if (schemaChecked) return;
  try {
    await db.query(
      "ALTER TABLE products " +
      "ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Art Digital', " +
      "ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false, " +
      "ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0"
    );
    schemaChecked = true;
  } catch {
    // Fail silently — colonnes existent déjà
    schemaChecked = true;
  }
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    await ensureProductSchema();
    try {
      const { rows } = await db.query('SELECT * FROM products ORDER BY is_featured DESC, id DESC');
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }

  } else if (req.method === 'POST') {
    const user = await auth.verify(req);
    if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { name, price, image, category, stock, featured } = req.body;

    if (!name || typeof name !== 'string' || name.length > 200)
      return res.status(400).json({ error: 'Invalid product name' });
    if (typeof price !== 'number' || price < 0)
      return res.status(400).json({ error: 'Invalid price' });
    if (!image || typeof image !== 'string')
      return res.status(400).json({ error: 'Image required' });
    if (image.startsWith('data:image/svg'))
      return res.status(400).json({ error: 'SVG images are not allowed' });
    const isBase64 = image.startsWith('data:image/');
    const maxImgSize = isBase64 ? 7 * 1024 * 1024 : 2000;
    if (image.length > maxImgSize)
      return res.status(400).json({ error: 'Image too large (max 5MB)' });
    if (!category || typeof category !== 'string' || category.length > 50)
      return res.status(400).json({ error: 'Invalid category' });

    try {
      const { rows } = await db.query(
        'INSERT INTO products (name, price, image, category, stock, is_featured) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, price, image, category, stock || 0, featured || false]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create product' });
    }

  } else if (req.method === 'PATCH') {
    const user = await auth.verify(req);
    if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.query;
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid id' });

    const { name, price, image, category, stock, featured } = req.body;
    const setClauses = [];
    const values = [];

    // BUG FIX: push value first, then use values.length for the correct $N placeholder
    if (name !== undefined) { values.push(name); setClauses.push(`name = $${values.length}`); }
    if (price !== undefined) { values.push(price); setClauses.push(`price = $${values.length}`); }
    if (image !== undefined) {
      if (image.startsWith('data:image/svg')) return res.status(400).json({ error: 'SVG images are not allowed' });
      values.push(image); setClauses.push(`image = $${values.length}`);
    }
    if (category !== undefined) { values.push(category); setClauses.push(`category = $${values.length}`); }
    if (stock !== undefined) { values.push(stock); setClauses.push(`stock = $${values.length}`); }
    if (featured !== undefined) { values.push(featured); setClauses.push(`is_featured = $${values.length}`); }

    if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(Number(id));
    const idPlaceholder = `$${values.length}`;

    try {
      const { rows } = await db.query(
        `UPDATE products SET ${setClauses.join(', ')} WHERE id = ${idPlaceholder} RETURNING *`,
        values
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update product' });
    }

  } else if (req.method === 'DELETE') {
    const user = await auth.verify(req);
    if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { id } = req.query;
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid id' });
    try {
      await db.query('DELETE FROM products WHERE id = $1', [Number(id)]);
      res.status(200).json({ status: 'Deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete product' });
    }

  } else {
    res.status(405).end();
  }
};
