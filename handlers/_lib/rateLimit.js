// Simple in-memory rate limiting for API endpoints
// Note: In production with multiple instances, use Redis or similar

const rateLimits = new Map();

const RATE_LIMITS = {
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
  signup: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  default: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
};

function getClientId(req) {
  return req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
}

function rateLimit(req, type = 'default') {
  const config = RATE_LIMITS[type] || RATE_LIMITS.default;
  const clientId = getClientId(req);
  const key = `${type}:${clientId}`;
  
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Get or create client requests
  let clientRequests = rateLimits.get(key) || [];
  
  // Filter out old requests outside the window
  clientRequests = clientRequests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  const allowed = clientRequests.length < config.maxRequests;
  
  if (allowed) {
    clientRequests.push(now);
  }
  
  // Update storage
  rateLimits.set(key, clientRequests);
  
  // Calculate reset time
  const oldestRequest = clientRequests[0] || now;
  const resetInSeconds = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
  
  return {
    allowed,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - clientRequests.length),
    resetInSeconds: Math.max(0, resetInSeconds),
    headers: {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - clientRequests.length).toString(),
      'X-RateLimit-Reset': resetInSeconds.toString(),
    }
  };
}

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, requests] of rateLimits.entries()) {
    const oldestAllowed = now - (60 * 60 * 1000); // 1 hour
    const validRequests = requests.filter(ts => ts > oldestAllowed);
    if (validRequests.length === 0) {
      rateLimits.delete(key);
    } else {
      rateLimits.set(key, validRequests);
    }
  }
}, 10 * 60 * 1000);

module.exports = { rateLimit };
