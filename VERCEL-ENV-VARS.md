# Variables d'environnement Vercel

Copiez ces variables d'environnement dans votre projet Vercel (Settings > Environment Variables):

## Configuration requise

### Database Configuration (Neon PostgreSQL)
- `DATABASE_URL` - URL de connexion PostgreSQL (obligatoire)
  - Format: `postgresql://username:password@hostname/database?sslmode=require`

### JWT Authentication
- `JWT_SECRET` - Clé secrète JWT (obligatoire, minimum 32 caractères)
  - Générez une clé forte avec: `openssl rand -base64 32`

### Node Environment
- `NODE_ENV` - Environnement Node
  - Valeur: `production`

### Log Level
- `LOG_LEVEL` - Niveau de logging
  - Valeurs possibles: `DEBUG | INFO | WARN | ERROR`
  - Valeur recommandée: `INFO`

## Configuration optionnelle

### SMTP Configuration (Email Notifications)
- `SMTP_HOST` - Hôte SMTP (ex: smtp.gmail.com)
- `SMTP_PORT` - Port SMTP (ex: 587)
- `SMTP_SECURE` - SSL/TLS (true/false)
- `SMTP_USER` - Email SMTP
- `SMTP_PASS` - Mot de passe SMTP
- `SMTP_FROM` - Email d'envoi (ex: noreply@chibivulture.com)

### Push Notifications (VAPID Keys)
- `VAPID_PUBLIC_KEY` - Clé publique VAPID
- `VAPID_PRIVATE_KEY` - Clé privée VAPID
- `VAPID_SUBJECT` - Sujet VAPID (ex: mailto:admin@chibivulture.com)
  - Générez les clés avec: `npx web-push generate-vapid-keys`

### Admin Credentials
- `ADMIN_EMAIL` - Email admin pour login (papicamara22@gmail.com)
- `ADMIN_PASSWORD` - Mot de passe admin (fantasangare2203)

### CORS Configuration
- `FRONTEND_URL` - URL frontend pour whitelist CORS (optionnel)

### Redis (optionnel)
- `REDIS_URL` - URL Redis pour rate limiting persistant
  - Si non configuré, utilise rate limiting en mémoire

## Instructions de configuration

1. Allez sur votre projet Vercel
2. Cliquez sur Settings > Environment Variables
3. Ajoutez chaque variable avec sa valeur
4. Sélectionnez l'environnement approprié:
   - Production: pour le déploiement principal
   - Preview: pour les déploiements de preview
   - Development: pour l'environnement de développement

## Variables obligatoires pour le déploiement

Minimum requis:
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV`

Sans ces variables, l'application ne démarrera pas correctement.
