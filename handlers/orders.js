const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { sendEmail } = require('./_lib/email');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    // Client: ses propres commandes
    if (req.query.mine) {
      const user = await auth.verify(req);
      if (!user) return res.status(401).json({ error: 'Auth required' });
      try {
        const { rows } = await db.query(
          'SELECT id, total, status, created_at, shipping_address FROM orders WHERE user_handle = $1 ORDER BY created_at DESC',
          [user.handle]
        );
        return res.status(200).json(rows);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }
    }

    // Admin: toutes les commandes
    const admin = await auth.verify(req);
    if (!admin || admin.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    try {
      const { rows } = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }

  } else if (req.method === 'POST') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const { customer_name, total, items } = req.body;

    if (!customer_name || typeof customer_name !== 'string' || customer_name.length > 100) {
      return res.status(400).json({ error: 'Invalid customer name' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items must be a non-empty array' });
    }
    for (const item of items) {
      if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({ error: 'Invalid item in order' });
      }
    }

    // Recompute total from DB prices to prevent price manipulation
    let computedTotal = 0;
    let priceMap = {};
    try {
      const itemIds = items.map(i => i.id);
      const { rows: dbProducts } = await db.query(
        `SELECT id, price FROM products WHERE id = ANY($1::int[])`,
        [itemIds]
      );
      priceMap = Object.fromEntries(dbProducts.map(p => [p.id, parseFloat(p.price)]));
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

    // Delivery fee: difference between client total and computed total (if positive)
    const deliveryFee = typeof total === 'number' && total > computedTotal ? total - computedTotal : 0;
    const finalTotal = computedTotal + deliveryFee;

    try {
      // Insert order — let DB generate the id (SERIAL)
      const { rows } = await db.query(
        `INSERT INTO orders (user_handle, total, status, shipping_address, phone)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          user.handle,
          finalTotal,
          'En attente',
          req.body.shipping_address || null,
          req.body.phone || null
        ]
      );
      const order = rows[0];

      // Insert order items
      for (const item of items) {
        const price = priceMap[item.id];
        await db.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.id, item.quantity, price]
        );
      }

      // Fetch product names for emails
      const { rows: productRows } = await db.query(
        `SELECT id, name, price FROM products WHERE id = ANY($1::int[])`,
        [items.map(i => i.id)]
      );
      const productMap = Object.fromEntries(productRows.map(p => [p.id, p]));
      const emailItems = items.map(i => ({
        name: productMap[i.id]?.name || `Produit #${i.id}`,
        quantity: i.quantity,
        price: priceMap[i.id],
      }));

      // Email confirmation au client (fire & forget)
      const { rows: userRows } = await db.query('SELECT email, name FROM users WHERE handle = $1', [user.handle]);
      if (userRows.length > 0) {
        sendEmail(userRows[0].email, 'orderConfirmation', {
          name: userRows[0].name,
          orderId: order.id,
          items: emailItems,
          total: finalTotal,
          shippingAddress: req.body.shipping_address || null,
          phone: req.body.phone || null,
        }).catch(() => {});
      }

      // Email notification à l'admin (fire & forget)
      if (process.env.ADMIN_EMAIL) {
        sendEmail(process.env.ADMIN_EMAIL, 'newOrderAdmin', {
          orderId: order.id,
          customerName: customer_name,
          total: finalTotal,
          items: emailItems,
          shippingAddress: req.body.shipping_address || null,
          phone: req.body.phone || null,
        }).catch(() => {});
      }

      res.status(201).json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create order' });
    }

  } else {
    res.status(405).end();
  }
};
