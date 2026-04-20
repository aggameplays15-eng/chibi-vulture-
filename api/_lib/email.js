const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@chibivulture.com';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn('[Email] SMTP not configured. Emails will be logged only.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const transport = getTransporter();

  if (!transport) {
    console.log('[Email] Would send email:', { to, subject, text: text?.slice(0, 100) });
    return { messageId: 'mock-' + Date.now() };
  }

  try {
    const info = await transport.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log('[Email] Sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('[Email] Failed to send:', error.message);
    throw error;
  }
}

async function sendNotificationEmail(userEmail, notification) {
  const subject = `Nouvelle notification: ${notification.title || 'Chibi Vulture'}`;
  const text = notification.body || 'Vous avez une nouvelle notification.';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${notification.title || 'Chibi Vulture'}</h2>
      <p style="color: #666; font-size: 16px;">${notification.body || ''}</p>
      <a href="${notification.url || '/'}" 
         style="display: inline-block; margin-top: 20px; padding: 12px 24px; 
                background-color: #007bff; color: white; text-decoration: none; 
                border-radius: 4px;">
        Voir sur Chibi Vulture
      </a>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, text, html });
}

module.exports = {
  sendEmail,
  sendNotificationEmail,
};
