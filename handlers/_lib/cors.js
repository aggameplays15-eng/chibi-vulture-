// CORS handler — restricts origins in production
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

module.exports = {
  handleCors: (req, res) => {
    const origin = req.headers['origin'];
    const allowed = !origin || ALLOWED_ORIGINS.includes(origin);

    res.setHeader('Access-Control-Allow-Origin', allowed ? (origin || '*') : ALLOWED_ORIGINS[0]);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    // Removed X-Admin-Email and X-Admin-Password from exposed headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return true;
    }
    return false;
  }
};
