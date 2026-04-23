const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'https://chibi-vulture.vercel.app',
  'https://chibi-v-store-expo-main.vercel.app',
].filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');
}

// Routes publiques qui n'ont pas besoin d'un origin navigateur
const PUBLIC_PATHS = ['/api/manifest.json'];

module.exports = {
  handleCors: (req, res) => {
    const origin = req.headers['origin'];
    const isProd = process.env.NODE_ENV === 'production';
    const isMobileApp = !origin; // Les requêtes fetch depuis mobile n'ont souvent pas d'Origin
    const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
    const isAllowed = isAllowedOrigin || isMobileApp;
    const path = req.url?.split('?')[0] || '';
    const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p));

    // En production : bloquer les requêtes sans origin valide (sauf mobile et routes publiques)
    if (isProd && !isAllowed && !isPublic) {
      // Ne pas exposer les origines autorisées dans la réponse de rejet
      res.status(403).json({ error: 'Forbidden' });
      return true; // bloqué — pas de headers CORS sur les requêtes rejetées
    } else if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Dev sans origin ou app mobile → pas de header CORS restrictif
      // (les requêtes sans Origin ne sont pas soumises à la politique CORS du navigateur)
      if (process.env.NODE_ENV !== 'production') {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
      }
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
