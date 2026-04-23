const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  // GET - Public endpoint to get app settings
  if (req.method === 'GET') {
    try {
      const { rows } = await db.query(
        "SELECT key, value FROM app_settings WHERE key IN ('app_name', 'app_logo', 'app_logo_header', 'app_logo_home', 'pwa_icon', 'app_description', 'primary_color')"
      );
      
      const settings = rows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      const defaults = {
        app_name: 'Chibi Vulture',
        app_logo: '/favicon.ico',
        app_logo_header: '/favicon.ico',
        app_logo_home: '/favicon.ico',
        pwa_icon: null,
        app_description: 'Le réseau social artistique',
        primary_color: '#EC4899',
      };

      // Fallback for separated logos
      if (settings.app_logo) {
        if (!settings.app_logo_header) settings.app_logo_header = settings.app_logo;
        if (!settings.app_logo_home) settings.app_logo_home = settings.app_logo;
      }

      res.status(200).json({ ...defaults, ...settings });
    } catch (error) {
      console.error('[App Settings] Error:', error);
      // Return defaults on error
      res.status(200).json({
        app_name: 'Chibi Vulture',
        app_logo: '/favicon.ico',
        app_logo_header: '/favicon.ico',
        app_logo_home: '/favicon.ico',
        app_description: 'Le réseau social artistique',
        primary_color: '#EC4899',
      });
    }
    return;
  }

  // PUT - Admin only - Update app settings
  if (req.method === 'PUT') {
    const user = await auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Auth required' });
    if (user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });

    const { app_name, app_logo, app_logo_header, app_logo_home, pwa_icon, app_description, primary_color } = req.body;

    // Limiter la taille des logos base64 (max 500KB)
    const MAX_LOGO_SIZE = 500 * 1024;
    for (const [key, val] of Object.entries({ app_logo, app_logo_header, app_logo_home, pwa_icon })) {
      if (val && typeof val === 'string' && val.startsWith('data:') && val.length > MAX_LOGO_SIZE) {
        return res.status(400).json({ error: `${key} trop volumineux (max 500KB)` });
      }
    }
    
    try {
      const settings = [
        { key: 'app_name',        value: app_name },
        { key: 'app_logo',        value: app_logo },
        { key: 'app_logo_header', value: app_logo_header },
        { key: 'app_logo_home',   value: app_logo_home },
        { key: 'pwa_icon',        value: pwa_icon },
        { key: 'app_description', value: app_description },
        { key: 'primary_color',   value: primary_color },
      ].filter(s => s.value !== undefined);

      await Promise.all(settings.map(({ key, value }) => 
        db.query(`
          INSERT INTO app_settings (key, value, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
        `, [key, value])
      ));


      res.status(200).json({ success: true, message: 'Settings updated' });
    } catch (error) {
      console.error('[App Settings] Update error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
