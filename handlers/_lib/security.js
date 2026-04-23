// ============================================================
// SECURITY MIDDLEWARE — Protection anti-pentest + DoS/DDoS
// ============================================================

const db = require('./db');

// ─── 1. USER-AGENT BLACKLIST ────────────────────────────────
const BLOCKED_UA_PATTERNS = [
  /curl\//i,
  /wget\//i,
  /python-requests\//i,
  /python-urllib\//i,
  /go-http-client\//i,
  /java\//i,
  /libwww-perl\//i,
  /nikto/i,
  /sqlmap/i,
  /nmap/i,
  /masscan/i,
  /dirbuster/i,
  /dirb\//i,
  /gobuster/i,
  /wfuzz/i,
  /hydra/i,
  /medusa/i,
  /burpsuite/i,
  /burp\s/i,
  /owasp/i,
  /zap\//i,
  /zaproxy/i,
  /nuclei/i,
  /metasploit/i,
  /nessus/i,
  /openvas/i,
  /acunetix/i,
  /appscan/i,
  /w3af/i,
  /skipfish/i,
  /arachni/i,
  /havij/i,
  /httperf/i,
  /ab\//i,
  /siege\//i,
  /wrk\//i,
  /hey\//i,
  /vegeta/i,
  /^-$/,
  /^$/,           // UA complètement vide
  /flood/i,
  /stress/i,
  /ddos/i,
  /loic/i,        // Low Orbit Ion Cannon
  /hoic/i,        // High Orbit Ion Cannon
  /slowloris/i,
  /r-u-dead-yet/i,
  /torshammer/i,
];

