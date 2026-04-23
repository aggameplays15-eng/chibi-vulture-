// Manifest PWA dynamique — nom et icône depuis la DB
const db = require('./_lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();

  let settings = {};
  try {
    const { rows } = await db.query(
      "SELECT key, value FROM app_settings WHERE key IN ('app_name', 'app_logo', 'pwa_icon', 'primary_color', 'app_description')"
    );
    settings = rows.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
  } catch (error) {
    // Fallback silencieux en cas d'erreur DB
    console.error('Manifest DB error (using fallback):', error.message);
  }

  const appName    = settings.app_name    || 'Chibi Vulture';
  const shortName  = appName.length > 12 ? appName.substring(0, 12) : appName;
  const themeColor = settings.primary_color || '#EC4899';
  const pwaIcon    = settings.pwa_icon || settings.app_logo || null;
  const description = settings.app_description || 'Premium Art Community - Partagez votre art, découvrez des artistes, achetez des produits uniques';

  const icons = [];

  if (pwaIcon && pwaIcon.startsWith('data:image/')) {
    // Icône base64 uploadée depuis l'admin
    const mimeMatch = pwaIcon.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType  = mimeMatch ? mimeMatch[1] : 'image/png';
    icons.push(
      { src: pwaIcon, sizes: '192x192', type: mimeType, purpose: 'any' },
      { src: pwaIcon, sizes: '512x512', type: mimeType, purpose: 'maskable any' }
    );
  } else if (pwaIcon && pwaIcon.startsWith('http')) {
    icons.push(
      { src: pwaIcon, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: pwaIcon, sizes: '512x512', type: 'image/png', purpose: 'maskable any' }
    );
  } else {
    // Fallback icônes statiques
    icons.push(
      { src: '/favicon.ico',    sizes: '48x48',  type: 'image/x-icon' },
      { src: '/favicon.svg',    sizes: '48x48 72x72 96x96', type: 'image/svg+xml', purpose: 'any' },
      { src: '/logo.svg',       sizes: '128x128 192x192 256x256 512x512', type: 'image/svg+xml', purpose: 'any maskable' }
    );
  }

  const manifest = {
    name: appName,
    short_name: shortName,
    description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: themeColor,
    orientation: 'portrait',
    scope: '/',
    icons,
    categories: ['social', 'shopping', 'lifestyle'],
    prefer_related_applications: false,
  };

  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache
  res.status(200).json(manifest);
};
