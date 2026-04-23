// Main API router for Vercel Serverless Functions
// Routes requests to appropriate handlers based on path

const { securityMiddleware, logNotFound } = require('../handlers/_lib/security');
const { cleanupRateLimitLogs } = require('../handlers/_lib/rateLimit');

// Nettoyage périodique (1 chance sur 20 par requête)
if (Math.random() < 0.05) cleanupRateLimitLogs().catch(() => {});

// Timeout sur les handlers pour éviter les attaques Slowloris / connexions pendantes
const HANDLER_TIMEOUT_MS = 15000;
function withTimeout(fn, req, res) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) res.status(503).json({ error: 'Service unavailable' });
      resolve();
    }, HANDLER_TIMEOUT_MS);
    Promise.resolve(fn(req, res))
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

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
const manifestHandler = require('../handlers/manifest');
const forgotPasswordHandler = require('../handlers/forgot-password');
const resetPasswordHandler = require('../handlers/reset-password');
const storiesHandler = require('../handlers/stories');
const sitemapHandler = require('../handlers/sitemap');

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
  '/api/manifest.json': manifestHandler,
  '/api/forgot-password': forgotPasswordHandler,
  '/api/reset-password': resetPasswordHandler,
  '/api/stories': storiesHandler,
  '/api/sitemap.js': sitemapHandler,
  '/api/security-logs': securityLogsHandler,
};

module.exports = async (req, res) => {
  // Security headers sur toutes les réponses API
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.removeHeader('X-Powered-By');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // ── SECURITY MIDDLEWARE ──────────────────────────────────
  // Injecter pathname dans req.url pour que le middleware puisse l'analyser
  const blocked = await securityMiddleware(req, res);
  if (blocked) return;
  
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
      await withTimeout(handler, req, res);
    } catch (error) {
      console.error(`Error in handler for ${pathname}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  } else {
    // Log 404 pour la détection de fuzzing, sans exposer les routes
    await logNotFound(req);
    res.status(404).json({ error: 'Not found' });
  }
};
