// API handler for delivery tracking
// GET /api/orders/:orderId/tracking - Get delivery tracking for an order
// POST /api/delivery-tracking - Create tracking event (admin only)

const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { sendEmail } = require('./_lib/email');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    // Auth required — user can only see their own order, admin can see all
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });

    const orderId = req.query.orderId;
    if (!orderId || isNaN(Number(orderId))) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    try {
      const orderResult = await db.query(
        `SELECT id, user_handle, tracking_number, carrier, estimated_delivery, actual_delivery, status
         FROM orders WHERE id = $1`,
        [Number(orderId)]
      );

      if (!orderResult.rows[0]) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderResult.rows[0];

      // Non-admin users can only see their own orders
      if (user.role !== 'Admin' && order.user_handle !== user.handle) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const eventsResult = await db.query(
        `SELECT status, description, location, carrier, tracking_number, created_at
         FROM delivery_tracking_events
         WHERE order_id = $1
         ORDER BY created_at ASC`,
        [Number(orderId)]
      );

      res.status(200).json({
        orderId: order.id,
        trackingNumber: order.tracking_number,
        carrier: order.carrier,
        currentStatus: order.status,
        estimatedDelivery: order.estimated_delivery,
        events: eventsResult.rows || [],
      });

    } catch (error) {
      console.error('Delivery tracking error:', error);
      res.status(500).json({ error: 'Failed to fetch delivery tracking' });
    }

  } else if (req.method === 'POST') {
    // Admin only — create tracking event
    const user = await auth.verify(req);
    if (!user || user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const { order_id, status, description, location, carrier, tracking_number } = req.body;

    if (!order_id || !status || !description) {
      return res.status(400).json({ error: 'Missing required fields: order_id, status, description' });
    }

    try {
      await db.query(
        `INSERT INTO delivery_tracking_events (order_id, status, description, location, carrier, tracking_number)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order_id, status, description, location || null, carrier || null, tracking_number || null]
      );

      // Update order status and tracking info
      await db.query(
        `UPDATE orders SET status = $1
         ${tracking_number ? ', tracking_number = $3, carrier = $4' : ''}
         WHERE id = $2`,
        tracking_number
          ? [status, order_id, tracking_number, carrier || null]
          : [status, order_id]
      );

      // Email de mise à jour au client (fire & forget)
      try {
        const { rows: orderRows } = await db.query(
          `SELECT o.id, o.tracking_number, o.carrier, o.user_handle,
                  u.email, u.name
           FROM orders o
           LEFT JOIN users u ON u.handle = o.user_handle
           WHERE o.id = $1`,
          [order_id]
        );
        if (orderRows.length > 0 && orderRows[0].email) {
          sendEmail(orderRows[0].email, 'orderStatusUpdate', {
            name: orderRows[0].name,
            orderId: order_id,
            status,
            trackingNumber: tracking_number || orderRows[0].tracking_number,
            carrier: carrier || orderRows[0].carrier,
          }).catch(() => {});
        }
      } catch {}

      res.status(200).json({ success: true });

    } catch (error) {
      console.error('Create tracking event error:', error);
      res.status(500).json({ error: 'Failed to create tracking event' });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
