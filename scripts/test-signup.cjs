#!/usr/bin/env node
/**
 * Test de création de compte
 * Diagnostique les problèmes potentiels
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testSignup() {
  console.log('\n🔍 Diagnostic de création de compte\n');

  // 1. Vérifier la table users
  console.log('📊 Vérification de la table users...');
  try {
    const { rows: tableCheck } = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    if (tableCheck.length === 0) {
      console.error('❌ La table users n\'existe pas !');
      await pool.end();
      return;
    }

    console.log('✅ Table users existe');
    console.log('\nColonnes disponibles:');
    tableCheck.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '* REQUIS' : ''}`);
    });

    // Vérifier les colonnes requises
    const requiredColumns = ['id', 'name', 'handle', 'email', 'password', 'is_approved'];
    const existingColumns = tableCheck.map(c => c.column_name);
    const missingColumns = requiredColumns.filter(c => !existingColumns.includes(c));

    if (missingColumns.length > 0) {
      console.error(`\n❌ Colonnes manquantes: ${missingColumns.join(', ')}`);
    } else {
      console.log('\n✅ Toutes les colonnes requises sont présentes');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await pool.end();
    return;
  }

  // 2. Vérifier les contraintes (unique sur email et handle)
  console.log('\n🔒 Vérification des contraintes...');
  try {
    const { rows: constraints } = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'users'
    `);

    console.log('Contraintes actives:');
    constraints.forEach(c => {
      console.log(`  - ${c.constraint_name} (${c.constraint_type})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  // 3. Lister les utilisateurs existants
  console.log('\n👥 Utilisateurs existants:');
  try {
    const { rows: users } = await pool.query(`
      SELECT id, name, handle, email, is_approved, status, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (users.length === 0) {
      console.log('  ℹ️  Aucun utilisateur dans la base');
    } else {
      users.forEach(u => {
        const status = u.is_approved ? '✅' : '⏳';
        console.log(`  ${status} ${u.name} (${u.handle}) - ${u.email}`);
        console.log(`     ID: ${u.id}, Statut: ${u.status || 'Actif'}, Créé: ${u.created_at}`);
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  // 4. Test de création d'un compte
  console.log('\n🧪 Test de création d\'un compte...');
  const testUser = {
    name: 'Test User',
    handle: '@testuser' + Date.now(),
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123',
    bio: 'Compte de test',
    avatarColor: '#94a3b8'
  };

  console.log(`Tentative de création: ${testUser.name} (${testUser.handle})`);

  try {
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, handle, email, bio, avatar_color, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, handle, email, is_approved, status',
      [
        testUser.name,
        testUser.handle.toLowerCase(),
        testUser.email.toLowerCase(),
        testUser.bio,
        testUser.avatarColor,
        hashedPassword
      ]
    );

    const user = rows[0];
    console.log('✅ Compte créé avec succès !');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nom: ${user.name}`);
    console.log(`   Handle: ${user.handle}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Approuvé: ${user.is_approved ? 'Oui' : 'Non (en attente)'}`);
    console.log(`   Statut: ${user.status || 'Actif'}`);

    // Nettoyer le compte de test
    console.log('\n🧹 Nettoyage du compte de test...');
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    console.log('✅ Compte de test supprimé');

  } catch (error) {
    console.error('❌ Échec de création:', error.message);
    if (error.code === '23505') {
      console.error('   → Handle ou email déjà utilisé');
    } else if (error.code === '23502') {
      console.error('   → Champ requis manquant');
    } else {
      console.error('   → Code erreur:', error.code);
    }
  }

  // 5. Vérifier les validations
  console.log('\n✅ Validations requises pour la création de compte:');
  console.log('  - Nom: 2-50 caractères');
  console.log('  - Handle: @username (3-20 caractères alphanumériques + _)');
  console.log('  - Email: format email valide');
  console.log('  - Mot de passe: minimum 8 caractères');
  console.log('  - Email admin réservé:', process.env.ADMIN_EMAIL);

  // 6. Vérifier le rate limiting
  console.log('\n⏱️  Rate limiting signup:');
  console.log('  - Maximum: 3 tentatives par heure');
  console.log('  - Burst: 2 tentatives en 30 secondes');

  await pool.end();
}

testSignup().catch(console.error);
