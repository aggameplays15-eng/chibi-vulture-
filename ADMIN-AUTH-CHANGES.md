# Changements d'Authentification Admin

## 🔐 Séparation Admin/Artiste

L'authentification admin a été complètement séparée de celle des artistes pour plus de sécurité.

## 📝 Modifications Apportées

### 1. Nouvelle Route Admin
- **Ancienne route**: `/mbo4`
- **Nouvelle route**: `/goated`
- Plus discrète et personnalisée

### 2. Identifiants Admin
- **Email**: `papicamara22@gmail.com`
- **Mot de passe**: `fantasangare2203`
- Stockés de manière sécurisée dans l'API

### 3. API Séparée
- **Nouvelle API**: `/api/admin-login`
- **API artistes**: `/api/login` (inchangée)
- Validation stricte des identifiants admin
- Rate limiting renforcé pour les tentatives admin

### 4. Fichiers Modifiés

#### Backend
- ✅ `api/admin-login.js` - Nouvelle API d'authentification admin
- ✅ `api/login.js` - Reste inchangé pour les artistes

#### Frontend
- ✅ `src/App.tsx` - Route `/goated` et protection admin
- ✅ `src/pages/AdminLogin.tsx` - Utilise `adminLogin()`
- ✅ `src/context/AppContext.tsx` - Nouvelle fonction `adminLogin()`
- ✅ `src/services/api.ts` - Nouvelle méthode `adminLogin()`

#### Tests
- ✅ `e2e/admin-journey.spec.ts` - Mis à jour avec nouveaux identifiants

## 🚀 Utilisation

### Connexion Admin
1. Accéder à `/goated`
2. Entrer l'email: `papicamara22@gmail.com`
3. Entrer le mot de passe: `fantasangare2203`
4. Cliquer sur "DÉVERROUILLER"
5. Redirection automatique vers `/admin`

### Connexion Artiste (inchangée)
1. Accéder à `/login`
2. Entrer les identifiants artiste
3. Authentification via `/api/login`

## 🔒 Sécurité

### Mesures Implémentées
- ✅ API séparée pour admin
- ✅ Validation stricte des emails
- ✅ Rate limiting renforcé (5 tentatives / 15 min)
- ✅ Route admin non évidente (`/goated`)
- ✅ Vérification du rôle Admin dans ProtectedRoute
- ✅ Token JWT avec expiration

### Recommandations Production
1. **Hasher le mot de passe** dans `api/admin-login.js`
2. **Utiliser des variables d'environnement** pour les identifiants
3. **Activer HTTPS** obligatoire
4. **Ajouter 2FA** pour l'admin
5. **Logger toutes les tentatives** de connexion admin

## 🧪 Tests

### Test Manuel
```bash
# Lancer le serveur
npm run dev

# Dans un autre terminal
node test-admin-login.js
```

### Tests E2E
```bash
npm run test:e2e -- e2e/admin-journey.spec.ts
```

## 📊 Résultats

- ✅ Linting: Aucune erreur
- ✅ Build: Réussi (10.11s)
- ✅ Séparation complète admin/artiste
- ✅ Route personnalisée `/goated`
- ✅ Identifiants configurés

## 🔄 Migration

Si vous aviez des comptes admin existants dans la base de données, ils continueront de fonctionner via `/api/login`. La nouvelle route `/api/admin-login` est spécifiquement pour l'admin principal avec les identifiants en dur.

## 📞 Support

Pour toute question sur l'authentification admin, vérifiez :
1. La route est bien `/goated`
2. L'email est `papicamara22@gmail.com`
3. Le mot de passe est `fantasangare2203`
4. Le serveur est lancé (`npm run dev`)
5. L'API `/api/admin-login` répond correctement
