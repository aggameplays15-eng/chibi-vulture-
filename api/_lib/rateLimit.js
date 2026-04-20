// Rate limiter for serverless functions.
// Uses in-memory storage by default. On Vercel, each cold start gets a fresh instance,
// so the in-memory map resets. For true persistence across instances, set REDIS_URL
// and the limiter will use Redis automatically.

let redisClient = null;

// Try to connect to Redis if REDIS_URL is set
if (process.env.REDIS_URL) {
  try {
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch(err => {
      console.warn('[RateLimit] Redis connection failed, falling back to in-memory:', err.message);
      redisClient = null;
    });
  } catch {
    // redis package not installed — fall back silently
    redisClient = null;
  }
}

const rateLimitMap = new Map();

const RATE_LIMITS = {
  login:  { max: 5,   windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  signup: { max: 3,   windowMs: 60 * 60 * 1000  }, // 3 attempts per hour
  api:    { max: 100, windowMs: 60 * 1000        }, // 100 requests per minute
};

// In-memory cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown';
}

async function rateLimitRedis(key, config) {
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / config.windowMs)}`;
  const count = await redisClient.incr(windowKey);
  if (count === 1) {
    await redisClient.pExpire(windowKey, config.windowMs);
  }
  const ttl = await redisClient.pTTL(windowKey);
  const resetInSeconds = Math.ceil(ttl / 1000);
  const remaining = Math.max(0, config.max - count);
  return {
    allowed: count <= config.max,
    limit: config.max,
    remaining,
    resetInSeconds,
    headers: {
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetInSeconds.toString(),
    },
  };
}

function rateLimitMemory(key, config) {
  const now = Date.now();
  let data = rateLimitMap.get(key);
  if (!data || now > data.resetTime) {
    data = { count: 1, resetTime: now + config.windowMs };
  } else {
    data.count++;
  }
  rateLimitMap.set(key, data);
  const remaining = Math.max(0, config.max - data.count);
  const resetInSeconds = Math.ceil((data.resetTime - now) / 1000);
  return {
    allowed: data.count <= config.max,
    limit: config.max,
    remaining,
    resetInSeconds,
    headers: {
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetInSeconds.toString(),
    },
  };
}

async function rateLimit(req, type = 'api') {
  const config = RATE_LIMITS[type] || RATE_LIMITS.api;
  const ip = getClientIp(req);
  const key = `${ip}:${type}`;

  if (redisClient?.isReady) {
    try {
      return await rateLimitRedis(key, config);
    } catch (err) {
      console.warn('[RateLimit] Redis error, falling back to in-memory:', err.message);
    }
  }

  return rateLimitMemory(key, config);
}

module.exports = { rateLimit };