// ─── 2. PAYLOAD MALVEILLANT ─────────────────────────────────
const MALICIOUS_PATTERNS = [
  // SQL Injection (plus spécifique pour éviter les faux positifs dans le texte normal)
  /(\bUNION\s+ALL\s+SELECT\b|\bDROP\s+TABLE\b|\bTRUNCATE\s+TABLE\b|\bDELETE\s+FROM\s+.*\s+WHERE\b)/i,
  /(\w+['"]\s+OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
  /(--|\/\*|\*\/|xp_cmdshell|exec\s*\(|execute\s*\()/i,

  // XSS
  /(<script[\s>]|<\/script>|javascript:|vbscript:|on\w+\s*=)/i,
  /(document\.cookie|document\.write|window\.location|eval\s*\(|setTimeout\s*\(|setInterval\s*\()/i,
  // Path Traversal
  /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f)/i,
  // Command Injection
  /([;&|`$]\s*(ls|cat|pwd|whoami|id|uname|wget|curl|bash|sh|cmd|powershell))/i,
  // SSRF
  /(file:\/\/|dict:\/\/|gopher:\/\/|ldap:\/\/|ftp:\/\/)/i,
];

// ─── 3. HONEYPOT ROUTES ─────────────────────────────────────
const HONEYPOT_PATHS = [
  '/api/admin/config', '/api/admin/env', '/api/admin/debug',
  '/api/admin/backup', '/api/admin/shell', '/api/admin/cmd',
  '/api/admin/exec', '/api/admin/eval',
  '/api/config', '/api/env', '/api/debug', '/api/test',
  '/api/backup', '/api/phpinfo', '/api/.env',
  '/api/wp-admin', '/api/wp-login', '/api/phpmyadmin',
  '/api/adminer', '/api/console', '/api/shell',
  '/api/cmd', '/api/exec', '/api/eval',
  '/api/v0', '/api/v99', '/api/swagger',
  '/api/graphql', '/api/introspect',
  '/.git/config', '/etc/passwd', '/proc/self/environ',
];

// ─── 4. SEUILS DoS/DDoS ─────────────────────────────────────
const DOS_THRESHOLDS = {
  // Requêtes totales par IP sur 10 secondes → flood
  floodRequestsPerWindow: 50,
  floodWindowMs: 10 * 1000,

  // Requêtes totales par IP sur 1 minute → DDoS soutenu
  sustainedRequestsPerWindow: 200,
  sustainedWindowMs: 60 * 1000,

  // Paths distincts en 1 minute → scan d'endpoints
  scanDistinctPaths: 15,
  scanWindowMs: 60 * 1000,

  // Erreurs 4xx consécutives → fuzzing/brute-force
  errorThreshold: 20,
  errorWindowMs: 5 * 60 * 1000,
};

// Durées de ban DoS (progressives)
const DOS_BAN_DURATIONS = {
  flood:     2  * 60 * 60 * 1000,  // flood → 2h
  sustained: 6  * 60 * 60 * 1000,  // DDoS soutenu → 6h
  scan:      1  * 60 * 60 * 1000,  // scan → 1h
  error:     30 * 60 * 1000,        // fuzzing → 30min
};

// ─── 5. HELPERS ─────────────────────────────────────────────
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function getUA(req) {
  return req.headers['user-agent'] || '';
}

async function logThreat(ip, type, detail, req) {
  try {
    await db.query(
      `INSERT INTO security_log (ip, threat_type, detail, path, method, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,
      [ip, type, detail.substring(0, 500), req.url || '', req.method || '', getUA(req).substring(0, 300)]
    );
  } catch {
    // Fail silently
  }
}

async function banIp(ip, reason, durationMs = 60 * 60 * 1000) {
  try {
    const expiresAt = new Date(Date.now() + durationMs);
    await db.query(
      `INSERT INTO ip_bans (ip, reason, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (ip) DO UPDATE
         SET reason = EXCLUDED.reason,
             expires_at = GREATEST(ip_bans.expires_at, EXCLUDED.expires_at)`,
      [ip, reason.substring(0, 200), expiresAt]
    );
  } catch {
    // Fail silently
  }
}

async function isIpBanned(ip) {
  try {
    const { rows } = await db.query(
      `SELECT expires_at FROM ip_bans WHERE ip = $1 AND expires_at > NOW()`,
      [ip]
    );
    return rows.length > 0 ? rows[0].expires_at : null;
  } catch {
    return null;
  }
}

// ─── 6. DÉTECTEURS DoS/DDoS ─────────────────────────────────

// Flood : trop de requêtes en très peu de temps (burst)
async function detectFlood(ip) {
  try {
    const windowStart = new Date(Date.now() - DOS_THRESHOLDS.floodWindowMs);
    const { rows } = await db.query(
      `SELECT COUNT(*) as cnt FROM rate_limit_log
       WHERE ip = $1 AND created_at > $2`,
      [ip, windowStart]
    );
    return parseInt(rows[0]?.cnt || 0, 10) >= DOS_THRESHOLDS.floodRequestsPerWindow;
  } catch {
    return false;
  }
}

// DDoS soutenu : volume élevé sur une fenêtre plus longue
async function detectSustainedDDoS(ip) {
  try {
    const windowStart = new Date(Date.now() - DOS_THRESHOLDS.sustainedWindowMs);
    const { rows } = await db.query(
      `SELECT COUNT(*) as cnt FROM rate_limit_log
       WHERE ip = $1 AND created_at > $2`,
      [ip, windowStart]
    );
    return parseInt(rows[0]?.cnt || 0, 10) >= DOS_THRESHOLDS.sustainedRequestsPerWindow;
  } catch {
    return false;
  }
}

// Scan d'endpoints : trop de paths distincts
async function detectScan(ip) {
  try {
    const windowStart = new Date(Date.now() - DOS_THRESHOLDS.scanWindowMs);
    const { rows } = await db.query(
      `SELECT COUNT(DISTINCT path) as cnt FROM security_log
       WHERE ip = $1 AND created_at > $2`,
      [ip, windowStart]
    );
    return parseInt(rows[0]?.cnt || 0, 10) >= DOS_THRESHOLDS.scanDistinctPaths;
  } catch {
    return false;
  }
}

// Fuzzing : trop d'erreurs 4xx
async function detectFuzzing(ip) {
  try {
    const windowStart = new Date(Date.now() - DOS_THRESHOLDS.errorWindowMs);
    const { rows } = await db.query(
      `SELECT COUNT(*) as cnt FROM security_log
       WHERE ip = $1 AND threat_type IN ('NOT_FOUND', 'AUTH_FAILURE', 'MALICIOUS_PAYLOAD')
         AND created_at > $2`,
      [ip, windowStart]
    );
    return parseInt(rows[0]?.cnt || 0, 10) >= DOS_THRESHOLDS.errorThreshold;
  } catch {
    return false;
  }
}

// ─── 7. MIDDLEWARE PRINCIPAL ─────────────────────────────────
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

async function securityMiddleware(req, res) {
  const ip = getClientIp(req);
  const ua = getUA(req);
  const path = req.url || '';
  const method = req.method || 'GET';

  // Tentative de récupération du rôle admin via le token (pour bypasser les blocages)
  let isAdmin = false;
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = jwt.verify(authHeader.slice(7), SECRET);
      if (decoded?.role === 'Admin') isAdmin = true;
    }
  } catch { /* ignored */ }

  // 7a. Vérifier ban IP (Bypass possible pour l'IP de l'admin si nécessaire, mais risqué)
  const bannedUntil = await isIpBanned(ip);
  if (bannedUntil && !isAdmin) {
    const retryAfter = Math.ceil((new Date(bannedUntil) - Date.now()) / 1000);
    res.setHeader('Retry-After', String(Math.max(0, retryAfter)));
    res.status(403).json({ error: 'Access denied' });
    return true;
  }


  // 7b. Honeypot — ban immédiat 24h
  const isHoneypot = HONEYPOT_PATHS.some(p => path.toLowerCase().startsWith(p.toLowerCase()));
  if (isHoneypot) {
    await logThreat(ip, 'HONEYPOT', `Hit honeypot: ${path}`, req);
    await banIp(ip, `Honeypot hit: ${path}`, 24 * 60 * 60 * 1000);
    res.status(404).json({ error: 'Not found' });
    return true;
  }

  // 7c. User-Agent bloqué
  const isBlockedUA = BLOCKED_UA_PATTERNS.some(p => p.test(ua));
  if (isBlockedUA && process.env.NODE_ENV === 'production') {
    await logThreat(ip, 'BLOCKED_UA', `Blocked UA: ${ua}`, req);
    res.status(403).json({ error: 'Access denied' });
    return true;
  }

  // 7d. Payload malveillant
  const toScan = [
    path,
    JSON.stringify(req.body || {}),
    JSON.stringify(req.query || {}),
  ].join(' ');

  const isMalicious = !isAdmin && MALICIOUS_PATTERNS.some(p => p.test(toScan));
  if (isMalicious) {
    await logThreat(ip, 'MALICIOUS_PAYLOAD', `Suspicious payload on ${path}`, req);
    await banIp(ip, 'Malicious payload detected', 2 * 60 * 60 * 1000);
    res.status(400).json({ error: 'Invalid request' });
    return true;
  }

  // 7e. Méthodes HTTP non standard
  const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  if (!ALLOWED_METHODS.includes(method.toUpperCase())) {
    await logThreat(ip, 'INVALID_METHOD', `Method: ${method}`, req);
    res.status(405).json({ error: 'Method not allowed' });
    return true;
  }

  // 7f. Taille de body excessive (10MB pour les admins, 1MB pour les autres)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const limit = isAdmin ? 10 * 1024 * 1024 : 1 * 1024 * 1024;
  if (contentLength > limit) {
    await logThreat(ip, 'LARGE_PAYLOAD', `Content-Length: ${contentLength}`, req);
    res.status(413).json({ error: 'Payload too large' });
    return true;
  }

  // 7g. Bypass DoS pour les admins
  if (isAdmin) return false;


  // 7g. Détection flood (DoS burst)
  const isFlooding = await detectFlood(ip);
  if (isFlooding) {
    await logThreat(ip, 'DOS_FLOOD', `Flood detected: ${path}`, req);
    await banIp(ip, 'DoS flood detected', DOS_BAN_DURATIONS.flood);
    res.setHeader('Retry-After', String(DOS_BAN_DURATIONS.flood / 1000));
    res.status(429).json({ error: 'Too many requests' });
    return true;
  }

  // 7h. Détection DDoS soutenu
  const isSustained = await detectSustainedDDoS(ip);
  if (isSustained) {
    await logThreat(ip, 'DDOS_SUSTAINED', `Sustained DDoS from ${ip}`, req);
    await banIp(ip, 'Sustained DDoS detected', DOS_BAN_DURATIONS.sustained);
    res.setHeader('Retry-After', String(DOS_BAN_DURATIONS.sustained / 1000));
    res.status(429).json({ error: 'Too many requests' });
    return true;
  }

  // 7i. Détection scan d'endpoints
  const isScanning = await detectScan(ip);
  if (isScanning) {
    await logThreat(ip, 'SCAN_DETECTED', 'Endpoint scanning detected', req);
    await banIp(ip, 'Endpoint scanning', DOS_BAN_DURATIONS.scan);
    res.setHeader('Retry-After', String(DOS_BAN_DURATIONS.scan / 1000));
    res.status(429).json({ error: 'Too many requests' });
    return true;
  }

  // 7j. Détection fuzzing (trop d'erreurs)
  const isFuzzing = await detectFuzzing(ip);
  if (isFuzzing) {
    await logThreat(ip, 'FUZZING_DETECTED', 'Fuzzing/brute-force detected', req);
    await banIp(ip, 'Fuzzing detected', DOS_BAN_DURATIONS.error);
    res.setHeader('Retry-After', String(DOS_BAN_DURATIONS.error / 1000));
    res.status(429).json({ error: 'Too many requests' });
    return true;
  }

  return false; // pas bloqué
}

// ─── 8. SUIVI DES ÉCHECS D'AUTH ──────────────────────────────
async function trackAuthFailure(req) {
  const ip = getClientIp(req);
  try {
    const windowStart = new Date(Date.now() - 10 * 60 * 1000);
    const { rows } = await db.query(
      `SELECT COUNT(*) as cnt FROM security_log
       WHERE ip = $1 AND threat_type = 'AUTH_FAILURE' AND created_at > $2`,
      [ip, windowStart]
    );
    const count = parseInt(rows[0]?.cnt || 0, 10);
    if (count >= 10) {
      await banIp(ip, 'Too many auth failures', 2 * 60 * 60 * 1000);
    }
  } catch {
    // Fail silently
  }
}

async function logAuthFailure(req) {
  const ip = getClientIp(req);
  await logThreat(ip, 'AUTH_FAILURE', `Auth failure on ${req.url}`, req);
  await trackAuthFailure(req);
}

// Log une erreur 404 (pour la détection de fuzzing)
async function logNotFound(req) {
  const ip = getClientIp(req);
  await logThreat(ip, 'NOT_FOUND', `404 on ${req.url}`, req);
}

module.exports = {
  securityMiddleware,
  logAuthFailure,
  logNotFound,
  banIp,
  isIpBanned,
  getClientIp,
  HONEYPOT_PATHS,
};
