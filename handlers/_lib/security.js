// ============================================================
// SECURITY MIDDLEWARE — Protection contre les outils de pentest
// curl, Burp Suite, sqlmap, nikto, dirbuster, etc.
// ============================================================

const db = require('./db');
const crypto = require('crypto');

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
  /ab\//i,           // Apache Bench
  /siege\//i,
  /wrk\//i,
  /hey\//i,
  /vegeta/i,
  /^-$/,             // UA vide ou tiret
];

// ─── 2. PAYLOAD MALVEILLANT — SQLi / XSS / Path Traversal ──
const MALICIOUS_PATTERNS = [
  // SQL Injection
  /(\bUNION\b.*\bSELECT\b|\bSELECT\b.*\bFROM\b|\bDROP\b.*\bTABLE\b|\bINSERT\b.*\bINTO\b|\bDELETE\b.*\bFROM\b)/i,
  /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?|\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
  /(--|#|\/\*|\*\/|xp_|sp_|exec\s*\(|execute\s*\()/i,
  /(\bCAST\b\s*\(|\bCONVERT\b\s*\(|\bCHAR\b\s*\(|\bCONCAT\b\s*\()/i,
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

// ─── 3. HONEYPOT ROUTES — pièges pour scanners ─────────────
const HONEYPOT_PATHS = [
  '/api/admin/config',
  '/api/admin/env',
  '/api/admin/debug',
  '/api/admin/backup',
  '/api/admin/shell',
  '/api/admin/cmd',
  '/api/admin/exec',
  '/api/admin/eval',
  '/api/config',
  '/api/env',
  '/api/debug',
  '/api/test',
  '/api/backup',
  '/api/phpinfo',
  '/api/.env',
  '/api/wp-admin',
  '/api/wp-login',
  '/api/phpmyadmin',
  '/api/adminer',
  '/api/console',
  '/api/shell',
  '/api/cmd',
  '/api/exec',
  '/api/eval',
  '/api/v0',
  '/api/v99',
  '/api/swagger',
  '/api/graphql',
  '/api/introspect',
  '/.git/config',
  '/etc/passwd',
  '/proc/self/environ',
];

// ─── 4. HELPERS ─────────────────────────────────────────────
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function getUA(req) {
  return req.headers['user-agent'] || '';
}

// Log une tentative suspecte en DB (non-bloquant)
async function logThreat(ip, type, detail, req) {
  try {
    await db.query(
      `INSERT INTO security_log (ip, threat_type, detail, path, method, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,
      [ip, type, detail.substring(0, 500), req.url || '', req.method || '', getUA(req).substring(0, 300)]
    );
  } catch {
    // Fail silently — ne pas bloquer la réponse pour un log raté
  }
}

// Bannir une IP temporairement (1 heure par défaut)
async function banIp(ip, reason, durationMs = 60 * 60 * 1000) {
  try {
    const expiresAt = new Date(Date.now() + durationMs);
    await db.query(
      `INSERT INTO ip_bans (ip, reason, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (ip) DO UPDATE SET reason = $2, expires_at = $3`,
      [ip, reason.substring(0, 200), expiresAt]
    );
  } catch {
    // Fail silently
  }
}

// Vérifier si une IP est bannie
async function isIpBanned(ip) {
  try {
    const { rows } = await db.query(
      `SELECT 1 FROM ip_bans WHERE ip = $1 AND expires_at > NOW()`,
      [ip]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

// ─── 5. SCAN DETECTOR — détecte les scans d'endpoints ──────
async function detectScan(ip) {
  try {
    const windowStart = new Date(Date.now() - 60 * 1000); // 1 minute
    const { rows } = await db.query(
      `SELECT COUNT(DISTINCT path) as cnt FROM security_log
       WHERE ip = $1 AND created_at > $2`,
      [ip, windowStart]
    );
    const distinctPaths = parseInt(rows[0]?.cnt || 0, 10);
    // Plus de 15 paths différents en 1 minute = scan
    return distinctPaths >= 15;
  } catch {
    return false;
  }
}

// ─── 6. MIDDLEWARE PRINCIPAL ────────────────────────────────
async function securityMiddleware(req, res) {
  const ip = getClientIp(req);
  const ua = getUA(req);
  const path = req.url || '';
  const method = req.method || 'GET';

  // 6a. Vérifier ban IP
  const banned = await isIpBanned(ip);
  if (banned) {
    res.status(403).json({ error: 'Access denied' });
    return true; // bloqué
  }

  // 6b. Honeypot — toute requête sur ces paths = ban immédiat
  const isHoneypot = HONEYPOT_PATHS.some(p => path.toLowerCase().startsWith(p.toLowerCase()));
  if (isHoneypot) {
    await logThreat(ip, 'HONEYPOT', `Hit honeypot: ${path}`, req);
    await banIp(ip, `Honeypot hit: ${path}`, 24 * 60 * 60 * 1000); // 24h
    res.status(404).json({ error: 'Not found' });
    return true;
  }

  // 6c. User-Agent bloqué
  const isBlockedUA = BLOCKED_UA_PATTERNS.some(p => p.test(ua));
  if (isBlockedUA && process.env.NODE_ENV === 'production') {
    await logThreat(ip, 'BLOCKED_UA', `Blocked UA: ${ua}`, req);
    // Pas de ban immédiat — juste bloquer la requête
    res.status(403).json({ error: 'Access denied' });
    return true;
  }

  // 6d. Payload malveillant — scanner le body, query, et URL
  const toScan = [
    path,
    JSON.stringify(req.body || {}),
    JSON.stringify(req.query || {}),
  ].join(' ');

  const isMalicious = MALICIOUS_PATTERNS.some(p => p.test(toScan));
  if (isMalicious) {
    await logThreat(ip, 'MALICIOUS_PAYLOAD', `Suspicious payload on ${path}`, req);
    await banIp(ip, 'Malicious payload detected', 2 * 60 * 60 * 1000); // 2h
    res.status(400).json({ error: 'Invalid request' });
    return true;
  }

  // 6e. Détection de scan (trop de paths différents)
  const isScanning = await detectScan(ip);
  if (isScanning) {
    await logThreat(ip, 'SCAN_DETECTED', 'Endpoint scanning detected', req);
    await banIp(ip, 'Endpoint scanning', 60 * 60 * 1000); // 1h
    res.status(429).json({ error: 'Too many requests' });
    return true;
  }

  // 6f. Méthodes HTTP non standard
  const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  if (!ALLOWED_METHODS.includes(method.toUpperCase())) {
    await logThreat(ip, 'INVALID_METHOD', `Method: ${method}`, req);
    res.status(405).json({ error: 'Method not allowed' });
    return true;
  }

  // 6g. Taille de body excessive (protection DoS)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 1 * 1024 * 1024) { // 1MB max
    await logThreat(ip, 'LARGE_PAYLOAD', `Content-Length: ${contentLength}`, req);
    res.status(413).json({ error: 'Payload too large' });
    return true;
  }

  return false; // pas bloqué
}

// ─── 7. MIDDLEWARE ERREURS 401/403 — auto-ban après abus ───
async function trackAuthFailure(req) {
  const ip = getClientIp(req);
  try {
    const windowStart = new Date(Date.now() - 10 * 60 * 1000); // 10 min
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

module.exports = {
  securityMiddleware,
  logAuthFailure,
  banIp,
  isIpBanned,
  getClientIp,
  HONEYPOT_PATHS,
};
