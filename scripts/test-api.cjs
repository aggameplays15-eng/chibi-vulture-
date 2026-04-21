require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:3000';
let adminToken = null;
let userToken = null;
let results = { pass: 0, fail: 0, warn: 0 };

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 3000,
      path, method,
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
    r.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function ok(label, status, expected, body) {
  const pass = status === expected;
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} [${status}] ${label}`);
  if (!pass) console.log(`   → Attendu: ${expected} | Body: ${JSON.stringify(body).substring(0, 120)}`);
  pass ? results.pass++ : results.fail++;
  return pass;
}

function warn(label, msg) {
  console.log(`⚠️  ${label}: ${msg}`);
  results.warn++;
}

async function run() {
  console.log('🔍 Test de tous les endpoints API\n' + '─'.repeat(50));

  // ── 1. App Settings (public) ──────────────────────────────────────────────
  console.log('\n📱 APP SETTINGS');
  const settings = await req('GET', '/api/app-settings');
  ok('GET /api/app-settings', settings.status, 200, settings.body);

  // ── 2. Product Categories (public) ───────────────────────────────────────
  console.log('\n🏷️  PRODUCT CATEGORIES');
  const cats = await req('GET', '/api/product-categories');
  ok('GET /api/product-categories', cats.status, 200, cats.body);
  if (cats.status === 200) console.log(`   → ${cats.body.length} catégories`);

  // ── 3. Products (public) ─────────────────────────────────────────────────
  console.log('\n🛍️  PRODUCTS');
  const prods = await req('GET', '/api/products');
  ok('GET /api/products', prods.status, 200, prods.body);
  if (prods.status === 200) console.log(`   → ${prods.body.length} produits`);

  // ── 4. Posts (public) ────────────────────────────────────────────────────
  console.log('\n📸 POSTS');
  const posts = await req('GET', '/api/posts?page=1&limit=10');
  ok('GET /api/posts', posts.status, 200, posts.body);
  if (posts.status === 200) console.log(`   → ${posts.body.length} posts`);

  // ── 5. Search ────────────────────────────────────────────────────────────
  console.log('\n🔍 SEARCH');
  const search = await req('GET', '/api/search?q=chibi');
  ok('GET /api/search?q=chibi', search.status, 200, search.body);

  // ── 6. Admin Login ───────────────────────────────────────────────────────
  console.log('\n🔐 ADMIN LOGIN');
  const adminCreds = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
  if (!adminCreds.email || !adminCreds.password) {
    warn('Admin login', 'ADMIN_EMAIL ou ADMIN_PASSWORD non défini dans .env');
  } else {
    const adminLogin = await req('POST', '/api/admin-login', adminCreds);
    if (ok('POST /api/admin-login', adminLogin.status, 200, adminLogin.body)) {
      adminToken = adminLogin.body.token;
      console.log(`   → Token admin obtenu ✓`);
    }
  }

  // ── 7. Signup test user ──────────────────────────────────────────────────
  console.log('\n👤 SIGNUP / LOGIN');
  const suffix = Date.now().toString().slice(-6);
  const testHandle = `@tst${suffix}`;
  const testEmail = `test${suffix}@test.com`;
  const signup = await req('POST', '/api/users', {
    name: 'Test User', handle: testHandle,
    email: testEmail, password: 'password123',
    bio: 'Test bio', avatarColor: '#EC4899'
  });
  ok('POST /api/users (signup)', signup.status, 201, signup.body);

  // Login avec le user créé
  const login = await req('POST', '/api/login', { email: testEmail, password: 'password123' });
  if (ok('POST /api/login', login.status, 200, login.body)) {
    userToken = login.body.token;
    console.log(`   → Token user obtenu ✓`);
  }

  // ── 8. Users (admin only) ────────────────────────────────────────────────
  console.log('\n👥 USERS (admin)');
  if (adminToken) {
    const users = await req('GET', '/api/users', null, adminToken);
    ok('GET /api/users (admin)', users.status, 200, users.body);
    if (users.status === 200) console.log(`   → ${users.body.length} utilisateurs`);
  } else warn('GET /api/users', 'Pas de token admin');

  // ── 9. Posts avec auth ───────────────────────────────────────────────────
  console.log('\n📝 POSTS (auth)');
  if (userToken) {
    const createPost = await req('POST', '/api/posts', {
      image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=600',
      caption: 'Test post depuis le script de vérification'
    }, userToken);
    ok('POST /api/posts', createPost.status, 201, createPost.body);

    // Likes
    if (createPost.status === 201) {
      const postId = createPost.body.id;
      console.log('\n❤️  LIKES');
      const like = await req('POST', '/api/likes', { post_id: postId }, userToken);
      ok('POST /api/likes (like)', like.status, 201, like.body);
      const unlike = await req('POST', '/api/likes', { post_id: postId }, userToken);
      ok('POST /api/likes (unlike)', unlike.status, 200, unlike.body);

      // Comments
      console.log('\n💬 COMMENTS');
      const comment = await req('POST', '/api/comments', { post_id: postId, text: 'Super post !' }, userToken);
      ok('POST /api/comments', comment.status, 201, comment.body);
      const getComments = await req('GET', `/api/comments?post_id=${postId}`);
      ok('GET /api/comments', getComments.status, 200, getComments.body);
    }
  } else warn('POST /api/posts', 'Pas de token user');

  // ── 10. Follows ──────────────────────────────────────────────────────────
  console.log('\n👥 FOLLOWS');
  if (userToken && adminToken) {
    const follow = await req('POST', '/api/follows', { following_handle: '@admin' }, userToken);
    ok('POST /api/follows', follow.status === 201 || follow.status === 200 ? follow.status : follow.status, 
       follow.status === 201 || follow.status === 200 ? follow.status : 201, follow.body);
  }
  const followData = await req('GET', '/api/follows?handle=@admin');
  ok('GET /api/follows', followData.status, 200, followData.body);

  // ── 11. Messages ─────────────────────────────────────────────────────────
  console.log('\n💌 MESSAGES');
  if (userToken) {
    const msg = await req('POST', '/api/messages', { receiver_handle: '@admin', text: 'Bonjour admin !' }, userToken);
    ok('POST /api/messages', msg.status, 201, msg.body);
    const msgs = await req('GET', `/api/messages?user1=${encodeURIComponent(login?.body?.user?.handle || '@guest')}&user2=@admin`, null, userToken);
    ok('GET /api/messages', msgs.status, 200, msgs.body);
  }

  // ── 12. Conversations ────────────────────────────────────────────────────
  console.log('\n🗨️  CONVERSATIONS');
  if (userToken) {
    const convs = await req('GET', '/api/conversations', null, userToken);
    ok('GET /api/conversations', convs.status, 200, convs.body);
  }

  // ── 13. Notifications ────────────────────────────────────────────────────
  console.log('\n🔔 NOTIFICATIONS');
  if (userToken) {
    const notifs = await req('GET', '/api/notifications', null, userToken);
    ok('GET /api/notifications', notifs.status, 200, notifs.body);
  }

  // ── 14. Push subscribe ───────────────────────────────────────────────────
  console.log('\n📲 PUSH');
  if (userToken) {
    const vapid = await req('GET', '/api/push-subscribe', null, userToken);
    ok('GET /api/push-subscribe (vapid key)', vapid.status, 200, vapid.body);
  }

  // ── 15. Admin endpoints ──────────────────────────────────────────────────
  console.log('\n🛡️  ADMIN ENDPOINTS');
  if (adminToken) {
    const pushStats = await req('GET', '/api/admin-push-stats', null, adminToken);
    ok('GET /api/admin-push-stats', pushStats.status, 200, pushStats.body);

    const artistStats = await req('GET', '/api/artist-stats?artist_id=1&period=month', null, adminToken);
    ok('GET /api/artist-stats', artistStats.status, 200, artistStats.body);

    const orders = await req('GET', '/api/orders', null, adminToken);
    ok('GET /api/orders', orders.status, 200, orders.body);
    if (orders.status === 200) console.log(`   → ${orders.body.length} commandes`);
  }

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`📊 RÉSULTATS : ✅ ${results.pass} OK  ❌ ${results.fail} FAIL  ⚠️  ${results.warn} WARN`);
  if (results.fail === 0) console.log('🎉 Tout fonctionne !');
  else console.log('⚠️  Des endpoints ont des problèmes.');
}

run().catch(e => console.error('Erreur fatale:', e.message));
