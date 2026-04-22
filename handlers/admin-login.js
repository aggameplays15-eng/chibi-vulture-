const crypto = require('crypto');
const { handleCors } = require('./_lib/cors');
const { rateLimit } = require('./_lib/rateLimit');
const bcrypt = require('bcryptjs');
const db = require('./_lib/db');
const { logAuthFailure } = require('./_lib/security');
const { sendEmail } = require('./_lib/email');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD_PLAIN)) {
  console.warn('WARNING: ADMIN credentials not set in environment variables');
}

// Generate a 6-digit OTP, store its hash, send by email
async function issueOtp() {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes (augmenté pour production)

  // Invalidate any previous unused OTPs
  await db.query(`UPDATE admin_otp SET used = TRUE WHERE used = FALSE`);

  await db.query(
    `INSERT INTO admin_otp (code_hash, expires_at) VALUES ($1, $2)`,
    [codeHash, expiresAt]
  );

  return code;
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const limit = await rateLimit(req, 'admin-login');
  Object.entries(limit.headers).forEach(([k, v]) => res.setHeader(k, v));
  if (!limit.allowed) {
    return res.status(429).json({ error: 'Too many attempts.', retryAfter: limit.resetInSeconds });
  }

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  if (!ADMIN_EMAIL || (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD_PLAIN)) {
    return res.status(500).json({ error: 'Admin credentials not configured' });
  }

  // Timing-safe email check
  const emailOk = crypto.timingSafeEqual(
    Buffer.from(String(email).padEnd(100)),
    Buffer.from(String(ADMIN_EMAIL).padEnd(100))
  );

  // Password check — bcrypt hash in prod, plain fallback in dev
  let passOk = false;
  if (ADMIN_PASSWORD_HASH) {
    passOk = await bcrypt.compare(String(password), ADMIN_PASSWORD_HASH);
  } else if (process.env.NODE_ENV !== 'production' && ADMIN_PASSWORD_PLAIN) {
    passOk = crypto.timingSafeEqual(
      Buffer.from(String(password).padEnd(100)),
      Buffer.from(String(ADMIN_PASSWORD_PLAIN).padEnd(100))
    );
  }

  if (!emailOk || !passOk) {
    await logAuthFailure(req);
    return res.status(401).json({ error: 'Access denied' });
  }

  // MODE DEV: Skip OTP in development
  if (process.env.NODE_ENV === 'development') {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { email: ADMIN_EMAIL, role: 'Admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('🔓 [DEV MODE] Admin login without OTP');
    return res.status(200).json({ token, role: 'Admin' });
  }

  try {
    const code = await issueOtp();

    // Send OTP async — don't block the response
    res.status(200).json({ otpRequired: true });

    sendEmail(ADMIN_EMAIL, 'adminOtp', { code }).then(sent => {
      if (!sent && process.env.NODE_ENV !== 'production') {
        console.warn(`[2FA] SMTP not configured — OTP code: ${code}`);
      }
      // Log OTP en production pour debug (à retirer après résolution)
      console.log(`[2FA] Admin OTP généré: ${code} (expire dans 30 min)`);
    }).catch(err => console.error('[2FA] Email send error:', err));

  } catch (error) {
    console.error('Admin login error:', error);
    if (!res.headersSent) return res.status(500).json({ error: 'Login failed' });
  }
};
