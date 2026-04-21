// Main API router for Vercel Serverless Functions
// Routes requests to appropriate handlers based on path

const loginHandler = require('../handlers/login');
const adminLoginHandler = require('../handlers/admin-login');
const usersHandler = require('../handlers/users');
const postsHandler = require('../handlers/posts');
const productsHandler = require('../handlers/products');
const ordersHandler = require('../handlers/orders');
const likesHandler = require('../handlers/likes');
const followsHandler = require('../handlers/follows');
const messagesHandler = require('../handlers/messages');
const conversationsHandler = require('../handlers/conversations');
const commentsHandler = require('../handlers/comments');
const notificationsHandler = require('../handlers/notifications');
const pushSubscribeHandler = require('../handlers/push-subscribe');
const adminPushStatsHandler = require('../handlers/admin-push-stats');
const adminPushNotifyHandler = require('../handlers/admin-push-notify');
const appSettingsHandler = require('../handlers/app-settings');
const artistStatsHandler = require('../handlers/artist-stats');
const deliveryTrackingHandler = require('../handlers/delivery-tracking');
const productCategoriesHandler = require('../handlers/product-categories');
const searchHandler = require('../handlers/search');
const musicHandler = require('../handlers/music');
const logoutHandler = require('../handlers/logout');

// Route mapping
const routes = {
  '/api/login': loginHandler,
  '/api/admin-login': adminLoginHandler,
  '/api/users': usersHandler,
  '/api/posts': postsHandler,
  '/api/products': productsHandler,
  '/api/orders': ordersHandler,
  '/api/likes': likesHandler,
  '/api/follows': followsHandler,
  '/api/messages': messagesHandler,
  '/api/conversations': conversationsHandler,
  '/api/comments': commentsHandler,
  '/api/notifications': notificationsHandler,
  '/api/push-subscribe': pushSubscribeHandler,
  '/api/admin-push-stats': adminPushStatsHandler,
  '/api/admin-push-notify': adminPushNotifyHandler,
  '/api/app-settings': appSettingsHandler,
  '/api/artist-stats': artistStatsHandler,
  '/api/delivery-tracking': deliveryTrackingHandler,
  '/api/product-categories': productCategoriesHandler,
  '/api/search': searchHandler,
  '/api/music': musicHandler,
  '/api/logout': logoutHandler,
};

module.exports = async (req, res) => {
  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  
  // Add query params to req.query
  req.query = Object.fromEntries(url.searchParams);

  // Route spéciale : /api/orders/:id/tracking
  const trackingMatch = pathname.match(/^\/api\/orders\/([^/]+)\/tracking$/);
  if (trackingMatch) {
    req.query.orderId = trackingMatch[1];
    try {
      await deliveryTrackingHandler(req, res);
    } catch (error) {
      console.error('Error in delivery tracking handler:', error);
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }
  
  // Find handler
  const handler = routes[pathname];
  
  if (handler) {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`Error in handler for ${pathname}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  } else {
    res.status(404).json({ 
      error: 'Not found',
      path: pathname,
      availableRoutes: Object.keys(routes)
    });
  }
};
