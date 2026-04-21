// Local development server — simulates Vercel serverless functions
require('dotenv').config();

const express = require('express');
const app = express();
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

// Body size limit — prevent DoS via large payloads
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

// Security headers (helmet-like, without the dependency)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Load the main API router
const apiHandler = require('./api/index.js');

// Adapter: convert Express req/res to Vercel-style handler
function vercelAdapter(handler) {
  return async (req, res) => {
    if (!res.status) {
      res.status = (code) => { res.statusCode = code; return res; };
    }
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      return originalJson(data);
    };
    try {
      await handler(req, res);
    } catch (err) {
      console.error('Handler error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
  };
}

app.all('/api/*path', vercelAdapter(apiHandler));

app.listen(PORT, () => {
  console.log(`✅ API server running on http://localhost:${PORT}`);
});
