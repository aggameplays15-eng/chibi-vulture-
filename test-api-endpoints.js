#!/usr/bin/env node

/**
 * Script de test manuel des endpoints API
 * Usage: node test-api-endpoints.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5173';
const USE_HTTPS = BASE_URL.startsWith('https');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Résultats des tests
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Fonction pour faire une requête HTTP/HTTPS
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = USE_HTTPS ? https : http;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = protocol.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Logger avec couleurs
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test unitaire
 */
async function test(name, fn) {
  results.total++;
  try {
    log(`\n🧪 Test: ${name}`, 'cyan');
    await fn();
    results.passed++;
    log(`✅ PASS`, 'green');
  } catch (error) {
    results.failed++;
    log(`❌ FAIL: ${error.message}`, 'red');
    console.error(error);
  }
}

/**
 * Assertion
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Tests
 */
async function runTests() {
  log('\n═══════════════════════════════════════════', 'blue');
  log('🚀 TEST MANUEL DES ENDPOINTS API', 'blue');
  log('═══════════════════════════════════════════\n', 'blue');
  log(`Base URL: ${BASE_URL}`, 'yellow');

  let testUser = {
    email: `test_${Date.now()}@test.com`,
    password: 'Test123!',
    name: `Test User ${Date.now()}`,
    handle: `testuser_${Date.now()}`
  };
  let authToken = null;
  let userId = null;
  let postId = null;
  let productId = null;

  // ==========================================
  // TESTS GUEST (Sans authentification)
  // ==========================================
  
  log('\n📋 PARTIE 1: TESTS MODE GUEST', 'blue');
  log('─────────────────────────────────────────\n', 'blue');

  await test('GET /api/posts - Récupérer les posts publics', async () => {
    const res = await makeRequest('GET', '/api/posts');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Response should be an array');
    log(`  → ${res.data.length} posts récupérés`, 'green');
  });

  await test('GET /api/products - Récupérer les produits', async () => {
    const res = await makeRequest('GET', '/api/products');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Response should be an array');
    if (res.data.length > 0) {
      productId = res.data[0].id;
      log(`  → ${res.data.length} produits récupérés`, 'green');
    }
  });

  await test('GET /api/users - Récupérer les utilisateurs publics', async () => {
    const res = await makeRequest('GET', '/api/users');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Response should be an array');
    log(`  → ${res.data.length} utilisateurs récupérés`, 'green');
  });

  // ==========================================
  // TESTS INSCRIPTION & CONNEXION
  // ==========================================
  
  log('\n📋 PARTIE 2: INSCRIPTION & CONNEXION', 'blue');
  log('─────────────────────────────────────────\n', 'blue');

  await test('POST /api/users - Créer un nouveau compte', async () => {
    const res = await makeRequest('POST', '/api/users', testUser);
    assert(res.status === 201 || res.status === 200, `Expected 201/200, got ${res.status}`);
    assert(res.data.id, 'User ID should be returned');
    userId = res.data.id;
    log(`  → Utilisateur créé avec ID: ${userId}`, 'green');
    log(`  → Email: ${testUser.email}`, 'yellow');
  });

  await test('POST /api/login - Connexion avec le nouveau compte', async () => {
    const res = await makeRequest('POST', '/api/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    // Le compte peut nécessiter une approbation admin
    if (res.status === 403) {
      log(`  ⚠️  Compte en attente d'approbation admin`, 'yellow');
      throw new Error('Account pending approval - expected behavior');
    }
    
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.token, 'Token should be returned');
    authToken = res.data.token;
    log(`  → Connexion réussie`, 'green');
    log(`  → Token: ${authToken.substring(0, 20)}...`, 'yellow');
  });

  // ==========================================
  // TESTS ARTISTE (Avec authentification)
  // ==========================================
  
  if (authToken) {
    log('\n📋 PARTIE 3: TESTS MODE ARTISTE (Authentifié)', 'blue');
    log('─────────────────────────────────────────\n', 'blue');

    await test('GET /api/users/me - Récupérer son profil', async () => {
      const res = await makeRequest('GET', '/api/users/me', null, authToken);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.data.email === testUser.email, 'Email should match');
      log(`  → Profil récupéré: ${res.data.name}`, 'green');
    });

    await test('PUT /api/users/:id - Mettre à jour son profil', async () => {
      const updateData = {
        bio: 'Test bio updated',
        location: 'Paris, France'
      };
      const res = await makeRequest('PUT', `/api/users/${userId}`, updateData, authToken);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      log(`  → Profil mis à jour`, 'green');
    });

    await test('POST /api/posts - Créer un nouveau post', async () => {
      const postData = {
        title: 'Test Post',
        description: 'This is a test post',
        image_url: 'https://via.placeholder.com/600',
        tags: ['test', 'art']
      };
      const res = await makeRequest('POST', '/api/posts', postData, authToken);
      assert(res.status === 201 || res.status === 200, `Expected 201/200, got ${res.status}`);
      assert(res.data.id, 'Post ID should be returned');
      postId = res.data.id;
      log(`  → Post créé avec ID: ${postId}`, 'green');
    });

    if (postId) {
      await test('POST /api/likes - Liker un post', async () => {
        const res = await makeRequest('POST', '/api/likes', { post_id: postId }, authToken);
        assert(res.status === 201 || res.status === 200, `Expected 201/200, got ${res.status}`);
        log(`  → Post liké`, 'green');
      });

      await test('DELETE /api/likes/:postId - Unliker un post', async () => {
        const res = await makeRequest('DELETE', `/api/likes/${postId}`, null, authToken);
        assert(res.status === 200 || res.status === 204, `Expected 200/204, got ${res.status}`);
        log(`  → Like retiré`, 'green');
      });

      await test('POST /api/comments - Commenter un post', async () => {
        const commentData = {
          post_id: postId,
          content: 'Great artwork!'
        };
        const res = await makeRequest('POST', '/api/comments', commentData, authToken);
        assert(res.status === 201 || res.status === 200, `Expected 201/200, got ${res.status}`);
        log(`  → Commentaire ajouté`, 'green');
      });
    }

    await test('POST /api/follows - Suivre un utilisateur', async () => {
      // Suivre l'utilisateur ID 1 (si existe)
      const res = await makeRequest('POST', '/api/follows', { following_id: 1 }, authToken);
      // Peut échouer si l'utilisateur n'existe pas ou si déjà suivi
      if (res.status === 201 || res.status === 200) {
        log(`  → Utilisateur suivi`, 'green');
      } else {
        log(`  ⚠️  Impossible de suivre (peut-être déjà suivi ou utilisateur inexistant)`, 'yellow');
      }
    });

    await test('GET /api/orders - Récupérer ses commandes', async () => {
      const res = await makeRequest('GET', '/api/orders', null, authToken);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(Array.isArray(res.data), 'Response should be an array');
      log(`  → ${res.data.length} commandes récupérées`, 'green');
    });

    if (productId) {
      await test('POST /api/orders - Créer une commande', async () => {
        const orderData = {
          items: [
            { product_id: productId, quantity: 1 }
          ],
          shipping_address: {
            street: '123 Test St',
            city: 'Paris',
            postal_code: '75001',
            country: 'France'
          }
        };
        const res = await makeRequest('POST', '/api/orders', orderData, authToken);
        assert(res.status === 201 || res.status === 200, `Expected 201/200, got ${res.status}`);
        log(`  → Commande créée`, 'green');
      });
    }

    await test('GET /api/messages - Récupérer ses messages', async () => {
      const res = await makeRequest('GET', '/api/messages', null, authToken);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(Array.isArray(res.data), 'Response should be an array');
      log(`  → ${res.data.length} conversations récupérées`, 'green');
    });
  } else {
    log('\n⚠️  Tests artiste ignorés (pas de token d\'authentification)', 'yellow');
  }

  // ==========================================
  // TESTS DE SÉCURITÉ
  // ==========================================
  
  log('\n📋 PARTIE 4: TESTS DE SÉCURITÉ', 'blue');
  log('─────────────────────────────────────────\n', 'blue');

  await test('POST /api/posts sans auth - Devrait échouer', async () => {
    const res = await makeRequest('POST', '/api/posts', { title: 'Test' });
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
    log(`  → Accès refusé comme attendu`, 'green');
  });

  await test('PUT /api/users/:id sans auth - Devrait échouer', async () => {
    const res = await makeRequest('PUT', '/api/users/1', { bio: 'Hack' });
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
    log(`  → Accès refusé comme attendu`, 'green');
  });

  await test('POST /api/login avec mauvais credentials - Devrait échouer', async () => {
    const res = await makeRequest('POST', '/api/login', {
      email: 'wrong@test.com',
      password: 'wrongpassword'
    });
    assert(res.status === 401 || res.status === 400, `Expected 401/400, got ${res.status}`);
    log(`  → Connexion refusée comme attendu`, 'green');
  });

  // ==========================================
  // RÉSUMÉ
  // ==========================================
  
  log('\n═══════════════════════════════════════════', 'blue');
  log('📊 RÉSUMÉ DES TESTS', 'blue');
  log('═══════════════════════════════════════════\n', 'blue');

  log(`Total: ${results.total}`, 'cyan');
  log(`✅ Réussis: ${results.passed}`, 'green');
  log(`❌ Échoués: ${results.failed}`, 'red');
  log(`📈 Taux de réussite: ${((results.passed / results.total) * 100).toFixed(1)}%\n`, 'yellow');

  if (results.failed === 0) {
    log('🎉 Tous les tests sont passés!', 'green');
  } else {
    log('⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.', 'yellow');
  }

  log('\n═══════════════════════════════════════════\n', 'blue');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Lancer les tests
runTests().catch(error => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
