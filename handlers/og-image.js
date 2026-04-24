const { ImageResponse } = require('@vercel/og');

module.exports = async (req, res) => {
  try {
    const { type, id } = req.query;

    if (!type || !id) {
      return res.status(400).json({ error: 'Missing type or id' });
    }

    // Configuration de base pour les images OG
    const font = await fetch(
      new URL('../../assets/Inter-Bold.ttf', import.meta.url)
    ).then((res) => res.arrayBuffer());

    let title = 'Chibi Vulture';
    let subtitle = 'Communauté d\'art';
    let image = null;

    // Selon le type, on génère une image OG différente
    if (type === 'post') {
      title = 'Nouveau Post';
      subtitle = 'Découvrez cette création';
    } else if (type === 'story') {
      title = 'Story';
      subtitle = 'Regardez maintenant';
    } else if (type === 'profile') {
      title = 'Profil';
      subtitle = 'Artiste';
    }

    const ogImage = new ImageResponse(
      (
        <div
          style={{
            fontSize: 128,
            background: 'linear-gradient(to bottom right, #1a1a2e, #16213e)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #ff6b6b, #feca57)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 32,
                opacity: 0.8,
              }}
            >
              {subtitle}
            </div>
            <div
              style={{
                fontSize: 24,
                opacity: 0.6,
                marginTop: 20,
              }}
            >
              chibivulture.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: font,
            style: 'normal',
            weight: 700,
          },
        ],
      }
    );

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return ogImage.pipe(res);
  } catch (error) {
    console.error('OG Image Error:', error);
    res.status(500).json({ error: 'Failed to generate OG image' });
  }
};
