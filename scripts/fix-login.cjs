#!/usr/bin/env node
/**
 * Script de dépannage pour les problèmes de connexion
 * - Vérifie la config email
 * - Teste la connexion admin
 * - Approuve les comptes en attente
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('\n🔍 Diagnostic des problèmes de connexion...\n');

  // 1. Vérifier la configuration
  console.log('📋 Configuration actuelle:');
  console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || '❌ NON DÉFINI'}`);
  console.log(`   ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? '✅ Défini' : '❌ NON DÉFINI'}`);
  console.log(`   ADMIN_PASSWORD_HASH: ${process.env.ADMIN_PASSWORD_HASH ? '✅ Défini' : '❌ NON DÉFINI'}`);
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || '❌ NON DÉFINI'}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER || '❌ NON DÉFINI'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

  // 2. Vérifier les tables nécessaires
  console.log('\n📊 Vérification des tables...');
  try {
    const tables = ['users', 'admin_otp', 'user_otp'];
    for (const table of tables) {
      const { rows } = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      console.log(`   ${table}: ${rows[0].exists ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
  }

  // 3. Lister les utilisateurs en attente d'approbation
  console.log('\n👥 Utilisateurs en attente d\'approbation:');
  try {
    const { rows } = await pool.query(
      'SELECT id, name, handle, email, created_at FROM users WHERE is_approved = false ORDER BY created_at DESC'
    );
    if (rows.length === 0) {
      console.log('   ✅ Aucun utilisateur en attente');
    } else {
      rows.forEach(user => {
        console.log(`   - ${user.name} (${user.handle}) - ${user.email}`);
        console.log(`     ID: ${user.id}, Créé: ${user.created_at}`);
      });
    }
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
  }

  // 4. Proposer des actions
  console.log('\n🔧 Actions disponibles:');
  console.log('   1. Approuver TOUS les utilisateurs en attente');
  console.log('   2. Vérifier le hash du mot de passe admin');
  console.log('   3. Désactiver temporairement l\'OTP (mode dev)');
  console.log('   4. Quitter');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('\nChoisissez une action (1-4): ', async (answer) => {
    switch (answer.trim()) {
      case '1':
        await approveAllUsers();
        break;
      case '2':
        await verifyAdminPassword();
        break;
      case '3':
        console.log('\n💡 Pour désactiver l\'OTP en développement:');
        console.log('   Modifiez handlers/admin-login.js et handlers/login.js');
        console.log('   Commentez la partie OTP et retournez directement le token JWT');
        break;
      case '4':
        console.log('\n👋 Au revoir!');
        break;
      default:
        console.log('\n❌ Option invalide');
    }
    readline.close();
    await pool.end();
  });
}

async function approveAllUsers() {
  console.log('\n✅ Approbation de tous les utilisateurs...');
  try {
    const { rowCount } = await pool.query(
      'UPDATE users SET is_approved = true WHERE is_approved = false'
    );
    console.log(`   ✅ ${rowCount} utilisateur(s) approuvé(s)`);
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
  }
}

async function verifyAdminPassword() {
  console.log('\n🔐 Vérification du mot de passe admin...');
  const password = process.env.ADMIN_PASSWORD;
  const hash = process.env.ADMIN_PASSWORD_HASH;

  if (!password && !hash) {
    console.log('   ❌ Aucun mot de passe admin configuré');
    return;
  }

  if (hash) {
    if (password) {
      const match = await bcrypt.compare(password, hash);
      console.log(`   Hash vs Password: ${match ? '✅ Correspond' : '❌ Ne correspond pas'}`);
    } else {
      console.log('   ⚠️  Hash défini mais pas de mot de passe en clair pour vérifier');
    }
  } else {
    console.log('   ⚠️  Utilisation du mot de passe en clair (mode dev uniquement)');
    console.log(`   Mot de passe: ${password}`);
  }
}

main().catch(console.error);
