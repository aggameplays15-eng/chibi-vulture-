// Rate limiting — DB-backed pour fonctionner sur Vercel (multi-instances)
// Protection renforcée contre DoS/DDoS : sliding window + burst detection + backoff progressif

const db = require('./db');

// ─── LIMITES PAR TYPE ────────────────────────────────────────
const RATE_LIMITS = {
  login:              { maxRequests: 10,  windowMs: 15 * 60 * 1000, burstMax: 5,  burstWindowMs: 10 * 1000 },
  signup:             { maxRequests: 10,  windowMs: 15 * 60 * 1000, burstMax: 4,  burstWindowMs: 30 * 1000 },
  'admin-login':      { maxRequests: 10,  windowMs: 15 * 60 * 1000, burstMax: 5,  burstWindowMs: 10 * 1000 },
  search:             { maxRequests: 30,  windowMs: 60 * 1000,       burstMax: 10, burstWindowMs: 5  * 1000 },
  default:            { maxRequests: 100, windowMs: 60 * 1000,       burstMax: 30, burstWindowMs: 5  * 1000 },
};

// Durées de ban progressives selon le nombre de violations (en ms)
const BAN_ESCALATION = [
  5  * 60 * 1000,   // 1ère violation → 5 min
  30 * 60 * 1000,   // 2ème → 30 min
  2  * 60 * 60 * 1000, // 3ème → 2h
  24 * 60 * 60 * 1000, // 4ème+ → 24h
];

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

// Récupère le nombre de violations passées pour escalader le ban
async function getViolationCount(ip, type) {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*) as cnt FROM rate_limit_violations
       WHERE ip = $1 AND type = $2 AND created_at > NOW() - INTERVAL '24 hours'`,
      [ip, type]
    );
    return parseInt(rows[0]?.cnt || 0, 10);
  } catch {
    return 0;
  }
}

async function recordViolation(ip, type) {
  try {
    await db.query(
      `INSERT INTO rate_limit_violations (ip, type, created_at) VALUES ($1, $2, NOW())`,
      [ip, type]
    );
  } catch {
    // Fail silently
  }
}

async function rateLimit(req, type = 'default') {
  const config = RATE_LIMITS[type] || RATE_LIMITS.default;
  const ip = getClientIp(req);
  const key = `${type}:${ip}`;
  const windowStart = new Date(Date.now() - config.windowMs);
  const burstWindowStart = new Date(Date.now() - config.burstWindowMs);

  try {
    // Enregistrer la requête courante
    await db.query(
      `INSERT INTO rate_limit_log (key, ip, type, created_at) VALUES ($1, $2, $3, NOW())`,
      [key, ip, type]
    );

    // Sliding window — compte sur la fenêtre principale
    const { rows: windowRows } = await db.query(
      `SELECT COUNT(*) as cnt FROM rate_limit_log
       WHERE key = $1 AND created_at > $2`,
      [key, windowStart]
    );
    const windowCount = parseInt(windowRows[0].cnt, 10);

    // Burst detection — compte sur la fenêtre courte
    const { rows: burstRows } = await db.query(
      `SELECT COUNT(*) as cnt FROM rate_limit_log
       WHERE key = $1 AND created_at > $2`,
      [key, burstWindowStart]
    );
    const burstCount = parseInt(burstRows[0].cnt, 10);

    const windowExceeded = windowCount > config.maxRequests;
    const burstExceeded  = burstCount  > config.burstMax;
    const allowed = !windowExceeded && !burstExceeded;

    if (!allowed) {
      // Enregistrer la violation et calculer le ban progressif
      await recordViolation(ip, type);
      const violations = await getViolationCount(ip, type);
      const banIndex = Math.min(violations - 1, BAN_ESCALATION.length - 1);
      const banDurationMs = BAN_ESCALATION[Math.max(0, banIndex)];

      // Auto-ban si dépassement répété (>= 2 violations)
      if (violations >= 2) {
        try {
          const { banIp } = require('./security');
          await banIp(ip, `Rate limit exceeded (${type}) — violation #${violations}`, banDurationMs);
        } catch {
          // security module peut ne pas être dispo
        }
      }

      const retryAfter = Math.ceil((burstExceeded ? config.burstWindowMs : config.windowMs) / 1000);
      const remaining = 0;

      return {
        allowed: false,
        limit: config.maxRequests,
        remaining,
        resetInSeconds: retryAfter,
        burstExceeded,
        violations,
        headers: {
          'X-RateLimit-Limit':     String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(retryAfter),
          'Retry-After':           String(retryAfter),
        }
      };
    }

    const remaining = Math.max(0, config.maxRequests - windowCount);
    const resetInSeconds = Math.ceil(config.windowMs / 1000);

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining,
      resetInSeconds,
      burstExceeded: false,
      headers: {
        'X-RateLimit-Limit':     String(config.maxRequests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset':     String(resetInSeconds),
      }
    };

  } catch {
    // FAIL CLOSED — si la DB est down, on bloque par sécurité (prod ET dev)
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetInSeconds: 60,
      headers: {
        'X-RateLimit-Limit':     String(config.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset':     '60',
        'Retry-After':           '60',
      }
    };
  }
}

// Nettoyage périodique des vieilles entrées (à appeler depuis un cron ou au démarrage)
async function cleanupRateLimitLogs() {
  try {
    await db.query(`DELETE FROM rate_limit_log WHERE created_at < NOW() - INTERVAL '2 hours'`);
    await db.query(`DELETE FROM rate_limit_violations WHERE created_at < NOW() - INTERVAL '48 hours'`);
  } catch {
    // Fail silently
  }
}

module.exports = { rateLimit, cleanupRateLimitLogs };
