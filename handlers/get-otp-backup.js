/**
 * ENDPOINT DE SECOURS - À utiliser uniquement si l'email OTP n'arrive pas
 * Retourne le dernier OTP généré (admin uniquement, avec authentification forte)
 * 
 * ATTENTION: À désactiver en production après résolution du problème email
 */

const crypto = require('crypto');
const { handleCors } = require('./_lib/cors');
const db = require('./_lib/db');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, type } = req.body || {};

  // Vérification admin uniquement
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  // Vérifier que c'est bien l'admin
  const emailOk = email === ADMIN_EMAIL;
  const passOk = password === ADMIN_PASSWORD;

  if (!emailOk || !passOk) {
    return res.status(403).json({ error: 'Admin access only' });
  }

  try {
    let query, params;

    if (type === 'admin') {
      // Récupérer le dernier OTP admin non utilisé
      query = `
        SELECT code_hash, expires_at, created_at 
        FROM admin_otp 
        WHERE used = FALSE AND expires_at > NOW()
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      params = [];
    } else if (type === 'user') {
      // Récupérer le dernier OTP utilisateur non utilisé
      const { userEmail } = req.body;
      if (!userEmail) {
        return res.status(400).json({ error: 'userEmail required for user OTP' });
      }

      query = `
        SELECT uo.code_hash, uo.expires_at, uo.created_at, u.email
        FROM user_otp uo
        JOIN users u ON u.id = uo.user_id
        WHERE u.email = $1 AND uo.used = FALSE AND uo.expires_at > NOW()
        ORDER BY uo.created_at DESC
        LIMIT 1
      `;
      params = [userEmail];
    } else {
      return res.status(400).json({ error: 'Invalid type (admin or user)' });
    }

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'No valid OTP found',
        hint: 'Try logging in again to generate a new OTP'
      });
    }

    const otp = rows[0];
    const expiresIn = Math.floor((new Date(otp.expires_at) - new Date()) / 1000 / 60);

    // ATTENTION: On ne peut pas récupérer le code original depuis le hash
    // Cette solution nécessite de stocker temporairement le code en clair
    return res.status(200).json({
      message: 'OTP hash found but code cannot be retrieved from hash',
      hint: 'Check server logs for the OTP code',
      expiresIn: `${expiresIn} minutes`,
      createdAt: otp.created_at
    });

  } catch (error) {
    console.error('Get OTP backup error:', error);
    return res.status(500).json({ error: 'Failed to retrieve OTP' });
  }
};
