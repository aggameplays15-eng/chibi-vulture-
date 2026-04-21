/**
 * Test d'envoi de tous les templates email — Chibi Vulture
 * Usage : node scripts/test-emails.cjs [email_destinataire]
 * Ex    : node scripts/test-emails.cjs papicamara22@gmail.com
 */
require('dotenv').config();
const { sendEmail } = require('../handlers/_lib/email');

const TO = process.argv[2] || process.env.ADMIN_EMAIL;
if (!TO) {
  console.error('❌ Fournis un email : node scripts/test-emails.cjs ton@email.com');
  process.exit(1);
}

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const tests = [
  {
    name: 'welcome',
    data: { name: 'Papi Camara', handle: '@papicamara' },
  },
  {
    name: 'orderConfirmation',
    data: {
      name: 'Papi Camara',
      orderId: 'ORD-TEST-001',
      items: [
        { name: 'T-Shirt Chibi Vulture', quantity: 2, price: 250000 },
        { name: 'Stickers Pack Kawaii',  quantity: 1, price: 125000 },
      ],
      total: 625000,
      shippingAddress: 'Kaloum, Conakry, Guinée',
      phone: '620 00 00 00',
    },
  },
  {
    name: 'newOrderAdmin',
    data: {
      orderId: 'ORD-TEST-001',
      customerName: 'Papi Camara',
      total: 625000,
      items: [
        { name: 'T-Shirt Chibi Vulture', quantity: 2, price: 250000 },
        { name: 'Stickers Pack Kawaii',  quantity: 1, price: 125000 },
      ],
      shippingAddress: 'Kaloum, Conakry, Guinée',
      phone: '620 00 00 00',
    },
  },
  {
    name: 'orderStatusUpdate',
    data: {
      name: 'Papi Camara',
      orderId: 'ORD-TEST-001',
      status: 'shipped',
      trackingNumber: 'CV-2024-XYZ',
      carrier: 'Chibi Express',
    },
  },
  {
    name: 'newFollower',
    data: {
      recipientName: 'Papi Camara',
      followerName: 'VultureKing',
      followerHandle: '@king',
    },
  },
  {
    name: 'newLike',
    data: {
      recipientName: 'Papi Camara',
      likerName: 'ChibiMomo',
      likerHandle: '@momo',
      postId: 42,
    },
  },
  {
    name: 'newComment',
    data: {
      recipientName: 'Papi Camara',
      commenterName: 'ArtLover',
      commenterHandle: '@artlover',
      postId: 42,
      commentText: 'Magnifique création ! J\'adore le style ✨',
    },
  },
  {
    name: 'newMessage',
    data: {
      recipientName: 'Papi Camara',
      senderName: 'VultureKing',
      senderHandle: '@king',
      preview: 'Salut ! Tu serais dispo pour une collab sur mon prochain projet ?',
    },
  },
  {
    name: 'accountApproved',
    data: { name: 'Papi Camara', handle: '@papicamara' },
  },
  {
    name: 'passwordReset',
    data: {
      name: 'Papi Camara',
      resetUrl: `${APP_URL}/reset-password?token=abc123def456`,
    },
  },
];

async function run() {
  console.log(`\n📧 Test des templates email → ${TO}`);
  console.log('─'.repeat(50));

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP non configuré dans .env (SMTP_HOST, SMTP_USER, SMTP_PASS requis)');
    process.exit(1);
  }

  console.log(`SMTP : ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (${process.env.SMTP_USER})\n`);

  let ok = 0, fail = 0;
  for (const t of tests) {
    process.stdout.write(`  Envoi "${t.name}"... `);
    const sent = await sendEmail(TO, t.name, t.data);
    if (sent) { console.log('✅'); ok++; }
    else       { console.log('❌'); fail++; }
    // Petite pause pour éviter le throttling Gmail
    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`Résultat : ✅ ${ok} envoyés  ❌ ${fail} échoués`);
  if (fail === 0) console.log('🎉 Tous les templates fonctionnent !');
  else console.log('⚠️  Vérifie les logs SMTP ci-dessus.');
}

run().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1); });
