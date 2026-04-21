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
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

  try {
    const code = await issueOtp();

    // Send OTP by email
    const sent = await sendEmail(ADMIN_EMAIL, 'adminOtp', { code });

    // In dev without SMTP, return code directly (never in production)
    if (!sent && process.env.NODE_ENV !== 'production') {
      console.warn(`[2FA] SMTP not configured — OTP code: ${code}`);
    }

    return res.status(200).json({ otpRequired: true });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};
