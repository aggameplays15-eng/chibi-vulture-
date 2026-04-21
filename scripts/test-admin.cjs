require('dotenv').config();
const http = require('http');

let adminToken = null;
let results = { pass: 0, fail: 0 };

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      }
    };
    const r = http.request(options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function check(label, status, expected, body, showBody = false) {
  const pass = status === expected;
  console.log(`${pass ? '✅' : '❌'} [${status}] ${label}`);
  if (!pass || showBody) console.log(`   → ${JSON.stringify(body).substring(0, 150)}`);
  pass ? results.pass++ : results.fail++;
  return pass;
}

async function run() {
  console.log('🛡️  TEST COMPLET ADMIN\n' + '─'.repeat(50));

  // ── Login admin ───────────────────────────────────────────────────────────
  console.log('\n🔐 AUTHENTIFICATION ADMIN');
  const login = await req('POST', '/api/admin-login', {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  });
  if (check('POST /api/admin-login', login.status, 200, login.body)) {
    adminToken = login.body.token;
    console.log(`   → Role: ${login.body.user?.role}, Handle: ${login.body.user?.handle}`);
  } else { console.log('❌ Impossible de continuer sans token admin'); return; }

  // ── Accès refusé sans token ───────────────────────────────────────────────
  console.log('\n🔒 SÉCURITÉ — Accès refusé sans token');
  const noAuth = await req('GET', '/api/users');
  check('GET /api/users sans token → 403', noAuth.status, 403, noAuth.body);
  const noAuthOrders = await req('GET', '/api/orders');
  check('GET /api/orders sans token → 403', noAuthOrders.status, 403, noAuthOrders.body);
  const noAuthPush = await req('GET', '/api/admin-push-stats');
  check('GET /api/admin-push-stats sans token → 401', noAuthPush.status, 401, noAuthPush.body);

  // ── Users management ─────────────────────────────────────────────────────
  console.log('\n👥 GESTION UTILISATEURS');
  const users = await req('GET', '/api/users', null, adminToken);
  check('GET /api/users (admin)', users.status, 200, users.body);
  if (users.status === 200) console.log(`   → ${users.body.length} utilisateurs`);

  // Créer un user test pour les opérations
  const suffix = Date.now().toString().slice(-5);
  const signup = await req('POST', '/api/users', {
    name: 'Test Admin', handle: `@adm${suffix}`,
    email: `adm${suffix}@test.com`, password: 'password123',
    bio: 'Test', avatarColor: '#EC4899'
  });
  check('POST /api/users (créer user test)', signup.status, 201, signup.body);
  const testUserId = signup.body?.id;

  if (testUserId) {
    // Approuver
    const approve = await req('PATCH', '/api/users', { id: testUserId, is_approved: true }, adminToken);
    check('PATCH /api/users (approuver)', approve.status, 200, approve.body);

    // Bannir
    const ban = await req('PATCH', '/api/users', { id: testUserId, status: 'Banni' }, adminToken);
    check('PATCH /api/users (bannir)', ban.status, 200, ban.body);

    // Promouvoir
    const promote = await req('PATCH', '/api/users', { id: testUserId, role: 'Admin' }, adminToken);
    check('PATCH /api/users (promouvoir)', promote.status, 200, promote.body);
  }

  // ── Shop management ──────────────────────────────────────────────────────
  console.log('\n🛍️  GESTION BOUTIQUE');
  const addProd = await req('POST', '/api/products', {
    name: 'Produit Test Admin',
    price: 99000,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300',
    category: 'Vêtements',
    stock: 5,
    featured: false
  }, adminToken);
  check('POST /api/products (ajouter)', addProd.status, 201, addProd.body);
  const prodId = addProd.body?.id;

  if (prodId) {
    const delProd = await req('DELETE', `/api/products?id=${prodId}`, null, adminToken);
    check('DELETE /api/products (supprimer)', delProd.status, 200, delProd.body);
  }

  // ── Orders ───────────────────────────────────────────────────────────────
  console.log('\n📦 COMMANDES');
  const orders = await req('GET', '/api/orders', null, adminToken);
  check('GET /api/orders (admin)', orders.status, 200, orders.body);
  if (orders.status === 200) console.log(`   → ${orders.body.length} commandes`);

  // ── Post moderation ──────────────────────────────────────────────────────
  console.log('\n🛡️  MODÉRATION POSTS');
  const posts = await req('GET', '/api/posts?page=1&limit=5');
  check('GET /api/posts (liste)', posts.status, 200, posts.body);
  if (posts.status === 200 && posts.body.length > 0) {
    const postId = posts.body[0].id;
    const delPost = await req('DELETE', `/api/posts?id=${postId}`, null, adminToken);
    check(`DELETE /api/posts?id=${postId} (admin)`, delPost.status, 200, delPost.body);
  }

  // ── Push notifications ───────────────────────────────────────────────────
  console.log('\n📲 PUSH NOTIFICATIONS');
  const pushStats = await req('GET', '/api/admin-push-stats', null, adminToken);
  check('GET /api/admin-push-stats', pushStats.status, 200, pushStats.body, true);

  const sendPush = await req('POST', '/api/admin-push-notify', {
    title: 'Test notification',
    body: 'Ceci est un test depuis le script admin',
    url: '/feed'
  }, adminToken);
  check('POST /api/admin-push-notify', sendPush.status, 200, sendPush.body, true);

  // ── App settings ─────────────────────────────────────────────────────────
  console.log('\n⚙️  APP SETTINGS');
  const getSettings = await req('GET', '/api/app-settings');
  check('GET /api/app-settings (public)', getSettings.status, 200, getSettings.body, true);

  const updateSettings = await req('PUT', '/api/app-settings', {
    app_name: 'Chibi Vulture',
    primary_color: '#EC4899',
    app_description: 'Le réseau social artistique'
  }, adminToken);
  check('PUT /api/app-settings (admin)', updateSettings.status, 200, updateSettings.body);

  // ── Artist stats ─────────────────────────────────────────────────────────
  console.log('\n📊 ARTIST STATS');
  const statsWeek  = await req('GET', '/api/artist-stats?artist_id=1&period=week',  null, adminToken);
  const statsMonth = await req('GET', '/api/artist-stats?artist_id=1&period=month', null, adminToken);
  const statsYear  = await req('GET', '/api/artist-stats?artist_id=1&period=year',  null, adminToken);
  check('GET /api/artist-stats (week)',  statsWeek.status,  200, statsWeek.body);
  check('GET /api/artist-stats (month)', statsMonth.status, 200, statsMonth.body);
  check('GET /api/artist-stats (year)',  statsYear.status,  200, statsYear.body);

  // ── Product categories ───────────────────────────────────────────────────
  console.log('\n🏷️  PRODUCT CATEGORIES');
  const cats = await req('GET', '/api/product-categories');
  check('GET /api/product-categories', cats.status, 200, cats.body);
  if (cats.status === 200) console.log(`   → ${cats.body.length} catégories`);

  const addCat = await req('POST', '/api/product-categories', {
    name: `TestCat${suffix}`, description: 'Test', icon: 'Star', color: '#EC4899', sort_order: 99
  }, adminToken);
  check('POST /api/product-categories (admin)', addCat.status, 201, addCat.body);

  // ── Delivery tracking ────────────────────────────────────────────────────
  console.log('\n🚚 DELIVERY TRACKING');
  const tracking = await req('GET', '/api/delivery-tracking?orderId=1');
  // 404 est acceptable si la commande n'existe pas
  const trackOk = tracking.status === 200 || tracking.status === 404;
  console.log(`${trackOk ? '✅' : '❌'} [${tracking.status}] GET /api/delivery-tracking?orderId=1`);
  trackOk ? results.pass++ : results.fail++;

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`📊 RÉSULTATS ADMIN : ✅ ${results.pass} OK  ❌ ${results.fail} FAIL`);
  if (results.fail === 0) console.log('🎉 Tout le panel admin fonctionne !');
  else console.log('⚠️  Certains endpoints admin ont des problèmes.');
}

run().catch(e => console.error('Erreur:', e.message));
