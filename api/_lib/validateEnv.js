// Environment variable validation
// This ensures all required environment variables are set before the app starts

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

const optionalEnvVars = [
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'REDIS_URL',
  'FRONTEND_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
];

function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional variables and warn if missing
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  // Report missing required variables
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please set these in your environment or Vercel dashboard.`
    );
  }

  // Report warnings for optional variables
  if (warnings.length > 0) {
    console.warn(`Optional environment variables not set: ${warnings.join(', ')}`);
    console.warn('Some features may not work correctly without these variables.');
  }

  // Validate specific variable formats
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security.');
  }

  if (process.env.ADMIN_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.ADMIN_EMAIL)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  return true;
}

module.exports = { validateEnv, requiredEnvVars, optionalEnvVars };
