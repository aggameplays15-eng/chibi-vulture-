/**
 * Email service — Chibi Vulture
 * Templates HTML pour chaque action utilisateur.
 * Utilise nodemailer avec la config SMTP du .env
 */
const nodemailer = require('nodemailer');

// ─── Transporter ────────────────────────────────────────────────────────────

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null; // Email non configuré — fail silencieux
  }
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transporter;
}

// ─── Base template ──────────────────────────────────────────────────────────

const APP_NAME = process.env.APP_NAME || 'Chibi Vulture';
const APP_URL  = process.env.FRONTEND_URL || 'https://chibivulture.com';
const PRIMARY  = '#EC4899';
const DARK     = '#1a1a2e';

function baseTemplate(title, content) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:${DARK};padding:28px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:800;color:${PRIMARY};letter-spacing:-1px;">${APP_NAME}</span>
            <br/><span style="color:#888;font-size:13px;margin-top:4px;display:block;">Le réseau social artistique</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9fb;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#aaa;font-size:12px;">
              © ${new Date().getFullYear()} ${APP_NAME} · <a href="${APP_URL}" style="color:${PRIMARY};text-decoration:none;">Visiter le site</a>
              <br/>Tu reçois cet email car tu es membre de ${APP_NAME}.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(label, url) {
  return `<a href="${url}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:${PRIMARY};color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">${label}</a>`;
}

function avatar(name) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return `<span style="display:inline-block;width:40px;height:40px;border-radius:50%;background:${PRIMARY};color:#fff;font-weight:700;font-size:16px;line-height:40px;text-align:center;">${initials}</span>`;
}

// ─── Templates ──────────────────────────────────────────────────────────────

