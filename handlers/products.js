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
    const user = await auth.verify(req);
    if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { name, price, image, category, stock, featured } = req.body;

    if (!name || typeof name !== 'string' || name.length > 200) {
      return res.status(400).json({ error: 'Invalid product name' });
    }
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image required' });
    }
    if (image.startsWith('data:image/svg')) {
      return res.status(400).json({ error: 'SVG images are not allowed' });
    }
    const isBase64 = image.startsWith('data:image/');
    const maxImgSize = isBase64 ? 7 * 1024 * 1024 : 2000;
    if (image.length > maxImgSize) {
      return res.status(400).json({ error: 'Image too large (max 5MB)' });
    }
    if (!category || typeof category !== 'string' || category.length > 50) {
      return res.status(400).json({ error: 'Invalid category' });
    }

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
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push(`name = $${fields.length + 1}`); values.push(name); }
    if (price !== undefined) { fields.push(`price = $${fields.length + 1}`); values.push(price); }
    if (image !== undefined) {
      if (image.startsWith('data:image/svg')) return res.status(400).json({ error: 'SVG images are not allowed' });
      fields.push(`image = $${fields.length + 1}`); values.push(image);
    }
    if (category !== undefined) { fields.push(`category = $${fields.length + 1}`); values.push(category); }
    if (stock !== undefined) { fields.push(`stock = $${fields.length + 1}`); values.push(stock); }
    if (featured !== undefined) { fields.push(`is_featured = $${fields.length + 1}`); values.push(featured); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(Number(id));
    try {
      const { rows } = await db.query(
        `UPDATE products SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
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
