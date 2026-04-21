const auth = require('./_lib/auth');
const { handleCors } = require('./_lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  // Révoque le token JWT côté serveur
  auth.revokeToken(req);
  res.status(200).json({ status: 'Logged out' });
};