const templates = {

  // 1. Bienvenue après inscription — compte en attente d'approbation
  welcome: ({ name, handle }) => ({
    subject: `🎨 Compte créé — En attente d'approbation sur ${APP_NAME}`,
    html: baseTemplate(`Bienvenue sur ${APP_NAME}`, `
      <h2 style="margin:0 0 8px;color:${DARK};font-size:24px;">Bienvenue, ${name} ! 🎉</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Ton compte <strong>${handle}</strong> a bien été créé sur ${APP_NAME}.
      </p>

      <div style="background:#fff8f0;border-left:4px solid #F59E0B;border-radius:0 12px 12px 0;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-weight:700;color:#92400E;font-size:15px;">⏳ En attente d'approbation</p>
        <p style="margin:0;color:#78350F;font-size:14px;line-height:1.6;">
          Ton compte est en cours de vérification par notre équipe. Tu recevras un email dès que ton accès sera activé.
        </p>
      </div>

      <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 8px;">Une fois approuvé, tu pourras :</p>
      <ul style="color:#555;font-size:14px;line-height:2;padding-left:20px;margin:0 0 16px;">
        <li>📸 Partager tes créations</li>
        <li>🛍️ Vendre tes œuvres dans la boutique</li>
        <li>💬 Discuter avec d'autres artistes</li>
        <li>❤️ Liker et commenter les posts</li>
      </ul>
      <p style="color:#aaa;font-size:13px;margin:0;">Merci pour ta patience — l'équipe ${APP_NAME} 💖</p>
    `),
  }),

  // 2. Confirmation de commande (client)
  orderConfirmation: ({ name, orderId, items, total, shippingAddress, phone }) => {
    const itemsHtml = items.map(i =>
      `<tr>
        <td style="padding:8px 0;color:#333;font-size:14px;">${i.name}</td>
        <td style="padding:8px 0;color:#555;font-size:14px;text-align:center;">×${i.quantity}</td>
        <td style="padding:8px 0;color:#333;font-size:14px;text-align:right;font-weight:600;">${Number(i.price * i.quantity).toLocaleString('fr-FR')} GNF</td>
      </tr>`
    ).join('');
    return {
      subject: `✅ Commande #${orderId} confirmée — ${APP_NAME}`,
      html: baseTemplate('Commande confirmée', `
        <h2 style="margin:0 0 8px;color:${DARK};font-size:22px;">Commande confirmée ✅</h2>
        <p style="color:#555;font-size:15px;margin:0 0 24px;">Bonjour <strong>${name}</strong>, ta commande a bien été reçue !</p>

        <div style="background:#f9f9fb;border-radius:10px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Référence</p>
          <p style="margin:0;color:${DARK};font-size:18px;font-weight:700;">#${orderId}</p>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;margin-bottom:16px;">
          <tr style="background:#f9f9fb;">
            <th style="padding:10px 0;text-align:left;color:#888;font-size:12px;font-weight:600;text-transform:uppercase;">Article</th>
            <th style="padding:10px 0;text-align:center;color:#888;font-size:12px;font-weight:600;text-transform:uppercase;">Qté</th>
            <th style="padding:10px 0;text-align:right;color:#888;font-size:12px;font-weight:600;text-transform:uppercase;">Prix</th>
          </tr>
          ${itemsHtml}
          <tr style="border-top:2px solid #eee;">
            <td colspan="2" style="padding:12px 0;font-weight:700;color:${DARK};font-size:15px;">Total</td>
            <td style="padding:12px 0;font-weight:700;color:${PRIMARY};font-size:16px;text-align:right;">${Number(total).toLocaleString('fr-FR')} GNF</td>
          </tr>
        </table>

        ${shippingAddress ? `<p style="color:#555;font-size:14px;margin:0 0 4px;"><strong>Livraison :</strong> ${shippingAddress}</p>` : ''}
        ${phone ? `<p style="color:#555;font-size:14px;margin:0 0 16px;"><strong>Téléphone :</strong> ${phone}</p>` : ''}

        <p style="color:#888;font-size:13px;margin:16px 0 0;">Tu recevras un email dès que ta commande est expédiée.</p>
        ${btn('Suivre ma commande', `${APP_URL}/orders`)}
      `),
    };
  },

  // 3. Nouvelle commande (admin)
  newOrderAdmin: ({ orderId, customerName, total, items, shippingAddress, phone }) => {
    const itemsHtml = items.map(i =>
      `<tr><td style="padding:6px 0;color:#333;font-size:14px;">${i.name} ×${i.quantity}</td>
       <td style="padding:6px 0;color:#333;font-size:14px;text-align:right;">${Number(i.price * i.quantity).toLocaleString('fr-FR')} GNF</td></tr>`
    ).join('');
    return {
      subject: `🛒 Nouvelle commande #${orderId} — ${APP_NAME}`,
      html: baseTemplate('Nouvelle commande', `
        <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Nouvelle commande reçue 🛒</h2>
        <div style="background:#fff3f8;border-left:4px solid ${PRIMARY};padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
          <p style="margin:0;color:${DARK};font-size:16px;font-weight:700;">#${orderId}</p>
          <p style="margin:4px 0 0;color:#555;font-size:14px;">Client : <strong>${customerName}</strong></p>
          ${phone ? `<p style="margin:4px 0 0;color:#555;font-size:14px;">Tél : ${phone}</p>` : ''}
          ${shippingAddress ? `<p style="margin:4px 0 0;color:#555;font-size:14px;">Adresse : ${shippingAddress}</p>` : ''}
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          ${itemsHtml}
          <tr style="border-top:2px solid #eee;">
            <td style="padding:10px 0;font-weight:700;color:${DARK};">Total</td>
            <td style="padding:10px 0;font-weight:700;color:${PRIMARY};text-align:right;">${Number(total).toLocaleString('fr-FR')} GNF</td>
          </tr>
        </table>
        ${btn('Gérer la commande', `${APP_URL}/goated-panel`)}
      `),
    };
  },

  // 4. Statut de commande mis à jour
  orderStatusUpdate: ({ name, orderId, status, trackingNumber, carrier }) => {
    const statusLabels = {
      processing: { label: 'En préparation 📦', color: '#F59E0B' },
      shipped:    { label: 'Expédiée 🚚',       color: '#3B82F6' },
      in_transit: { label: 'En transit 🛣️',     color: '#8B5CF6' },
      delivered:  { label: 'Livrée ✅',          color: '#10B981' },
      cancelled:  { label: 'Annulée ❌',         color: '#EF4444' },
    };
    const s = statusLabels[status] || { label: status, color: PRIMARY };
    return {
      subject: `📦 Commande #${orderId} — ${s.label}`,
      html: baseTemplate('Mise à jour commande', `
        <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Mise à jour de ta commande</h2>
        <p style="color:#555;font-size:15px;margin:0 0 24px;">Bonjour <strong>${name}</strong>,</p>
        <div style="text-align:center;padding:32px;background:#f9f9fb;border-radius:12px;margin-bottom:24px;">
          <span style="font-size:48px;">📦</span>
          <p style="margin:12px 0 4px;font-size:20px;font-weight:700;color:${s.color};">${s.label}</p>
          <p style="margin:0;color:#888;font-size:14px;">Commande #${orderId}</p>
        </div>
        ${trackingNumber ? `
          <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;">Numéro de suivi</p>
            <p style="margin:0;color:${DARK};font-size:16px;font-weight:700;">${trackingNumber}</p>
            ${carrier ? `<p style="margin:4px 0 0;color:#555;font-size:13px;">Transporteur : ${carrier}</p>` : ''}
          </div>` : ''}
        ${btn('Suivre ma commande', `${APP_URL}/orders`)}
      `),
    };
  },

  // 5. Nouveau follower
  newFollower: ({ recipientName, followerName, followerHandle }) => ({
    subject: `👤 ${followerName} te suit maintenant — ${APP_NAME}`,
    html: baseTemplate('Nouveau follower', `
      <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Tu as un nouveau follower !</h2>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        ${avatar(followerName)}
        <div style="margin-left:12px;display:inline-block;">
          <p style="margin:0;font-weight:700;color:${DARK};font-size:16px;">${followerName}</p>
          <p style="margin:0;color:#888;font-size:13px;">${followerHandle}</p>
        </div>
      </div>
      <p style="color:#555;font-size:15px;margin:0 0 8px;">
        <strong>${followerName}</strong> a commencé à te suivre sur ${APP_NAME}.
      </p>
      ${btn('Voir son profil', `${APP_URL}/profile/${followerHandle}`)}
    `),
  }),

  // 6. Nouveau like sur un post
  newLike: ({ recipientName, likerName, likerHandle, postId }) => ({
    subject: `❤️ ${likerName} a aimé ton post — ${APP_NAME}`,
    html: baseTemplate('Nouveau like', `
      <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Quelqu'un a aimé ton post ❤️</h2>
      <div style="margin-bottom:24px;">
        ${avatar(likerName)}
        <span style="margin-left:12px;font-weight:700;color:${DARK};font-size:16px;vertical-align:middle;">${likerName}</span>
        <span style="margin-left:4px;color:#888;font-size:13px;vertical-align:middle;">${likerHandle}</span>
      </div>
      <p style="color:#555;font-size:15px;margin:0 0 8px;">
        <strong>${likerName}</strong> a aimé l'un de tes posts.
      </p>
      ${btn('Voir le post', `${APP_URL}/post/${postId}`)}
    `),
  }),

  // 7. Nouveau commentaire
  newComment: ({ recipientName, commenterName, commenterHandle, postId, commentText }) => ({
    subject: `💬 ${commenterName} a commenté ton post — ${APP_NAME}`,
    html: baseTemplate('Nouveau commentaire', `
      <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Nouveau commentaire 💬</h2>
      <div style="margin-bottom:16px;">
        ${avatar(commenterName)}
        <span style="margin-left:12px;font-weight:700;color:${DARK};font-size:16px;vertical-align:middle;">${commenterName}</span>
        <span style="margin-left:4px;color:#888;font-size:13px;vertical-align:middle;">${commenterHandle}</span>
      </div>
      <blockquote style="margin:0 0 24px;padding:16px 20px;background:#f9f9fb;border-left:4px solid ${PRIMARY};border-radius:0 8px 8px 0;color:#333;font-size:15px;font-style:italic;">
        "${commentText}"
      </blockquote>
      ${btn('Voir le post', `${APP_URL}/post/${postId}`)}
    `),
  }),

  // 8. Nouveau message privé
  newMessage: ({ recipientName, senderName, senderHandle, preview }) => ({
    subject: `💌 Nouveau message de ${senderName} — ${APP_NAME}`,
    html: baseTemplate('Nouveau message', `
      <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Tu as un nouveau message 💌</h2>
      <div style="margin-bottom:16px;">
        ${avatar(senderName)}
        <span style="margin-left:12px;font-weight:700;color:${DARK};font-size:16px;vertical-align:middle;">${senderName}</span>
        <span style="margin-left:4px;color:#888;font-size:13px;vertical-align:middle;">${senderHandle}</span>
      </div>
      <blockquote style="margin:0 0 24px;padding:16px 20px;background:#f9f9fb;border-left:4px solid ${PRIMARY};border-radius:0 8px 8px 0;color:#333;font-size:15px;">
        ${preview.length > 120 ? preview.slice(0, 120) + '…' : preview}
      </blockquote>
      ${btn('Répondre', `${APP_URL}/messages`)}
    `),
  }),

  // 9. Compte approuvé par l'admin
  accountApproved: ({ name, handle }) => ({
    subject: `✅ Ton compte est approuvé — ${APP_NAME}`,
    html: baseTemplate('Compte approuvé', `
      <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Ton compte est approuvé ! ✅</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Bonjour <strong>${name}</strong>, l'équipe ${APP_NAME} a approuvé ton compte <strong>${handle}</strong>.
        Tu peux maintenant accéder à toutes les fonctionnalités de la plateforme.
      </p>
      <div style="background:#f0fdf4;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
        <span style="font-size:48px;">🎨</span>
        <p style="margin:8px 0 0;color:#10B981;font-weight:700;font-size:16px;">Bienvenue dans la communauté !</p>
      </div>
      ${btn('Accéder à mon compte', `${APP_URL}/profile/${handle}`)}
    `),
  }),

  // 10. Nouveau membre inscrit (admin)
  newSignupAdmin: ({ name, handle, email }) => ({
    subject: `🔔 Nouveau compte en attente d'approbation — ${APP_NAME}`,
    html: baseTemplate('Nouveau membre en attente', `
      <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Nouveau compte à approuver 🔔</h2>
      <div style="background:#fff3f8;border-left:4px solid ${PRIMARY};padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
        <p style="margin:0;color:${DARK};font-size:16px;font-weight:700;">${name} <span style="color:#888;font-weight:400;font-size:14px;">${handle}</span></p>
        <p style="margin:4px 0 0;color:#555;font-size:14px;">📧 ${email}</p>
      </div>
      <p style="color:#555;font-size:15px;margin:0 0 8px;">Ce membre attend ton approbation pour accéder à la plateforme.</p>
      <p style="color:#aaa;font-size:13px;margin:0 0 24px;">Rends-toi dans le panneau admin pour approuver ou rejeter ce compte.</p>
      ${btn('Approuver dans le panneau admin', `${APP_URL}/goated-panel`)}
    `),
  }),

  // 10b. Confirmation d'approbation (admin)
  approvalConfirmAdmin: ({ name, handle, email }) => ({
    subject: `✅ Compte approuvé — ${name} (${handle}) — ${APP_NAME}`,
    html: baseTemplate('Compte approuvé', `
      <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Compte approuvé ✅</h2>
      <div style="background:#f0fdf4;border-left:4px solid #10B981;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
        <p style="margin:0;color:${DARK};font-size:16px;font-weight:700;">${name} <span style="color:#888;font-weight:400;font-size:14px;">${handle}</span></p>
        <p style="margin:4px 0 0;color:#555;font-size:14px;">📧 ${email}</p>
      </div>
      <p style="color:#555;font-size:14px;margin:0 0 24px;">Ce membre a été notifié par email et peut maintenant accéder à la plateforme.</p>
      ${btn('Gérer les membres', `${APP_URL}/goated-panel`)}
    `),
  }),

  // 11. Compte banni (admin — log interne)
  accountBanned: ({ name, handle, email }) => ({
    subject: `🚫 Compte banni — ${handle} — ${APP_NAME}`,
    html: baseTemplate('Compte banni', `
      <h2 style="margin:0 0 16px;color:#EF4444;font-size:22px;">Compte banni 🚫</h2>
      <div style="background:#fff5f5;border-left:4px solid #EF4444;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
        <p style="margin:0;color:${DARK};font-size:16px;font-weight:700;">${name} <span style="color:#888;font-weight:400;font-size:14px;">${handle}</span></p>
        <p style="margin:4px 0 0;color:#555;font-size:14px;">${email}</p>
      </div>
      <p style="color:#555;font-size:14px;margin:0;">Ce log est généré automatiquement à chaque bannissement.</p>
      ${btn('Gérer les membres', `${APP_URL}/goated-panel`)}
    `),
  }),

  // 11b. Compte supprimé (admin — log interne)
  accountDeleted: ({ name, handle, email }) => ({
    subject: `🗑️ Compte supprimé — ${handle} — ${APP_NAME}`,
    html: baseTemplate('Compte supprimé', `
      <h2 style="margin:0 0 16px;color:#F59E0B;font-size:22px;">Compte supprimé 🗑️</h2>
      <div style="background:#fffbeb;border-left:4px solid #F59E0B;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
        <p style="margin:0;color:${DARK};font-size:16px;font-weight:700;">${name} <span style="color:#888;font-weight:400;font-size:14px;">${handle}</span></p>
        <p style="margin:4px 0 0;color:#555;font-size:14px;">${email}</p>
      </div>
      <p style="color:#555;font-size:14px;margin:0 0 8px;">Le compte a été marqué comme "Supprimé" et désactivé.</p>
      <p style="color:#aaa;font-size:13px;margin:0;">Les données sont conservées dans la base de données pour l'historique.</p>
      ${btn('Gérer les membres', `${APP_URL}/goated-panel`)}
    `),
  }),

  // 12. User 2FA OTP (connexion) - Version optimisée
  userOtp: ({ name, code }) => ({
    subject: `🔐 Code: ${code} — ${APP_NAME}`,
    html: baseTemplate('Code de connexion', `
      <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Code de connexion 🔐</h2>
      <p style="color:#555;font-size:15px;margin:0 0 16px;">
        Bonjour <strong>${name}</strong>, voici ton code de vérification :
      </p>
      <div style="text-align:center;padding:24px;background:#f9f9fb;border-radius:12px;margin-bottom:16px;">
        <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;color:${DARK};">${code}</p>
        <p style="margin:12px 0 0;color:#aaa;font-size:12px;">Expire dans <strong>30 minutes</strong></p>
      </div>
      <p style="color:#aaa;font-size:13px;margin:0;">
        Si tu n'es pas à l'origine de cette connexion, ignore cet email.
      </p>
    `),
  }),

  // 13. Admin 2FA OTP - Version optimisée
  adminOtp: ({ code }) => ({
    subject: `🔐 Code Admin: ${code} — ${APP_NAME}`,
    html: baseTemplate('Code Admin', `
      <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Code Admin 🔐</h2>
      <div style="text-align:center;padding:24px;background:#f9f9fb;border-radius:12px;margin-bottom:16px;">
        <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;color:${DARK};">${code}</p>
        <p style="margin:12px 0 0;color:#aaa;font-size:12px;">Expire dans <strong>30 minutes</strong></p>
      </div>
      <p style="color:#aaa;font-size:13px;margin:0;">
        Connexion au panneau Admin. Si ce n'est pas vous, changez votre mot de passe immédiatement.
      </p>
    `),
  }),

  // 13. Réinitialisation de mot de passe
  passwordReset: ({ name, resetUrl }) => ({
    subject: `🔑 Réinitialisation de mot de passe — ${APP_NAME}`,
    html: baseTemplate('Réinitialisation mot de passe', `
      <h2 style="margin:0 0 16px;color:${DARK};font-size:22px;">Réinitialisation de mot de passe 🔑</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Bonjour <strong>${name}</strong>, tu as demandé à réinitialiser ton mot de passe.
        Clique sur le bouton ci-dessous. Ce lien expire dans <strong>1 heure</strong>.
      </p>
      <div style="background:#fff3f8;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;color:#888;font-size:13px;">Si tu n'as pas fait cette demande, ignore cet email.</p>
      </div>
      ${btn('Réinitialiser mon mot de passe', resetUrl)}
    `),
  }),

};

// ─── Send helper ────────────────────────────────────────────────────────────

async function sendEmail(to, templateName, data) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[Email] SMTP non configuré — email "${templateName}" non envoyé à ${to}`);
    return false;
  }

  const template = templates[templateName];
  if (!template) {
    console.error(`[Email] Template inconnu : ${templateName}`);
    return false;
  }

  const { subject, html } = template(data);

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] ✓ "${templateName}" envoyé à ${to}`);
    return true;
  } catch (err) {
    console.error(`[Email] ✗ Échec envoi "${templateName}" à ${to}:`, err.message);
    return false;
  }
}

module.exports = { sendEmail, templates };
