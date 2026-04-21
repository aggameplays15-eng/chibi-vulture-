// CORS handler — restricts origins in production
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : []
).concat([
  'http://localhost:5173',
  'http://localhost:3000',
]);

// Routes publiques qui n'ont pas besoin d'un origin navigateur
const PUBLIC_PATHS = ['/api/manifest.json'];

module.exports = {
  handleCors: (req, res) => {
    const origin = req.headers['origin'];
    const isProd = process.env.NODE_ENV === 'production';
    const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
    const path = req.url?.split('?')[0] || '';
    const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p));

    // En production : bloquer les requêtes sans origin valide (curl, Postman, etc.)
    // sauf pour les routes publiques explicitement autorisées
    if (isProd && !isAllowed && !isPublic) {
      // Ne pas exposer les origines autorisées dans la réponse de rejet
      res.status(403).json({ error: 'Forbidden' });
      return true; // bloqué — pas de headers CORS sur les requêtes rejetées
    } else if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Dev sans origin → autoriser localhost
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return true;
    }
    return false;
  }
};
