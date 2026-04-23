# Variables d'environnement Vercel

Copiez ces variables dans Vercel → Settings → Environment Variables

---

## Base de données
```
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```
Remplacez avec votre URL de connexion Neon PostgreSQL

## JWT Secret
```
JWT_SECRET=REPLACE_WITH_RANDOM_64_CHAR_HEX_STRING
```
Générer avec: `node -e "require('crypto').randomBytes(48).toString('hex')|Write-Host"`
Minimum 32 caractères, doit être aléatoire et unique

## Node Environment
```
NODE_ENV=production
```

## Frontend URL
```
FRONTEND_URL=https://chibi-vulture.vercel.app
```

## Log Level
```
LOG_LEVEL=INFO
```

## SMTP Configuration (Email)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

## VAPID Keys (Push Notifications)
```
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@yourdomain.com
```
Générer avec: `npx web-push generate-vapid-keys`

## Admin Credentials
```
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD_HASH=REPLACE_WITH_BCRYPT_HASH
```
Générer le hash avec: `node -e "require('bcryptjs').hash('TON_MOT_DE_PASSE',12).then(h=>console.log(h))"`

---

## Résumé rapide pour copier-coller dans Vercel

1. DATABASE_URL - Votre URL PostgreSQL Neon
2. JWT_SECRET - Clé secrète JWT (64+ caractères hex)
3. NODE_ENV - production
4. FRONTEND_URL - https://chibi-vulture.vercel.app
5. LOG_LEVEL - INFO
6. SMTP_HOST - smtp.gmail.com
7. SMTP_PORT - 587
8. SMTP_SECURE - false
9. SMTP_USER - Votre email Gmail
10. SMTP_PASS - Votre mot de passe app Gmail
11. SMTP_FROM - noreply@yourdomain.com
12. VAPID_PUBLIC_KEY - Clé publique VAPID
13. VAPID_PRIVATE_KEY - Clé privée VAPID
14. VAPID_SUBJECT - mailto:admin@yourdomain.com
15. ADMIN_EMAIL - Email admin
16. ADMIN_PASSWORD_HASH - Hash bcrypt du mot de passe admin
