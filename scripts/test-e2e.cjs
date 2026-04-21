/**
 * TEST E2E COMPLET — Chibi Vulture API
 * Couvre tous les endpoints de A à Z avec nettoyage automatique.
 * Usage : node scripts/test-e2e.cjs
 * Prérequis : serveur local sur http://localhost:3000 (node server.cjs)
 */
require('dotenv').config();
const http = require('http');

// ─── Helpers ────────────────────────────────────────────────────────────────

const results = { pass: 0, fail: 0, skip: 0 };
const cleanup = []; // fonctions de nettoyage à exécuter à la fin

// IP unique par run pour éviter le rate limiting DB entre les runs de test
const TEST_IP = `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': TEST_IP,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(opts, (res) => {
      let raw = '';
      res.on('data', c => (raw += c));
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

function assert(label, condition, got) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    results.pass++;
  } else {
    console.log(`  ❌ ${label}`);
    if (got !== undefined) console.log(`     → ${JSON.stringify(got).substring(0, 200)}`);
    results.fail++;
  }
  return condition;
}

function skip(label, reason) {
  console.log(`  ⏭️  ${label} (skipped: ${reason})`);
  results.skip++;
}

function section(title) {
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(55));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║         TEST E2E COMPLET — Chibi Vulture API        ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  let adminToken = null;
  let userToken = null;
  let userHandle = null;
  let userId = null;
  let postId = null;
  let commentId = null;
  let productId = null;
  let orderId = null;
  let musicId = null;
  const suffix = Date.now().toString().slice(-7);
  const testHandle = `tst${suffix}`;
  const testEmail = `test${suffix}@test.com`;

  // ── 1. SANITY CHECK ────────────────────────────────────────────────────
  section('1. SANITY CHECK — Serveur accessible');
  const ping = await req('GET', '/api/app-settings');
  if (!assert('Serveur répond sur :3000', ping.status !== 0, ping.body)) {
    console.log('\n⛔ Serveur inaccessible. Lance `node server.cjs` puis relance ce script.\n');
    process.exit(1);
  }

  // ── 2. APP SETTINGS (public) ───────────────────────────────────────────
  section('2. APP SETTINGS');
  assert('GET /api/app-settings → 200', ping.status === 200, ping.body);
  assert('Contient app_name', typeof ping.body.app_name === 'string', ping.body);
  assert('Contient primary_color', typeof ping.body.primary_color === 'string', ping.body);

  // ── 3. PRODUCT CATEGORIES (public) ────────────────────────────────────
  section('3. PRODUCT CATEGORIES');
  const cats = await req('GET', '/api/product-categories');
  assert('GET /api/product-categories → 200', cats.status === 200, cats.body);
  assert('Retourne un tableau', Array.isArray(cats.body), cats.body);
  if (cats.status === 200) console.log(`     → ${cats.body.length} catégorie(s)`);

  // ── 4. PRODUCTS (public) ───────────────────────────────────────────────
  section('4. PRODUCTS (public)');
  const prods = await req('GET', '/api/products');
  assert('GET /api/products → 200', prods.status === 200, prods.body);
  assert('Retourne un tableau', Array.isArray(prods.body), prods.body);
  if (prods.status === 200) console.log(`     → ${prods.body.length} produit(s)`);

  // ── 5. POSTS (public) ─────────────────────────────────────────────────
  section('5. POSTS (public)');
  const posts = await req('GET', '/api/posts?page=1&limit=10');
  assert('GET /api/posts → 200', posts.status === 200, posts.body);
  assert('Retourne un tableau', Array.isArray(posts.body), posts.body);
  if (posts.status === 200) console.log(`     → ${posts.body.length} post(s)`);

  // ── 6. SEARCH (public) ────────────────────────────────────────────────
  section('6. SEARCH');
  const search = await req('GET', '/api/search?q=chibi');
  assert('GET /api/search?q=chibi → 200', search.status === 200, search.body);
  assert('Contient users et posts', search.body && Array.isArray(search.body.users), search.body);
  const searchShort = await req('GET', '/api/search?q=a');
  assert('GET /api/search?q=a → 400 (trop court)', searchShort.status === 400, searchShort.body);

  // ── 7. MUSIC (public) ─────────────────────────────────────────────────
  section('7. MUSIC (public)');
  const music = await req('GET', '/api/music');
  assert('GET /api/music → 200', music.status === 200, music.body);
  assert('Retourne un tableau', Array.isArray(music.body), music.body);
  if (music.status === 200) console.log(`     → ${music.body.length} piste(s)`);

  // ── 8. ADMIN LOGIN ────────────────────────────────────────────────────
  section('8. ADMIN LOGIN');
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    skip('Admin login', 'ADMIN_EMAIL / ADMIN_PASSWORD non définis dans .env');
  } else {
    const adminLogin = await req('POST', '/api/admin-login', { email: adminEmail, password: adminPassword });
    if (assert('POST /api/admin-login → 200', adminLogin.status === 200, adminLogin.body)) {
      adminToken = adminLogin.body.token;
      assert('Token JWT présent', typeof adminToken === 'string', adminLogin.body);
      assert('Role = Admin', adminLogin.body.user?.role === 'Admin', adminLogin.body.user);
    }
    // Mauvais mot de passe — peut retourner 401 ou 429 si rate limit atteint
    const badLogin = await req('POST', '/api/admin-login', { email: adminEmail, password: 'wrongpassword' });
    assert('POST /api/admin-login mauvais mdp → 401 ou 429', [401, 429].includes(badLogin.status), badLogin.body);
  }

  // ── 9. SIGNUP ─────────────────────────────────────────────────────────
  section('9. SIGNUP (nouvel utilisateur)');
  const signup = await req('POST', '/api/users', {
    name: 'Test E2E User',
    handle: `@${testHandle}`,
    email: testEmail,
    password: 'password123',
    bio: 'Utilisateur de test E2E',
    avatarColor: '#EC4899',
  });
  if (assert('POST /api/users (signup) → 201', signup.status === 201, signup.body)) {
    assert('Handle présent', typeof signup.body.handle === 'string', signup.body);
    userHandle = signup.body.handle;
    userId = signup.body.id;
    console.log(`     → Créé: ${userHandle} (id=${userId})`);
  }
  // Doublon handle — même handle que le user créé
  const dupSignup = await req('POST', '/api/users', {
    name: 'Dup', handle: `@${testHandle}`, email: `dup${testEmail}`, password: 'password123',
  });
  assert('Signup doublon handle → 409, 400 ou 429', [400, 409, 429].includes(dupSignup.status), dupSignup.body);

  // ── 10. LOGIN ─────────────────────────────────────────────────────────
  section('10. LOGIN');
  const login = await req('POST', '/api/login', { email: testEmail, password: 'password123' });
  if (assert('POST /api/login → 200', login.status === 200, login.body)) {
    userToken = login.body.token; // refresh token
    assert('Token présent', typeof userToken === 'string', login.body);
    assert('Handle correspond', login.body.user?.handle === `@${testHandle}`, login.body.user);
    if (!userId) userId = login.body.user?.id;
    if (!userHandle) userHandle = login.body.user?.handle;
  }
  const badUserLogin = await req('POST', '/api/login', { email: testEmail, password: 'wrongpass' });
  assert('Login mauvais mdp → 401', badUserLogin.status === 401, badUserLogin.body);

  // ── 11. USERS (admin) ─────────────────────────────────────────────────
  section('11. USERS (admin)');
  if (adminToken) {
    const users = await req('GET', '/api/users', null, adminToken);
    assert('GET /api/users (admin) → 200', users.status === 200, users.body);
    assert('Retourne un tableau', Array.isArray(users.body), users.body);
    if (users.status === 200) console.log(`     → ${users.body.length} utilisateur(s)`);
  } else skip('GET /api/users', 'Pas de token admin');

  // GET sans auth → 403
  const usersNoAuth = await req('GET', '/api/users');
  assert('GET /api/users sans auth → 403', usersNoAuth.status === 403, usersNoAuth.body);

  // ── 12. PROFILE UPDATE ────────────────────────────────────────────────
  section('12. PROFILE UPDATE');
  if (userToken && userId) {
    const patch = await req('PATCH', '/api/users', { id: userId, bio: 'Bio mise à jour E2E' }, userToken);
    assert('PATCH /api/users (own profile) → 200', patch.status === 200, patch.body);
  } else skip('PATCH /api/users', 'Pas de token user ou userId');

  // ── 13. POSTS (auth) ──────────────────────────────────────────────────
  section('13. POSTS (auth)');
  if (userToken) {
    const createPost = await req('POST', '/api/posts', {
      image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=600',
      caption: 'Post de test E2E automatique',
    }, userToken);
    if (assert('POST /api/posts → 201', createPost.status === 201, createPost.body)) {
      postId = createPost.body.id;
      assert('Post a un id', typeof postId === 'number', createPost.body);
      console.log(`     → Post créé (id=${postId})`);
      cleanup.push(async () => {
        await req('DELETE', `/api/posts?id=${postId}`, null, userToken);
      });
    }
    // Sans auth → 401
    const postNoAuth = await req('POST', '/api/posts', {
      image: 'https://example.com/img.jpg', caption: 'test',
    });
    assert('POST /api/posts sans auth → 401', postNoAuth.status === 401, postNoAuth.body);
  } else skip('POST /api/posts', 'Pas de token user');

  // ── 14. LIKES ─────────────────────────────────────────────────────────
  section('14. LIKES');
  if (userToken && postId) {
    const like = await req('POST', '/api/likes', { post_id: postId }, userToken);
    assert('POST /api/likes (like) → 201', like.status === 201, like.body);
    const unlike = await req('POST', '/api/likes', { post_id: postId }, userToken);
    assert('POST /api/likes (unlike) → 200', unlike.status === 200, unlike.body);
    // Re-like pour les tests suivants
    await req('POST', '/api/likes', { post_id: postId }, userToken);
    // Sans auth → 401
    const likeNoAuth = await req('POST', '/api/likes', { post_id: postId });
    assert('POST /api/likes sans auth → 401', likeNoAuth.status === 401, likeNoAuth.body);
  } else skip('Likes', 'Pas de token user ou postId');

  // ── 15. COMMENTS ──────────────────────────────────────────────────────
  section('15. COMMENTS');
  if (userToken && postId) {
    const comment = await req('POST', '/api/comments', { post_id: postId, text: 'Commentaire E2E !' }, userToken);
    if (assert('POST /api/comments → 201', comment.status === 201, comment.body)) {
      commentId = comment.body.id;
      console.log(`     → Commentaire créé (id=${commentId})`);
    }
    const getComments = await req('GET', `/api/comments?post_id=${postId}`);
    assert('GET /api/comments → 200', getComments.status === 200, getComments.body);
    assert('Contient le commentaire', Array.isArray(getComments.body) && getComments.body.length > 0, getComments.body);
    // Commentaire sans auth → 401
    const commentNoAuth = await req('POST', '/api/comments', { post_id: postId, text: 'test' });
    assert('POST /api/comments sans auth → 401', commentNoAuth.status === 401, commentNoAuth.body);
    // Supprimer le commentaire
    if (commentId) {
      const delComment = await req('DELETE', `/api/comments?id=${commentId}`, null, userToken);
      assert('DELETE /api/comments → 200', delComment.status === 200, delComment.body);
    }
  } else skip('Comments', 'Pas de token user ou postId');

  // ── 16. FOLLOWS ───────────────────────────────────────────────────────
  section('16. FOLLOWS');
  // Créer un second user pour les tests de follow/message
  const suffix2 = `${suffix}b`;
  const testHandle2 = `tst${suffix2}`;
  const testEmail2 = `test${suffix2}@test.com`;
  let userId2 = null;
  const signup2 = await req('POST', '/api/users', {
    name: 'Test E2E User 2', handle: `@${testHandle2}`,
    email: testEmail2, password: 'password123', bio: 'User 2', avatarColor: '#3B82F6',
  });
  if (signup2.status === 201) {
    userId2 = signup2.body.id;
    if (userId2 && adminToken) {
      cleanup.push(async () => { await req('DELETE', `/api/users?id=${userId2}`, null, adminToken); });
    }
  }
  const targetHandle = signup2.status === 201 ? signup2.body.handle : null;

  const followsData = await req('GET', `/api/follows?handle=${encodeURIComponent(targetHandle || '@momo')}`);
  assert('GET /api/follows → 200', followsData.status === 200, followsData.body);
  assert('Contient followersCount', typeof followsData.body.followersCount === 'number', followsData.body);
  if (userToken && targetHandle) {
    const follow = await req('POST', '/api/follows', { following_handle: targetHandle }, userToken);
    assert('POST /api/follows → 201 ou 200', [200, 201].includes(follow.status), follow.body);
    // Unfollow
    const unfollow = await req('POST', '/api/follows', { following_handle: targetHandle }, userToken);
    assert('POST /api/follows (unfollow) → 200', unfollow.status === 200, unfollow.body);
  } else skip('POST /api/follows', 'Pas de token user ou pas de handle cible');

  // ── 17. MESSAGES ──────────────────────────────────────────────────────
  section('17. MESSAGES');
  if (userToken && targetHandle) {
    const msg = await req('POST', '/api/messages', { receiver_handle: targetHandle, text: 'Bonjour depuis E2E !' }, userToken);
    assert('POST /api/messages → 201', msg.status === 201, msg.body);
    const msgs = await req('GET', `/api/messages?user1=${encodeURIComponent(userHandle)}&user2=${encodeURIComponent(targetHandle)}`, null, userToken);
    assert('GET /api/messages → 200', msgs.status === 200, msgs.body);
    assert('Retourne un tableau', Array.isArray(msgs.body), msgs.body);
    // Sans auth → 401
    const msgNoAuth = await req('GET', `/api/messages?user1=${encodeURIComponent(userHandle)}&user2=${encodeURIComponent(targetHandle)}`);
    assert('GET /api/messages sans auth → 401', msgNoAuth.status === 401, msgNoAuth.body);
  } else skip('Messages', 'Pas de token user ou pas de handle cible');

  // ── 18. CONVERSATIONS ─────────────────────────────────────────────────
  section('18. CONVERSATIONS');
  if (userToken) {
    const convs = await req('GET', '/api/conversations', null, userToken);
    assert('GET /api/conversations → 200', convs.status === 200, convs.body);
    assert('Retourne un tableau', Array.isArray(convs.body), convs.body);
  } else skip('Conversations', 'Pas de token user');

  // ── 19. NOTIFICATIONS ─────────────────────────────────────────────────
  section('19. NOTIFICATIONS');
  if (userToken) {
    const notifs = await req('GET', '/api/notifications', null, userToken);
    assert('GET /api/notifications → 200', notifs.status === 200, notifs.body);
    // Sans auth → 401
    const notifsNoAuth = await req('GET', '/api/notifications');
    assert('GET /api/notifications sans auth → 401', notifsNoAuth.status === 401, notifsNoAuth.body);
  } else skip('Notifications', 'Pas de token user');

  // ── 20. PUSH SUBSCRIBE ────────────────────────────────────────────────
  section('20. PUSH SUBSCRIBE');
  if (userToken) {
    const vapid = await req('GET', '/api/push-subscribe', null, userToken);
    assert('GET /api/push-subscribe → 200 ou 503', [200, 503].includes(vapid.status), vapid.body);
    if (vapid.status === 200) assert('Contient publicKey', typeof vapid.body.publicKey === 'string', vapid.body);
  } else skip('Push subscribe', 'Pas de token user');

  // ── 21. PRODUCTS (admin CRUD) ─────────────────────────────────────────
  section('21. PRODUCTS (admin CRUD)');
  if (adminToken) {
    const createProd = await req('POST', '/api/products', {
      name: 'Produit Test E2E',
      price: 9999,
      image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=300',
      category: 'Test',
      stock: 10,
      featured: false,
    }, adminToken);
    if (assert('POST /api/products (admin) → 201', createProd.status === 201, createProd.body)) {
      productId = createProd.body.id;
      console.log(`     → Produit créé (id=${productId})`);
      cleanup.push(async () => {
        await req('DELETE', `/api/products?id=${productId}`, null, adminToken);
      });
    }
    // Sans auth → 403
    const prodNoAuth = await req('POST', '/api/products', { name: 'x', price: 1, image: 'x' });
    assert('POST /api/products sans auth → 401 ou 403', [401, 403].includes(prodNoAuth.status), prodNoAuth.body);
  } else skip('Products CRUD', 'Pas de token admin');

  // ── 22. ORDERS ────────────────────────────────────────────────────────
  section('22. ORDERS');
  if (userToken && productId) {
    const orderRef = `E2E-${suffix}`;
    const createOrder = await req('POST', '/api/orders', {
      id: orderRef,
      customer_name: 'Client Test E2E',
      total: 9999,
      items: [{ id: productId, quantity: 1 }],
      phone: '620000000',
      shipping_address: 'Kaloum, Conakry',
    }, userToken);
    if (assert('POST /api/orders → 201', createOrder.status === 201, createOrder.body)) {
      orderId = createOrder.body.id;
      console.log(`     → Commande créée (id=${orderId})`);
    }
    // Validation : items vide → 400
    const badOrder = await req('POST', '/api/orders', {
      id: `E2E-BAD-${suffix}`, customer_name: 'x', total: 0, items: [],
    }, userToken);
    assert('POST /api/orders items vide → 400', badOrder.status === 400, badOrder.body);
  } else skip('Orders', 'Pas de token user ou productId');

  // GET orders (admin)
  if (adminToken) {
    const orders = await req('GET', '/api/orders', null, adminToken);
    assert('GET /api/orders (admin) → 200', orders.status === 200, orders.body);
    assert('Retourne un tableau', Array.isArray(orders.body), orders.body);
    if (orders.status === 200) console.log(`     → ${orders.body.length} commande(s)`);
  }

  // ── 23. DELIVERY TRACKING ─────────────────────────────────────────────
  section('23. DELIVERY TRACKING');
  if (orderId) {
    const tracking = await req('GET', `/api/delivery-tracking?orderId=${orderId}`);
    assert('GET /api/delivery-tracking → 200', tracking.status === 200, tracking.body);
    assert('Contient orderId ou order', tracking.body && (tracking.body.orderId !== undefined || tracking.body.order !== undefined), tracking.body);
  } else skip('Delivery tracking', 'Pas de orderId');

  // ── 24. ARTIST STATS ──────────────────────────────────────────────────
  section('24. ARTIST STATS');
  if (adminToken) {
    const stats = await req('GET', '/api/artist-stats?artist_id=1&period=month', null, adminToken);
    assert('GET /api/artist-stats → 200', stats.status === 200, stats.body);
    // Sans artist_id → 400
    const statsBad = await req('GET', '/api/artist-stats', null, adminToken);
    assert('GET /api/artist-stats sans artist_id → 400', statsBad.status === 400, statsBad.body);
  } else skip('Artist stats', 'Pas de token admin');

  // ── 25. MUSIC (admin CRUD) ────────────────────────────────────────────
  section('25. MUSIC (admin CRUD)');
  if (adminToken) {
    const addTrack = await req('POST', '/api/music', {
      title: 'Track Test E2E',
      artist: 'Artiste Test',
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    }, adminToken);
    if (assert('POST /api/music (admin) → 201', addTrack.status === 201, addTrack.body)) {
      musicId = addTrack.body.id;
      console.log(`     → Piste créée (id=${musicId})`);
      // PATCH — toggle is_active (seuls is_active et sort_order sont acceptés)
      const patchTrack = await req('PATCH', '/api/music', { id: musicId, is_active: false, sort_order: 99 }, adminToken);
      assert('PATCH /api/music → 200', patchTrack.status === 200, patchTrack.body);
      // DELETE
      const delTrack = await req('DELETE', `/api/music?id=${musicId}`, null, adminToken);
      assert('DELETE /api/music → 200', delTrack.status === 200, delTrack.body);
      musicId = null;
    }
    // Sans auth → 403
    const musicNoAuth = await req('POST', '/api/music', { title: 'x', youtube_url: 'https://youtu.be/dQw4w9WgXcQ' });
    assert('POST /api/music sans auth → 401 ou 403', [401, 403].includes(musicNoAuth.status), musicNoAuth.body);
  } else skip('Music CRUD', 'Pas de token admin');

  // ── 26. ADMIN PUSH STATS ──────────────────────────────────────────────
  section('26. ADMIN PUSH STATS');
  if (adminToken) {
    const pushStats = await req('GET', '/api/admin-push-stats', null, adminToken);
    assert('GET /api/admin-push-stats → 200', pushStats.status === 200, pushStats.body);
  } else skip('Admin push stats', 'Pas de token admin');

  // ── 27. SÉCURITÉ — Accès non autorisé ────────────────────────────────
  section('27. SÉCURITÉ — Vérifications accès');
  // User ne peut pas accéder aux endpoints admin
  if (userToken) {
    const usersAsUser = await req('GET', '/api/users', null, userToken);
    assert('GET /api/users avec token user → 403', usersAsUser.status === 403, usersAsUser.body);
    const ordersAsUser = await req('GET', '/api/orders', null, userToken);
    assert('GET /api/orders avec token user → 403', ordersAsUser.status === 403, ordersAsUser.body);
  }
  // Token invalide → 401
  const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJoYW5kbGUiOiJoYWNrZXIifQ.fake';
  const withFakeToken = await req('GET', '/api/notifications', null, fakeToken);
  assert('Token JWT invalide → 401', withFakeToken.status === 401, withFakeToken.body);

  // ── 28. NETTOYAGE ─────────────────────────────────────────────────────
  section('28. NETTOYAGE');
  // Supprimer le post de test
  if (postId && userToken) {
    const delPost = await req('DELETE', `/api/posts?id=${postId}`, null, userToken);
    assert('DELETE /api/posts (test post) → 200', delPost.status === 200, delPost.body);
    postId = null;
  }
  // Supprimer le produit de test
  if (productId && adminToken) {
    const delProd = await req('DELETE', `/api/products?id=${productId}`, null, adminToken);
    assert('DELETE /api/products (test produit) → 200', delProd.status === 200, delProd.body);
    productId = null;
  }
  // Supprimer l'utilisateur de test
  if (userId && adminToken) {
    const delUser = await req('DELETE', `/api/users?id=${userId}`, null, adminToken);
    assert('DELETE /api/users (test user) → 200', delUser.status === 200, delUser.body);
  }
  // Exécuter les cleanups restants
  for (const fn of cleanup) {
    try { await fn(); } catch {}
  }

  // ── RÉSUMÉ ────────────────────────────────────────────────────────────
  const total = results.pass + results.fail + results.skip;
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log(`║  RÉSULTATS : ✅ ${String(results.pass).padEnd(4)} OK  ❌ ${String(results.fail).padEnd(4)} FAIL  ⏭️  ${String(results.skip).padEnd(4)} SKIP  ║`);
  console.log(`║  Total : ${total} assertions                              ║`);
  if (results.fail === 0) {
    console.log('║  🎉 Tout fonctionne de A à Z !                       ║');
  } else {
    console.log(`║  ⚠️  ${results.fail} test(s) en échec — voir les détails ci-dessus ║`);
  }
  console.log('╚══════════════════════════════════════════════════════╝\n');

  process.exit(results.fail > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('\n⛔ Erreur fatale:', e.message);
  process.exit(1);
});
