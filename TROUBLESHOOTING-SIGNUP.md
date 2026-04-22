# 🔧 Dépannage - Création de compte

## Problème
Impossible de créer un compte utilisateur.

## ✅ Vérifications effectuées

### 1. Base de données
- ✅ Table `users` existe
- ✅ Toutes les colonnes requises sont présentes
- ✅ Contraintes UNIQUE sur `handle` et `email`
- ✅ Test de création directe en DB fonctionne

### 2. Backend
- ✅ Handler `/api/users` (POST) fonctionne
- ✅ Validations en place
- ✅ Rate limiting configuré

### 3. Frontend
- ✅ Formulaire de signup existe
- ✅ Appel API correct

## 🔍 Causes possibles

### 1. **Rate Limiting**
Le système limite les tentatives de création de compte :
- **Maximum** : 3 tentatives par heure
- **Burst** : 2 tentatives en 30 secondes

**Solution** : Attendez 1 heure ou nettoyez le rate limit

### 2. **Handle ou Email déjà utilisé**
Erreur 409 : Le handle ou l'email existe déjà

**Solution** : Utilisez un handle/email différent

### 3. **Validation échouée**
Erreur 400 : Les données ne respectent pas les règles

**Règles de validation** :
- Nom : 2-50 caractères
- Handle : @username (3-20 caractères alphanumériques + _)
- Email : format email valide
- Mot de passe : minimum 8 caractères

### 4. **Email admin réservé**
Vous ne pouvez pas créer un compte avec l'email admin

**Email réservé** : `papicamara22@gmail.com`

### 5. **Serveur non démarré**
L'API n'est pas accessible

**Solution** : Démarrez le serveur avec `npm run dev`

### 6. **Problème de connexion DB**
La base de données n'est pas accessible

**Solution** : Vérifiez `DATABASE_URL` dans `.env`

## 🧪 Scripts de diagnostic

### Test complet de la création de compte
```bash
node scripts/test-signup.cjs
```

### Test de l'API
```bash
node scripts/test-signup-api.cjs
```

### Nettoyer le rate limit
```bash
node scripts/clear-rate-limit.cjs
```

## 🔧 Solutions rapides

### Solution 1 : Nettoyer le rate limit

Créez `scripts/clear-rate-limit.cjs` :
```javascript
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearRateLimit() {
  await pool.query('DELETE FROM rate_limit WHERE action = $1', ['signup']);
  console.log('✅ Rate limit nettoyé');
  await pool.end();
}

clearRateLimit();
```

### Solution 2 : Approuver automatiquement les nouveaux comptes

Modifiez `handlers/users.js` ligne 147 :
```javascript
// Avant
'INSERT INTO users (name, handle, email, bio, avatar_color, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ...'

// Après (auto-approve)
'INSERT INTO users (name, handle, email, bio, avatar_color, password, is_approved) VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING ...'
```

### Solution 3 : Désactiver temporairement le rate limiting

Dans `handlers/users.js`, commentez les lignes 123-128 :
```javascript
// const limit = await rateLimit(req, 'signup');
// Object.entries(limit.headers).forEach(([key, value]) => res.setHeader(key, value));
// if (!limit.allowed) {
//   return res.status(429).json({ error: 'Too many signup attempts. Please try again later.', retryAfter: limit.resetInSeconds });
// }
```

## 📝 Checklist de dépannage

- [ ] Le serveur est démarré (`npm run dev`)
- [ ] La base de données est accessible
- [ ] Le handle commence par `@`
- [ ] Le handle fait entre 3 et 20 caractères
- [ ] L'email est valide
- [ ] Le mot de passe fait au moins 8 caractères
- [ ] L'email n'est pas l'email admin
- [ ] Vous n'avez pas dépassé le rate limit (3 tentatives/heure)
- [ ] Le handle/email n'existe pas déjà

## 🔍 Logs à vérifier

### Console du serveur
Recherchez ces messages :
```
[Rate Limit] signup: X/3 attempts
Failed to create user
Handle or email already exists
```

### Console du navigateur
Ouvrez les DevTools (F12) et vérifiez :
- Onglet Network : Status de la requête POST `/api/users`
- Onglet Console : Messages d'erreur JavaScript

## 📞 Erreurs courantes

### Erreur 400 - Bad Request
```json
{ "error": "Invalid handle format (@username, 3-20 chars)" }
```
**Solution** : Vérifiez le format du handle

### Erreur 409 - Conflict
```json
{ "error": "Handle or email already exists" }
```
**Solution** : Utilisez un autre handle/email

### Erreur 429 - Too Many Requests
```json
{ "error": "Too many signup attempts. Please try again later.", "retryAfter": 3600 }
```
**Solution** : Attendez 1 heure ou nettoyez le rate limit

### Erreur 500 - Internal Server Error
```json
{ "error": "Failed to create user" }
```
**Solution** : Vérifiez les logs du serveur et la connexion DB

## 🚀 Test en production

Si le problème persiste en production (Vercel) :

1. **Vérifiez les logs Vercel**
   ```bash
   vercel logs --follow
   ```

2. **Vérifiez les variables d'environnement**
   - `DATABASE_URL` doit être défini
   - Toutes les variables du `.env.example` doivent être présentes

3. **Testez l'API directement**
   ```bash
   curl -X POST https://votre-domaine.com/api/users \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","handle":"@test123","email":"test@test.com","password":"Test1234","bio":"","avatarColor":"#3b82f6"}'
   ```

## 💡 Recommandations

1. **En développement** : Désactivez le rate limiting pour faciliter les tests
2. **En production** : Gardez le rate limiting actif pour la sécurité
3. **Auto-approbation** : Considérez l'approbation automatique si vous n'avez pas besoin de modération
4. **Logs** : Ajoutez plus de logs pour faciliter le debug

## 📄 Fichiers concernés

- `handlers/users.js` - Handler de création de compte
- `handlers/_lib/rateLimit.js` - Configuration du rate limiting
- `src/pages/Signup.tsx` - Formulaire frontend
- `src/services/api.ts` - Service API frontend
- `migrations/003_create_core_tables.sql` - Structure de la table users
