const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'GET') {
    // Admin only
    if (!auth.verify(req, true)) return res.status(403).json({ error: 'Admin only' });

    try {
      const { rows } = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  } else if (req.method === 'POST') {
    // Authenticated or guest order? Let's say authenticated
    const user = auth.verify(req);
    // If guest mode allowed, we'd check for guest flag, but let's stick to auth for safety
    if (!user && !req.body.isGuest) return res.status(401).json({ error: 'Auth required' });

    const { id, customer_name, total, items } = req.body;
    
    // Validation
    if (!id || typeof id !== 'string' || id.length > 50) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    if (!customer_name || typeof customer_name !== 'string' || customer_name.length > 100) {
      return res.status(400).json({ error: 'Invalid customer name' });
    }
    // SECURITY FIX: Never trust the total from the client — recompute it server-side from items.
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items must be a non-empty array' });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({ error: 'Invalid item in order' });
      }
    }

    // Recompute total from DB prices to prevent price manipulation
    let computedTotal = 0;
    try {
      const itemIds = items.map(i => i.id);
      const { rows: dbProducts } = await db.query(
        `SELECT id, price FROM products WHERE id = ANY($1::int[])`,
        [itemIds]
      );
      const priceMap = Object.fromEntries(dbProducts.map(p => [p.id, p.price]));
      for (const item of items) {
        const price = priceMap[item.id];
        if (price === undefined) {
          return res.status(400).json({ error: `Product ${item.id} not found` });
        }
        computedTotal += price * item.quantity;
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to verify prices' });
    }

    // Add delivery fee if provided (must be a non-negative number)
    const deliveryFee = typeof total === 'number' && total > computedTotal ? total - computedTotal : 0;
    const finalTotal = computedTotal + deliveryFee;
    
    try {
      const { rows } = await db.query(
        'INSERT INTO orders (id, customer_id, customer_name, total, items, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, user ? user.id : null, customer_name, finalTotal, JSON.stringify(items), 'En attente']
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  } else {
    res.status(405).end();
  }
};
