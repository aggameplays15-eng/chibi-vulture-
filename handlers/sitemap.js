const db = require('./_lib/db');

module.exports = async (req, res) => {
  const baseUrl = 'https://chibi-vulture.vercel.app';
  
  try {
    // Fetch all users and posts for the sitemap
    const [users, posts] = await Promise.all([
      db.query('SELECT handle FROM users WHERE status = $1', ['Actif']),
      db.query('SELECT id FROM posts ORDER BY created_at DESC LIMIT 1000')
    ]);

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/feed</loc>
    <priority>0.9</priority>
    <changefreq>always</changefreq>
  </url>
  <url>
    <loc>${baseUrl}/store</loc>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>`;

    // Add profile URLs
    users.rows.forEach(u => {
      const handle = u.handle.startsWith('@') ? u.handle.slice(1) : u.handle;
      sitemap += `
  <url>
    <loc>${baseUrl}/profile/${encodeURIComponent(handle)}</loc>
    <priority>0.7</priority>
    <changefreq>weekly</changefreq>
  </url>`;
    });

    // Add post URLs
    posts.rows.forEach(p => {
      sitemap += `
  <url>
    <loc>${baseUrl}/post/${p.id}</loc>
    <priority>0.6</priority>
    <changefreq>monthly</changefreq>
  </url>`;
    });

    sitemap += '\n</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating sitemap');
  }
};
