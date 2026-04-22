#!/usr/bin/env node
/**
 * Test complet de l'API de création de compte
 * Simule une requête depuis le frontend
 */

require('dotenv').config();

async function testSignupAPI() {
  console.log('\n🧪 Test de l\'API de création de compte\n');

  const API_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const testUser = {
    name: 'Test User API',
    handle: '@testapi' + Date.now(),
    email: `testapi${Date.now()}@example.com`,
    password: 'TestPassword123',
    bio: 'Test depuis script',
    avatarColor: '#3b82f6'
  };

  console.log('📋 Données de test:');
  console.log(`   Nom: ${testUser.name}`);
  console.log(`   Handle: ${testUser.handle}`);
  console.log(`   Email: ${testUser.email}`);
  console.log(`   Mot de passe: ${testUser.password}`);

  // Test 1: Vérifier que l'API est accessible
  console.log('\n🔌 Test 1: Vérification de l\'accessibilité de l\'API...');
  try {
    const healthCheck = await fetch(`${API_URL}/api/app-settings`);
    if (healthCheck.ok) {
      console.log('✅ API accessible');
    } else {
      console.log(`⚠️  API répond avec status ${healthCheck.status}`);
    }
  } catch (error) {
    console.error('❌ API non accessible:', error.message);
    console.log('\n💡 Assurez-vous que le serveur est démarré:');
    console.log('   npm run dev');
    return;
  }

  // Test 2: Tentative de création de compte
  console.log('\n📝 Test 2: Création de compte...');
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Compte créé avec succès !');
      console.log(`   ID: ${data.id}`);
      console.log(`   Nom: ${data.name}`);
      console.log(`   Handle: ${data.handle}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Approuvé: ${data.isApproved ? 'Oui' : 'Non (en attente)'}`);
      console.log(`   Statut: ${data.status || 'Actif'}`);

      // Nettoyer
      console.log('\n🧹 Nettoyage...');
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query('DELETE FROM users WHERE id = $1', [data.id]);
      await pool.end();
      console.log('✅ Compte de test supprimé');

    } else {
      const error = await response.json();
      console.error('❌ Échec de création:', error.error || error);

      // Diagnostics supplémentaires
      if (response.status === 400) {
        console.log('\n🔍 Erreur de validation (400):');
        console.log('   Vérifiez que:');
        console.log('   - Le nom fait entre 2 et 50 caractères');
        console.log('   - Le handle commence par @ et fait 3-20 caractères');
        console.log('   - L\'email est valide');
        console.log('   - Le mot de passe fait au moins 8 caractères');
      } else if (response.status === 409) {
        console.log('\n🔍 Conflit (409):');
        console.log('   Le handle ou l\'email existe déjà');
      } else if (response.status === 429) {
        console.log('\n🔍 Rate limit (429):');
        console.log('   Trop de tentatives. Attendez quelques minutes.');
      } else if (response.status === 500) {
        console.log('\n🔍 Erreur serveur (500):');
        console.log('   Vérifiez les logs du serveur');
      }
    }

  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }

  // Test 3: Vérifier les validations
  console.log('\n🔒 Test 3: Vérification des validations...');

  const invalidTests = [
    {
      name: 'Nom trop court',
      data: { ...testUser, name: 'A' },
      expectedError: 'Invalid name'
    },
    {
      name: 'Handle sans @',
      data: { ...testUser, handle: 'testuser' },
      expectedError: 'Invalid handle format'
    },
    {
      name: 'Email invalide',
      data: { ...testUser, email: 'invalid-email' },
      expectedError: 'Invalid email format'
    },
    {
      name: 'Mot de passe trop court',
      data: { ...testUser, password: '123' },
      expectedError: 'Password must be at least 8 characters'
    }
  ];

  for (const test of invalidTests) {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.data)
      });

      if (response.status === 400) {
        const error = await response.json();
        if (error.error.includes(test.expectedError.split(' ')[0])) {
          console.log(`   ✅ ${test.name}: Validation OK`);
        } else {
          console.log(`   ⚠️  ${test.name}: Erreur différente - ${error.error}`);
        }
      } else {
        console.log(`   ❌ ${test.name}: Devrait retourner 400, reçu ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: Erreur - ${error.message}`);
    }
  }

  // Test 4: Vérifier le rate limiting
  console.log('\n⏱️  Test 4: Rate limiting...');
  console.log('   Info: Maximum 3 tentatives par heure');
  console.log('   Info: Burst de 2 tentatives en 30 secondes');

  console.log('\n✅ Tests terminés !');
  console.log('\n💡 Si vous ne pouvez pas créer de compte:');
  console.log('   1. Vérifiez que le serveur est démarré');
  console.log('   2. Vérifiez les logs du serveur pour les erreurs');
  console.log('   3. Vérifiez que vous n\'avez pas atteint le rate limit');
  console.log('   4. Essayez avec un autre handle/email');
  console.log('   5. Vérifiez la connexion à la base de données');
}

testSignupAPI().catch(console.error);
