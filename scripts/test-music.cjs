const http = require('http');
require('dotenv').config();

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
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
  let token, trackId;

  console.log('\n========== TEST MUSIC API ==========\n');

  // 1. Login
  console.log('1. LOGIN...');
  const login = await req('POST', '/api/login', { email: 'admin@chibi.com', password: process.env.ADMIN_PASSWORD });
  if (login.status !== 200) { console.log('   ✗ Login échoué:', login.body); process.exit(1); }
  token = login.body.token;
  console.log('   ✓ Connecté');

  // 2. GET playlist vide
  console.log('\n2. GET PLAYLIST (vide)...');
  const empty = await req('GET', '/api/music');
  if (empty.status === 200 && Array.isArray(empty.body)) {
    console.log(`   ✓ ${empty.body.length} piste(s)`);
  } else {
    console.log('   ✗', empty.status, empty.body);
  }

  // 3. Ajouter une musique (URL complète)
  console.log('\n3. ADD TRACK (URL complète)...');
  const add1 = await req('POST', '/api/music', {
    title: 'Lofi Hip Hop Radio',
    artist: 'ChilledCow',
    youtube_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
  }, token);
  if (add1.status === 201 && add1.body.id) {
    trackId = add1.body.id;
    console.log(`   ✓ Piste ajoutée (id=${trackId}, youtube_id=${add1.body.youtube_id})`);
  } else {
    console.log('   ✗', add1.status, add1.body);
  }

  // 4. Ajouter avec youtu.be
  console.log('\n4. ADD TRACK (youtu.be)...');
  const add2 = await req('POST', '/api/music', {
    title: 'Chill Beats',
    artist: 'Test Artist',
    youtube_url: 'https://youtu.be/5qap5aO4i9A'
  }, token);
  if (add2.status === 201) {
    console.log(`   ✓ Piste ajoutée (youtube_id=${add2.body.youtube_id})`);
  } else {
    console.log('   ✗', add2.status, add2.body);
  }

  // 5. Ajouter avec ID direct
  console.log('\n5. ADD TRACK (ID direct)...');
  const add3 = await req('POST', '/api/music', {
    title: 'Study Music',
    youtube_url: 'DWcJFNfaw9c'
  }, token);
  if (add3.status === 201) {
    console.log(`   ✓ Piste ajoutée (youtube_id=${add3.body.youtube_id})`);
  } else {
    console.log('   ✗', add3.status, add3.body);
  }

  // 6. URL invalide
  console.log('\n6. ADD TRACK (URL invalide)...');
  const bad = await req('POST', '/api/music', {
    title: 'Bad',
    youtube_url: 'https://notayoutube.com/video'
  }, token);
  if (bad.status === 400) {
    console.log('   ✓ Rejeté correctement:', bad.body.error);
  } else {
    console.log('   ✗ Devrait être 400, reçu:', bad.status);
  }

  // 7. Sans auth
  console.log('\n7. ADD TRACK (sans auth)...');
  const noauth = await req('POST', '/api/music', { title: 'X', youtube_url: 'jfKfPfyJRdk' });
  if (noauth.status === 403) {
    console.log('   ✓ Accès refusé correctement');
  } else {
    console.log('   ✗ Devrait être 403, reçu:', noauth.status);
  }

  // 8. GET playlist remplie
  console.log('\n8. GET PLAYLIST (remplie)...');
  const full = await req('GET', '/api/music');
  if (full.status === 200 && Array.isArray(full.body)) {
    console.log(`   ✓ ${full.body.length} piste(s) actives`);
    full.body.forEach(t => console.log(`     - "${t.title}" (${t.youtube_id})`));
  } else {
    console.log('   ✗', full.body);
  }

  // 9. PATCH — désactiver une piste
  if (trackId) {
    console.log('\n9. PATCH (désactiver)...');
    const patch = await req('PATCH', '/api/music', { id: trackId, is_active: false }, token);
    if (patch.status === 200 && patch.body.is_active === false) {
      console.log('   ✓ Piste désactivée');
    } else {
      console.log('   ✗', patch.status, patch.body);
    }

    // 10. GET — piste désactivée ne doit plus apparaître
    console.log('\n10. GET après désactivation...');
    const after = await req('GET', '/api/music');
    const found = after.body.find((t) => t.id === trackId);
    if (!found) {
      console.log('   ✓ Piste masquée dans la playlist publique');
    } else {
      console.log('   ✗ Piste encore visible');
    }

    // 11. DELETE
    console.log('\n11. DELETE TRACK...');
    const del = await req('DELETE', `/api/music?id=${trackId}`, null, token);
    if (del.status === 200) {
      console.log('   ✓ Piste supprimée');
    } else {
      console.log('   ✗', del.status, del.body);
    }
  }

  // Cleanup — supprimer les autres pistes de test
  const cleanup = await req('GET', '/api/music');
  if (Array.isArray(cleanup.body)) {
    for (const t of cleanup.body) {
      if (['Chill Beats', 'Study Music'].includes(t.title)) {
        await req('DELETE', `/api/music?id=${t.id}`, null, token);
      }
    }
    // Also get inactive ones via direct DB check would be needed, but skip for now
  }

  console.log('\n========== FIN DES TESTS ==========\n');
}

run().catch(console.error);
