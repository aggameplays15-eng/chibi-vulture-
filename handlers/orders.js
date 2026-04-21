const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { sendEmail } = require('./_lib/email');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'GET') {
    const admin = auth.verify(req);
    if (!admin || admin.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    try {
      const { rows } = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  } else if (req.method === 'POST') {
    const user = auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

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
    let priceMap = {};
    try {
      const itemIds = items.map(i => i.id);
      const { rows: dbProducts } = await db.query(
        `SELECT id, price FROM products WHERE id = ANY($1::int[])`,
        [itemIds]
      );
      priceMap = Object.fromEntries(dbProducts.map(p => [p.id, p.price]));
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
      // Insert order
      const { rows } = await db.query(
        `INSERT INTO orders (id, user_handle, total, status, shipping_address, phone)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          id,
          user ? user.handle : 'guest',
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

      // Récupérer les noms des produits pour les emails
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
      if (user) {
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
