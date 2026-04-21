// Rate limiting — DB-backed pour fonctionner sur Vercel (multi-instances)
// Utilise PostgreSQL comme store partagé au lieu de la mémoire locale
const db = require('./db');

const RATE_LIMITS = {
  login:        { maxRequests: 5,   windowMs: 15 * 60 * 1000 }, // 5 / 15min
  signup:       { maxRequests: 3,   windowMs: 60 * 60 * 1000 }, // 3 / heure
  'admin-login':{ maxRequests: 3,   windowMs: 15 * 60 * 1000 }, // 3 / 15min (plus strict)
  default:      { maxRequests: 100, windowMs: 60 * 1000 },       // 100 / min
};

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function rateLimit(req, type = 'default') {
  const config = RATE_LIMITS[type] || RATE_LIMITS.default;
  const ip = getClientIp(req);
  const key = `${type}:${ip}`;
  const windowStart = new Date(Date.now() - config.windowMs);

  try {
    await db.query(
      `INSERT INTO rate_limit_log (key, created_at) VALUES ($1, NOW())`,
      [key]
    );

    const { rows } = await db.query(
      `SELECT COUNT(*) as cnt FROM rate_limit_log WHERE key = $1 AND created_at > $2`,
      [key, windowStart]
    );

    const count = parseInt(rows[0].cnt, 10);
    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);
    const resetInSeconds = Math.ceil(config.windowMs / 1000);

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetInSeconds,
      headers: {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(resetInSeconds),
      }
    };
  } catch {
    // FAIL CLOSED en production — si la DB est down, on bloque par sécurité
    const isProd = process.env.NODE_ENV === 'production';
    return {
      allowed: !isProd,
      limit: config.maxRequests,
      remaining: isProd ? 0 : config.maxRequests,
      resetInSeconds: 60,
      headers: {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': isProd ? '0' : String(config.maxRequests),
        'X-RateLimit-Reset': '60',
      }
    };
  }
}

module.exports = { rateLimit };
