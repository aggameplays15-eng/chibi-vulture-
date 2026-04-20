const db = require('./_lib/db');
const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  // GET - Public endpoint to get app settings
  if (req.method === 'GET') {
    try {
      const { rows } = await db.query(
        "SELECT key, value FROM app_settings WHERE key IN ('app_name', 'app_logo', 'app_description', 'primary_color')"
      );
      
      const settings = rows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      // Default values
      const defaults = {
        app_name: 'Chibi Vulture',
        app_logo: '/favicon.ico',
        app_description: 'Le réseau social artistique',
        primary_color: '#EC4899',
      };

      res.status(200).json({ ...defaults, ...settings });
    } catch (error) {
      console.error('[App Settings] Error:', error);
      // Return defaults on error
      res.status(200).json({
        app_name: 'Chibi Vulture',
        app_logo: '/favicon.ico',
        app_description: 'Le réseau social artistique',
        primary_color: '#EC4899',
      });
    }
    return;
  }

  // PUT - Admin only - Update app settings
  if (req.method === 'PUT') {
    const user = auth.verify(req, true); // requireAdmin = true
    if (!user) return res.status(401).json({ error: 'Admin access required' });

    const { app_name, app_logo, app_description, primary_color } = req.body;
    
    try {
      // Update or insert each setting
      const settings = [
        { key: 'app_name', value: app_name },
        { key: 'app_logo', value: app_logo },
        { key: 'app_description', value: app_description },
        { key: 'primary_color', value: primary_color },
      ].filter(s => s.value !== undefined);

      for (const { key, value } of settings) {
        await db.query(`
          INSERT INTO app_settings (key, value, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
        `, [key, value]);
      }

      res.status(200).json({ success: true, message: 'Settings updated' });
    } catch (error) {
      console.error('[App Settings] Update error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
