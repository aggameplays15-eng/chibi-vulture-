# Variables d'environnement Vercel

Liste complète des variables à configurer dans Vercel → Settings → Environment Variables

---

## Liste complète (copier-coller dans Vercel)

1. **DATABASE_URL** - Votre URL PostgreSQL Neon
2. **JWT_SECRET** - Clé secrète JWT (64+ caractères hex)
3. **NODE_ENV** - production
4. **FRONTEND_URL** - https://chibi-vulture.vercel.app
5. **LOG_LEVEL** - INFO
6. **SMTP_HOST** - smtp.gmail.com
7. **SMTP_PORT** - 587
8. **SMTP_SECURE** - false
9. **SMTP_USER** - Votre email Gmail
10. **SMTP_PASS** - Votre mot de passe app Gmail
11. **SMTP_FROM** - noreply@yourdomain.com
12. **VAPID_PUBLIC_KEY** - Clé publique VAPID
13. **VAPID_PRIVATE_KEY** - Clé privée VAPID
14. **VAPID_SUBJECT** - mailto:admin@yourdomain.com
15. **ADMIN_EMAIL** - Email admin
16. **ADMIN_PASSWORD_HASH** - Hash bcrypt du mot de passe admin

---

## Instructions de génération

### JWT_SECRET
```bash
node -e "require('crypto').randomBytes(48).toString('hex')"
```

### ADMIN_PASSWORD_HASH
```bash
node -e "require('bcryptjs').hash('VOTRE_MOT_DE_PASSE',12).then(h=>console.log(h))"
```

### VAPID Keys
```bash
npx web-push generate-vapid-keys
```
