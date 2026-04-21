require('dotenv').config();
const http = require('http');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function req(path, method, body, ua) {
  return new Promise(resolve => {
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: { 'Origin': 'http://localhost:5173', 'Content-Type': 'application/json', ...(ua ? { 'User-Agent': ua } : {}) }
    };
    const r = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ s: res.statusCode, b: d }));
    });
    r.on('error', e => resolve({ s: 0, e: e.message }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

let p = 0, f = 0;
function chk(name, got, exp) {
  const ok = Array.isArray(exp) ? exp.includes(got) : got === exp;
  if (ok) { console.log('  ✅ PASS', name, '(' + got + ')'); p++; }
  else    { console.log('  ❌ FAIL', name, '→ got', got, 'expected', exp); f++; }
}
const clr = () => pool.query('DELETE FROM ip_bans');

async function main() {
  console.log('\n══════════════════════════════════════════');
  console.log('  SECURITY TEST SUITE');
  console.log('══════════════════════════════════════════');
  let r;

  console.log('\n[ HONEYPOTS ]');
  await clr(); r = await req('/api/.env', 'GET'); chk('Honeypot /api/.env → 404', r.s, 404);
  r = await req('/api/posts', 'GET'); chk('IP bannie apres honeypot → 403', r.s, 403);
  await clr(); r = await req('/api/wp-admin', 'GET'); chk('Honeypot /api/wp-admin', r.s, 404);
  await clr(); r = await req('/api/shell', 'GET'); chk('Honeypot /api/shell', r.s, 404);
  await clr(); r = await req('/api/debug', 'GET'); chk('Honeypot /api/debug', r.s, 404);
  await clr(); r = await req('/api/phpmyadmin', 'GET'); chk('Honeypot /api/phpmyadmin', r.s, 404);
  await clr(); r = await req('/.git/config', 'GET'); chk('Honeypot /.git/config', r.s, 404);

  console.log('\n[ SQL INJECTION ]');
  await clr(); r = await req('/api/login', 'POST', { email: "' OR 1=1--", password: 'x' }); chk("SQLi OR 1=1", r.s, 400);
  await clr(); r = await req('/api/login', 'POST', { email: 'x', password: "' UNION SELECT * FROM users--" }); chk("SQLi UNION SELECT", r.s, 400);
  await clr(); r = await req('/api/products?id=1%3B%20DROP%20TABLE%20users--', 'GET'); chk("SQLi DROP TABLE in URL", r.s, 400);

  console.log('\n[ XSS ]');
  await clr(); r = await req('/api/login', 'POST', { email: '<script>alert(1)</script>', password: 'x' }); chk("XSS <script>", r.s, 400);
  await clr(); r = await req('/api/posts?q=%3Cimg%20onerror%3Dalert(1)%3E', 'GET'); chk("XSS onerror in URL", r.s, 400);
  await clr(); r = await req('/api/login', 'POST', { email: 'x@x.com', password: 'javascript:alert(1)' }); chk("XSS javascript:", r.s, 400);

  console.log('\n[ PATH TRAVERSAL ]');
  await clr(); r = await req('/api/users?file=../../etc/passwd', 'GET'); chk("Path traversal ../../etc/passwd", r.s, 400);
  await clr(); r = await req('/api/users?path=%2e%2e%2fetc%2fpasswd', 'GET'); chk("Path traversal URL-encoded", r.s, 400);

  console.log('\n[ COMMAND INJECTION ]');
  await clr(); r = await req('/api/search?q=test%3B%20ls%20-la', 'GET'); chk("Cmd injection ; ls", r.s, 400);
  await clr(); r = await req('/api/search?q=%60whoami%60', 'GET'); chk("Cmd injection backtick", r.s, 400);

  console.log('\n[ METHODES HTTP ]');
  await clr(); r = await req('/api/login', 'TRACE'); chk("Methode TRACE bloquee", r.s, 405);

  console.log('\n[ USER-AGENT (dev) ]');
  await clr(); r = await req('/api/posts', 'GET', null, 'sqlmap/1.7'); chk("sqlmap UA en dev (non bloque)", r.s, [200, 401, 403, 404, 500]);
  console.log('    INFO: en NODE_ENV=production → retournerait 403');

  console.log('\n[ SSRF ]');
  await clr(); r = await req('/api/users?url=file%3A%2F%2F%2Fetc%2Fpasswd', 'GET'); chk("SSRF file://", r.s, 400);
  await clr(); r = await req('/api/users?url=gopher%3A%2F%2Finternal', 'GET'); chk("SSRF gopher://", r.s, 400);

  console.log('\n[ INFO DISCLOSURE ]');
  await clr(); r = await req('/api/unknown-route-xyz', 'GET'); chk("Route inconnue → 404", r.s, 404);
  const noLeak = !r.b.includes('Cannot') && !r.b.includes('stack') && !r.b.includes('Error:');
  if (noLeak) { console.log('  ✅ PASS Pas de stack trace exposee'); p++; }
  else        { console.log('  ❌ FAIL Stack trace exposee!'); f++; }

  console.log('\n[ DB SECURITY LOG ]');
  const { rows } = await pool.query(
    "SELECT threat_type, COUNT(*) as cnt FROM security_log WHERE created_at > NOW() - INTERVAL '10 minutes' GROUP BY threat_type ORDER BY cnt DESC"
  );
  if (rows.length > 0) {
    console.log('  ✅ PASS Menaces loggees en DB:');
    rows.forEach(row => console.log('    •', row.threat_type + ':', row.cnt, 'entree(s)'));
    p++;
  } else {
    console.log('  ⚠️  Aucun log trouve');
  }

  await clr();
  await pool.end();

  console.log('\n══════════════════════════════════════════');
  console.log('  RESULTAT:', p, '✅ PASS |', f, '❌ FAIL');
  console.log('══════════════════════════════════════════\n');
  process.exit(f > 0 ? 1 : 0);
}

main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
