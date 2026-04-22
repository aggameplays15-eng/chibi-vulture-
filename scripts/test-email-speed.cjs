#!/usr/bin/env node
/**
 * Test de vitesse d'envoi des emails OTP
 * Mesure le temps d'envoi et donne des recommandations
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailSpeed() {
  console.log('\n📧 Test de vitesse d\'envoi des emails OTP\n');

  // Vérifier la config
  console.log('Configuration SMTP:');
  console.log(`  Host: ${process.env.SMTP_HOST}`);
  console.log(`  Port: ${process.env.SMTP_PORT}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log(`  Secure: ${process.env.SMTP_SECURE}`);

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('\n❌ Configuration SMTP incomplète');
    return;
  }

  // Créer le transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Test de connexion
  console.log('\n🔌 Test de connexion SMTP...');
  try {
    const startConnect = Date.now();
    await transporter.verify();
    const connectTime = Date.now() - startConnect;
    console.log(`✅ Connexion réussie (${connectTime}ms)`);
  } catch (error) {
    console.error('❌ Échec de connexion:', error.message);
    return;
  }

  // Test d'envoi d'email
  console.log('\n📨 Envoi d\'un email de test...');
  const testCode = '123456';
  const testEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  try {
    const startSend = Date.now();
    await transporter.sendMail({
      from: `"Test OTP" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: testEmail,
      subject: `🔐 Test OTP: ${testCode}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h2>Test de vitesse OTP</h2>
          <div style="text-align:center;padding:20px;background:#f5f5f5;border-radius:8px;">
            <p style="font-size:36px;font-weight:bold;letter-spacing:8px;margin:0;">${testCode}</p>
          </div>
          <p style="color:#666;font-size:12px;margin-top:20px;">
            Email envoyé à ${new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
      `
    });
    const sendTime = Date.now() - startSend;
    console.log(`✅ Email envoyé avec succès (${sendTime}ms)`);

    // Analyse des performances
    console.log('\n📊 Analyse des performances:');
    if (sendTime < 1000) {
      console.log('  ✅ Excellent (<1s) - Pas de problème');
    } else if (sendTime < 3000) {
      console.log('  ⚠️  Acceptable (1-3s) - Peut être amélioré');
    } else if (sendTime < 10000) {
      console.log('  ⚠️  Lent (3-10s) - Problème de latence');
    } else {
      console.log('  ❌ Très lent (>10s) - Problème majeur');
    }

    console.log('\n💡 Recommandations:');
    console.log('  1. Vérifiez votre boîte mail pour voir le délai de réception réel');
    console.log('  2. Gmail peut prendre 30s-2min en fonction de la charge');
    console.log('  3. Le code OTP est maintenant dans le sujet de l\'email pour plus de rapidité');
    console.log('  4. Le délai d\'expiration a été augmenté à 30 minutes');
    console.log('  5. Les codes OTP sont loggés dans la console du serveur');

    console.log('\n🔍 Vérifiez maintenant votre email à:', testEmail);

  } catch (error) {
    console.error('❌ Échec d\'envoi:', error.message);
  }
}

testEmailSpeed().catch(console.error);
