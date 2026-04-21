const http = require('http');
require('dotenv').config();

const BASE = 'http://localhost:3000';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const r = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function run() {
  let token, handle, postId, commentId, productId;

  console.log('\n========== TEST COMPLET ==========\n');

  // 1. LOGIN
  console.log('1. LOGIN...');
  try {
    const r = await req('POST', '/api/login', {
      email: 'admin@chibi.com',
      password: process.env.ADMIN_PASSWORD
    });
    if (r.status === 200 && r.body.token) {
      token = r.body.token;
      handle = r.body.user?.handle;
      console.log(`   ✓ Connecté en tant que ${r.body.user?.name} (${handle})`);
    } else {
      console.log('   ✗ Login échoué:', r.body);
      process.exit(1);
    }
  } catch (e) { console.log('   ✗ Erreur:', e.message); process.exit(1); }

  // 2. GET PRODUCTS
  console.log('\n2. GET PRODUCTS...');
  try {
    const r = await req('GET', '/api/products');
    if (r.status === 200 && Array.isArray(r.body)) {
      console.log(`   ✓ ${r.body.length} produit(s) trouvé(s)`);
      if (r.body.length > 0) productId = r.body[0].id;
    } else {
      console.log('   ✗ Erreur:', r.body);
    }
  } catch (e) { console.log('   ✗ Erreur:', e.message); }

  // 3. ADD PRODUCT (admin)
  console.log('\n3. ADD PRODUCT...');
  try {
    const r = await req('POST', '/api/products', {
      name: 'Test Produit',
      price: 50000,
      image: 'https://via.placeholder.com/300',
      category: 'Test',
      stock: 5,
      featured: false
    }, token);
    if (r.status === 201 && r.body.id) {
      productId = r.body.id;
      console.log(`   ✓ Produit créé (id=${productId})`);
    } else {
      console.log('   ✗ Erreur:', r.status, r.body);
    }
  } catch (e) { console.log('   ✗ Erreur:', e.message); }

  // 4. CREATE POST
  console.log('\n4. CREATE POST...');
  try {
    const r = await req('POST', '/api/posts', {
      image: 'https://via.placeholder.com/400',
      caption: 'Test post depuis script'
    }, token);
    if (r.status === 201 && r.body.id) {
      postId = r.body.id;
      console.log(`   ✓ Post créé (id=${postId})`);
    } else {
      console.log('   ✗ Erreur:', r.status, r.body);
    }
  } catch (e) { console.log('   ✗ Erreur:', e.message); }

  // 5. GET POSTS
  console.log('\n5. GET POSTS...');
  try {
    const r = await req('GET', '/api/posts?page=1&limit=5');
    if (r.status === 200 && Array.isArray(r.body)) {
      console.log(`   ✓ ${r.body.length} post(s) trouvé(s)`);
    } else {
      console.log('   ✗ Erreur:', r.body);
    }
  } catch (e) { console.log('   ✗ Erreur:', e.message); }

  // 6. ADD COMMENT
  if (postId) {
    console.log('\n6. ADD COMMENT...');
    try {
      const r = await req('POST', '/api/comments', {
        post_id: postId,
        text: 'Commentaire de test'
      }, token);
      if (r.status === 201 && r.body.id) {
        commentId = r.body.id;
        console.log(`   ✓ Commentaire créé (id=${commentId})`);
      } else {
        console.log('   ✗ Erreur:', r.status, r.body);
      }
    } catch (e) { console.log('   ✗ Erreur:', e.message); }

    // 7. GET COMMENTS
    console.log('\n7. GET COMMENTS...');
    try {
      const r = await req('GET', `/api/comments?post_id=${postId}`);
      if (r.status === 200 && Array.isArray(r.body)) {
        console.log(`   ✓ ${r.body.length} commentaire(s)`);
      } else {
        console.log('   ✗ Erreur:', r.body);
      }
    } catch (e) { console.log('   ✗ Erreur:', e.message); }

    // 8. DELETE COMMENT
    if (commentId) {
      console.log('\n8. DELETE COMMENT...');
      try {
        const r = await req('DELETE', `/api/comments?id=${commentId}`, null, token);
        if (r.status === 200) {
          console.log('   ✓ Commentaire supprimé');
        } else {
          console.log('   ✗ Erreur:', r.status, r.body);
        }
      } catch (e) { console.log('   ✗ Erreur:', e.message); }
    }

    // 9. DELETE POST
    console.log('\n9. DELETE POST...');
    try {
      const r = await req('DELETE', `/api/posts?id=${postId}`, null, token);
      if (r.status === 200) {
        console.log('   ✓ Post supprimé');
      } else {
        console.log('   ✗ Erreur:', r.status, r.body);
      }
    } catch (e) { console.log('   ✗ Erreur:', e.message); }
  }

  // 10. CREATE ORDER
  if (productId) {
    console.log('\n10. CREATE ORDER...');
    try {
      const orderId = `ORD-TEST-${Date.now()}`;
      const r = await req('POST', '/api/orders', {
        id: orderId,
        customer_name: 'Test Client',
        total: 65000,
        items: [{ id: productId, quantity: 1 }],
        phone: '620000000',
        shipping_address: 'Kaloum, Conakry'
      }, token);
      if (r.status === 201) {
        console.log(`   ✓ Commande créée (id=${r.body.id})`);
      } else {
        console.log('   ✗ Erreur:', r.status, r.body);
      }
    } catch (e) { console.log('   ✗ Erreur:', e.message); }
  }

  // 11. DELETE PRODUCT
  if (productId) {
    console.log('\n11. DELETE PRODUCT...');
    try {
      const r = await req('DELETE', `/api/products?id=${productId}`, null, token);
      if (r.status === 200) {
        console.log('   ✓ Produit supprimé');
      } else {
        console.log('   ✗ Erreur:', r.status, r.body);
      }
    } catch (e) { console.log('   ✗ Erreur:', e.message); }
  }

  // 12. APP SETTINGS
  console.log('\n12. GET APP SETTINGS...');
  try {
    const r = await req('GET', '/api/app-settings');
    if (r.status === 200) {
      console.log(`   ✓ Settings: app_name="${r.body.app_name}", color="${r.body.primary_color}"`);
    } else {
      console.log('   ✗ Erreur:', r.body);
    }
  } catch (e) { console.log('   ✗ Erreur:', e.message); }

  // 13. GET USERS (admin)
  console.log('\n13. GET USERS (admin)...');
  try {
    const r = await req('GET', '/api/users', null, token);
    if (r.status === 200 && Array.isArray(r.body)) {
      console.log(`   ✓ ${r.body.length} utilisateur(s)`);
    } else {
      console.log('   ✗ Erreur:', r.status, r.body);
    }
  } catch (e) { console.log('   ✗ Erreur:', e.message); }

  console.log('\n========== FIN DES TESTS ==========\n');
}

run().catch(console.error);
