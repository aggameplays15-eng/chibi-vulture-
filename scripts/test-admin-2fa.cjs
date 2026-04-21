// ============================================================
// TEST SUITE — Admin 2FA (Double Authentification)
// node scripts/test-admin-2fa.cjs
// ============================================================
require('dotenv').config();
const http = require('http');
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
let passed = 0;
let failed = 0;

// ── Helpers ──────────────────────────────────────────────────

function req(path, method, body = null, headers = {}) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000,
      path, method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
        'Content-Length': payload ? Buffer.byteLength(payload) : 0,
        ...headers,
      },
    };
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let json = {};
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, body: json });
      });
    });
    r.on('error', e => resolve({ status: 0, error: e.message }));
    if (payload) r.write(payload);
    r.end();
  });
}

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS — ${name}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL — ${name}${detail ? ' → ' + detail : ''}`);
    failed++;
  }
}

// Récupère le dernier OTP non utilisé depuis la DB (simule la réception email)
async function getLatestOtp() {
  const { rows } = await pool.query(
    `SELECT code_hash FROM admin_otp WHERE used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`
  );
  return rows[0]?.code_hash || null;
}

// Brute-force le code à partir du hash (6 chiffres = 900000 possibilités max, mais on cherche juste le bon)
async function findCodeByHash(hash) {
  // On génère tous les codes possibles et on compare le hash
  for (let i = 100000; i <= 999999; i++) {
    const h = crypto.createHash('sha256').update(String(i)).digest('hex');
    if (h === hash) return String(i);
  }
  return null;
}

async function cleanOtps() {
  await pool.query(`UPDATE admin_otp SET used = TRUE`);
}

async function clearBans() {
  await pool.query('DELETE FROM ip_bans');
  // Pequeño delay para que el servidor procese el cambio en DB
  await new Promise(r => setTimeout(r, 300));
}

// Wrapper que limpia el ban antes de cada request
async function reqClean(path, method, body = null, headers = {}) {
  await clearBans();
  return req(path, method, body, headers);
}

// ── Tests ─────────────────────────────────────────────────────

async function run() {
  console.log('\n══════════════════════════════════════════');
  console.log('  ADMIN 2FA TEST SUITE');
  console.log('══════════════════════════════════════════\n');

  let r;

  // ── 1. STEP 1 — Mauvaises credentials ───────────────────
  console.log('[ STEP 1 — Credentials ]');

  r = await reqClean('/api/admin-login', 'POST', { email: 'wrong@test.com', password: 'badpass' });
  check('Mauvais email → 401', r.status === 401);

  r = await reqClean('/api/admin-login', 'POST', { email: process.env.ADMIN_EMAIL, password: 'wrongpassword' });
  check('Bon email, mauvais password → 401', r.status === 401);

  r = await reqClean('/api/admin-login', 'POST', {});
  check('Body vide → 400', r.status === 400);

  r = await reqClean('/api/admin-login', 'POST', { email: process.env.ADMIN_EMAIL });
  check('Password manquant → 400', r.status === 400);

  // ── 2. STEP 1 — Bonnes credentials → OTP requis ─────────
  console.log('\n[ STEP 1 — Bonnes credentials ]');

  await cleanOtps();
  r = await reqClean('/api/admin-login', 'POST', {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  check('Bonnes credentials → 200', r.status === 200);
  check('Réponse contient otpRequired: true', r.body?.otpRequired === true);
  check('Pas de token JWT dans la réponse step 1', !r.body?.token);

  // ── 3. OTP stocké en DB ──────────────────────────────────
  console.log('\n[ OTP en base de données ]');

  const otpHash = await getLatestOtp();
  check('OTP créé en DB', !!otpHash);

  // ── 4. STEP 2 — Mauvais codes ────────────────────────────
  console.log('\n[ STEP 2 — Codes invalides ]');

  r = await reqClean('/api/admin-verify-otp', 'POST', { code: '000000' });
  check('Code incorrect → 401', r.status === 401);

  r = await reqClean('/api/admin-verify-otp', 'POST', { code: '' });
  check('Code vide → 400', r.status === 400);

  r = await reqClean('/api/admin-verify-otp', 'POST', {});
  check('Body sans code → 400', r.status === 400);

  r = await reqClean('/api/admin-verify-otp', 'POST', { code: '12345' }); // 5 chiffres
  check('Code trop court → 401', r.status === 401);

  // ── 5. STEP 2 — Bon code ─────────────────────────────────
  console.log('\n[ STEP 2 — Bon code ]');

  // Retrouver le vrai code depuis le hash (test uniquement)
  let realCode = null;
  if (otpHash) {
    console.log('  ⏳ Recherche du code par hash (peut prendre quelques secondes)...');
    realCode = await findCodeByHash(otpHash);
  }

  if (realCode) {
    r = await reqClean('/api/admin-verify-otp', 'POST', { code: realCode });
    check('Bon code → 200', r.status === 200);
    check('Réponse contient token JWT', typeof r.body?.token === 'string' && r.body.token.length > 20);
    check('Réponse contient user.role = Admin', r.body?.user?.role === 'Admin');
    check('Réponse contient user.email', r.body?.user?.email === process.env.ADMIN_EMAIL);

    // ── 6. Rejeu du même code (usage unique) ────────────────
    console.log('\n[ Usage unique — Rejeu ]');
    r = await reqClean('/api/admin-verify-otp', 'POST', { code: realCode });
    check('Code déjà utilisé → 401', r.status === 401);
  } else {
    console.log('  ⚠️  Code introuvable (hash non résolu) — tests step 2 ignorés');
  }

  // ── 7. OTP expiré ────────────────────────────────────────
  console.log('\n[ OTP expiré ]');

  // Insérer un OTP expiré manuellement
  const expiredHash = crypto.createHash('sha256').update('123456').digest('hex');
  await pool.query(
    `INSERT INTO admin_otp (code_hash, expires_at, used) VALUES ($1, NOW() - INTERVAL '1 minute', FALSE)`,
    [expiredHash]
  );
  r = await reqClean('/api/admin-verify-otp', 'POST', { code: '123456' });
  check('OTP expiré → 401', r.status === 401);

  // ── 8. Rate limiting ─────────────────────────────────────
  console.log('\n[ Rate Limiting ]');

  await clearBans();
  await pool.query(`DELETE FROM rate_limit_log WHERE key LIKE 'admin-login%'`).catch(() => {});

  let rateLimited = false;
  for (let i = 0; i < 12; i++) {
    const res = await req('/api/admin-login', 'POST', { email: 'x@x.com', password: 'bad' });
    if (res.status === 429) { rateLimited = true; break; }
  }
  check('Rate limit déclenché après trop de tentatives', rateLimited);

  // ── 9. Méthodes HTTP ─────────────────────────────────────
  console.log('\n[ Méthodes HTTP ]');

  r = await reqClean('/api/admin-login', 'GET');
  check('GET /api/admin-login → 405', r.status === 405);

  r = await reqClean('/api/admin-verify-otp', 'GET');
  check('GET /api/admin-verify-otp → 405', r.status === 405);

  // ── Résultat ─────────────────────────────────────────────
  await pool.end();

  console.log('\n══════════════════════════════════════════');
  console.log(`  RÉSULTAT: ${passed} ✅ PASS  |  ${failed} ❌ FAIL`);
  console.log('══════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
