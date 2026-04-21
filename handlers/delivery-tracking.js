// API handler for delivery tracking
// GET /api/orders/:orderId/tracking - Get delivery tracking for an order
// POST /api/delivery-tracking - Create tracking event

const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');
const { sendEmail } = require('./_lib/email');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    try {
      const orderId = req.query.orderId;

      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
      }

      // Real database query for order
      const orderQuery = `
        SELECT 
          id,
          tracking_number,
          carrier,
          estimated_delivery,
          actual_delivery,
          status
        FROM orders
        WHERE id = $1
      `;

      // Real database query for tracking events
      const eventsQuery = `
        SELECT 
          status,
          description,
          location,
          carrier,
          tracking_number,
          created_at
        FROM delivery_tracking_events
        WHERE order_id = $1
        ORDER BY created_at ASC
      `;

      const orderResult = await db.query(orderQuery, [orderId]);
      const eventsResult = await db.query(eventsQuery, [orderId]);

      if (!orderResult.rows[0]) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const tracking = {
        orderId: orderResult.rows[0].id,
        trackingNumber: orderResult.rows[0].tracking_number,
        carrier: orderResult.rows[0].carrier,
        currentStatus: orderResult.rows[0].status,
        estimatedDelivery: orderResult.rows[0].estimated_delivery,
        events: eventsResult.rows || [],
      };

      res.status(200).json(tracking);

    } catch (error) {
      console.error('Delivery tracking error:', error);
      res.status(500).json({ error: 'Failed to fetch delivery tracking' });
    }

  } else if (req.method === 'POST') {
    try {
      const { order_id, status, description, location, carrier, tracking_number } = req.body;

      if (!order_id || !status || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Insert real tracking event into database
      const insertEventQuery = `
        INSERT INTO delivery_tracking_events (order_id, status, description, location, carrier, tracking_number)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await db.query(insertEventQuery, [order_id, status, description, location, carrier, tracking_number]);

      // Update order status if needed
      if (tracking_number) {
        const updateOrderQuery = `
          UPDATE orders
          SET tracking_number = $1, carrier = $2, status = $3
          WHERE id = $4
        `;
        await db.query(updateOrderQuery, [tracking_number, carrier, status, order_id]);
      }

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
