# 🧪 Guide de Test Manuel - Chibi Vulture

## 📚 Table des Matières
1. [Prérequis](#prérequis)
2. [Démarrage Rapide](#démarrage-rapide)
3. [Tests Manuels UI](#tests-manuels-ui)
4. [Tests API Automatisés](#tests-api-automatisés)
5. [Tests E2E Playwright](#tests-e2e-playwright)
6. [Checklist Complète](#checklist-complète)

---

## 🔧 Prérequis

### Environnement
- Node.js v18+ installé
- npm ou pnpm installé
- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Base de données PostgreSQL configurée (Neon)

### Configuration
1. Copier `.env.example` vers `.env`
2. Remplir les variables d'environnement:
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=votre-secret-32-caracteres-minimum
   NODE_ENV=development
   ```

3. Installer les dépendances:
   ```bash
   npm install
   ```

4. Initialiser la base de données (si nécessaire):
   ```bash
   node scratch/init_db.cjs
   node scratch/seed.cjs
   ```

---

## 🚀 Démarrage Rapide

### Lancer l'application en local
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`

### Ouvrir dans le navigateur
```bash
# Windows
start http://localhost:5173

# macOS
open http://localhost:5173

# Linux
xdg-open http://localhost:5173
```

---

## 🖱️ Tests Manuels UI

### Option 1: Checklist Papier
Utilisez le fichier `manual-test-guest-artist.md` comme guide:

```bash
# Ouvrir le fichier dans votre éditeur
code manual-test-guest-artist.md

# Ou l'imprimer pour cocher à la main
```

**Avantages:**
- ✅ Complet (100+ points de test)
- ✅ Structuré par fonctionnalité
- ✅ Inclut les tests de sécurité et accessibilité
- ✅ Espace pour notes et bugs

### Option 2: Tests Exploratoires
Suivez ce parcours rapide:

#### 🎭 Parcours Guest (5-10 min)
1. Aller sur `http://localhost:5173`
2. Cliquer "Explorer en invité"
3. Naviguer dans le feed, explorer, shop
4. Ajouter un produit au panier
5. Essayer de checkout (devrait demander connexion)

#### 🎨 Parcours Artist (10-15 min)
1. Créer un compte sur `/signup`
2. **Important:** Approuver le compte en tant qu'admin:
   - Aller sur `/admin-login`
   - Login: `admin@example.com` / `admin123`
   - Approuver le nouveau compte
3. Se connecter avec le nouveau compte
4. Créer un post
5. Liker/commenter d'autres posts
6. Éditer son profil
7. Suivre un artiste
8. Acheter un produit

---

## 🤖 Tests API Automatisés

### Lancer le script de test API
```bash
node test-api-endpoints.js
```

**Ce script teste automatiquement:**
- ✅ Endpoints publics (GET /api/posts, /api/products, /api/users)
- ✅ Inscription (POST /api/users)
- ✅ Connexion (POST /api/login)
- ✅ Profil utilisateur (GET /api/users/me)
- ✅ Création de post (POST /api/posts)
- ✅ Likes et commentaires
- ✅ Follows
- ✅ Commandes
- ✅ Messages
- ✅ Sécurité (accès non autorisés)

**Résultat attendu:**
```
═══════════════════════════════════════════
🚀 TEST MANUEL DES ENDPOINTS API
═══════════════════════════════════════════

✅ PASS: GET /api/posts
✅ PASS: GET /api/products
✅ PASS: POST /api/users
...

📊 RÉSUMÉ DES TESTS
Total: 15
✅ Réussis: 15
❌ Échoués: 0
📈 Taux de réussite: 100.0%

🎉 Tous les tests sont passés!
```

### Tester avec une URL de production
```bash
API_URL=https://votre-app.vercel.app node test-api-endpoints.js
```

---

## 🎭 Tests E2E Playwright

### Tests automatisés complets

#### Lancer tous les tests
```bash
npm run test:e2e
```

#### Lancer en mode UI (recommandé)
```bash
npm run test:e2e:ui
```
Interface graphique pour voir les tests en temps réel.

#### Lancer en mode debug
```bash
npm run test:e2e:debug
```
Pause à chaque étape pour inspecter.

#### Lancer un test spécifique
```bash
npx playwright test e2e/guest-mode.spec.ts
npx playwright test e2e/artist-journey.spec.ts
```

### Tests disponibles

#### 1. `guest-mode.spec.ts`
- Landing page avec logo animé
- Navigation en mode guest
- Visualisation des posts
- Accès au shop et panier
- Restrictions guest (pas de checkout)

#### 2. `artist-journey.spec.ts`
- Inscription artiste
- Connexion
- Création de post
- Édition de profil
- Likes et commentaires
- Navigation complète

#### 3. `admin-journey.spec.ts`
- Connexion admin
- Approbation des comptes
- Modération des posts
- Gestion des utilisateurs
- Statistiques

#### 4. `security.spec.ts`
- Rate limiting
- Protection CSRF
- Validation des inputs
- Accès non autorisés

### Voir le rapport des tests
```bash
npx playwright show-report
```

---

## ✅ Checklist Complète

### Avant de commencer
- [ ] `.env` configuré
- [ ] Base de données initialisée
- [ ] Dépendances installées (`npm install`)
- [ ] Application lancée (`npm run dev`)

### Tests Guest (Mode Invité)
- [ ] Landing page charge correctement
- [ ] Logo animé visible
- [ ] Bouton "Explorer en invité" fonctionne
- [ ] Feed affiche les posts
- [ ] Navigation bottom bar fonctionne
- [ ] Shop affiche les produits
- [ ] Ajout au panier fonctionne
- [ ] Checkout demande connexion

### Tests Artist (Utilisateur Connecté)
- [ ] Inscription fonctionne
- [ ] Approbation admin nécessaire
- [ ] Connexion fonctionne
- [ ] Création de post fonctionne
- [ ] Upload d'image fonctionne
- [ ] Like/unlike fonctionne
- [ ] Commentaires fonctionnent
- [ ] Édition de profil fonctionne
- [ ] Follow/unfollow fonctionne
- [ ] Achat de produit fonctionne
- [ ] Messages fonctionnent
- [ ] Notifications fonctionnent
- [ ] Déconnexion fonctionne

### Tests API (Automatisés)
- [ ] Script `test-api-endpoints.js` passe à 100%
- [ ] Tous les endpoints répondent
- [ ] Authentification fonctionne
- [ ] Sécurité validée

### Tests E2E (Playwright)
- [ ] `guest-mode.spec.ts` passe
- [ ] `artist-journey.spec.ts` passe
- [ ] `admin-journey.spec.ts` passe
- [ ] `security.spec.ts` passe

### Tests Transversaux
- [ ] Responsive (mobile, tablette, desktop)
- [ ] Performance (< 3s chargement)
- [ ] Accessibilité (navigation clavier)
- [ ] PWA (installable, offline)
- [ ] Sécurité (HTTPS, rate limiting)

---

## 🐛 Signaler un Bug

Si vous trouvez un bug, notez:
1. **Étapes pour reproduire**
2. **Résultat attendu**
3. **Résultat obtenu**
4. **Navigateur et version**
5. **Captures d'écran** (si applicable)

Exemple:
```
Bug: Impossible de liker un post en mode guest

Étapes:
1. Aller sur /feed en mode guest
2. Cliquer sur le cœur d'un post

Attendu: Message "Connectez-vous pour liker"
Obtenu: Erreur 500

Navigateur: Chrome 120
```

---

## 📊 Rapport de Test

Après avoir terminé les tests, remplissez:

### Résumé
- **Date:** _______________
- **Testeur:** _______________
- **Environnement:** □ Local □ Staging □ Production
- **Version:** _______________

### Résultats
- **Tests réussis:** _____ / _____
- **Tests échoués:** _____ / _____
- **Bugs critiques:** _____
- **Bugs mineurs:** _____

### Validation
- [ ] Prêt pour production
- [ ] Nécessite corrections
- [ ] Bloqué (bugs critiques)

---

## 🚀 Commandes Utiles

```bash
# Développement
npm run dev                 # Lancer l'app en local
npm run build              # Build pour production
npm run preview            # Preview du build

# Tests
npm test                   # Tests unitaires Jest
npm run test:watch         # Tests en mode watch
npm run test:coverage      # Coverage des tests
npm run test:e2e           # Tests E2E Playwright
npm run test:e2e:ui        # Tests E2E en mode UI
npm run test:all           # Tous les tests

# Linting
npm run lint               # Vérifier le code

# API
node test-api-endpoints.js # Tester les endpoints API
```

---

## 📞 Support

- **Documentation:** `README.md`
- **Règles AI:** `AI_RULES.md`
- **Schema DB:** `scratch/schema.sql`
- **Tests E2E:** `e2e/`

---

**Bon test! 🎉**
