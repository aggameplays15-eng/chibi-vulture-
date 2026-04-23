require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  // 1. Tables existantes
  const { rows: tables } = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('\n=== TABLES EN DB ===');
  tables.forEach(r => console.log(' ✓', r.table_name));

  // 2. Vérifier chaque table critique
  const required = [
    'users', 'posts', 'likes', 'comments', 'follows', 'messages', 'conversations',
    'products', 'orders', 'order_items', 'notifications',
    'stories', 'announcements',
    'push_subscriptions', 'app_settings',
    'product_categories',
    'delivery_tracking_events',
    'revoked_tokens',
    'password_reset_tokens',
    'security_log', 'ip_bans',
    'rate_limit_log', 'rate_limit_violations',
    'user_otp',
  ];

  const existing = new Set(tables.map(r => r.table_name));
  console.log('\n=== AUDIT TABLES REQUISES ===');
  const missing = [];
  for (const t of required) {
    if (existing.has(t)) {
      console.log(' ✅', t);
    } else {
      console.log(' ❌ MANQUANTE:', t);
      missing.push(t);
    }
  }

  // 3. Vérifier colonnes critiques
  console.log('\n=== COLONNES CRITIQUES ===');
  const colChecks = [
    ['orders', 'shipping_address'],
    ['orders', 'phone'],
    ['orders', 'status'],
    ['products', 'category'],
    ['products', 'is_featured'],
    ['products', 'stock'],
    ['products', 'description'],
    ['users', 'avatar_image'],
    ['users', 'is_approved'],
    ['users', 'status'],
    ['comments', 'parent_id'],
    ['posts', 'reports'],
  ];

  for (const [table, col] of colChecks) {
    if (!existing.has(table)) { console.log(` ⚠️  ${table}.${col} — table manquante`); continue; }
    const { rows } = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2",
      [table, col]
    );
    if (rows.length > 0) {
      console.log(` ✅ ${table}.${col}`);
    } else {
      console.log(` ❌ COLONNE MANQUANTE: ${table}.${col}`);
    }
  }

  console.log('\n=== RÉSUMÉ ===');
  if (missing.length === 0) {
    console.log('✅ Toutes les tables requises existent.');
  } else {
    console.log('❌ Tables manquantes:', missing.join(', '));
  }

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
