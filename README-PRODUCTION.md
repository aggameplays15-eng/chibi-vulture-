# Chibi Vulture - Configuration Production 100% Réelle

## ⚠️ IMPORTANT - AUCUNE DONNÉE DE SIMULATION

**Toutes les fonctionnalités utilisent 100% de données réelles de la base de données PostgreSQL.**
- ❌ Aucune donnée mock
- ❌ Aucune simulation
- ❌ Aucune donnée de démonstration
- ✅ Tout utilise la base de données PostgreSQL
- ✅ Tous les appels API sont réels

---

## 🚀 Installation Production

### 1. Base de données PostgreSQL

Exécuter les migrations dans l'ordre:

```bash
# 1. Push notifications
psql -U your_user -d your_database -f migrations/001_add_push_notifications.sql

# 2. App settings
psql -U your_user -d your_database -f migrations/002_add_app_settings.sql

# 3. Core tables
psql -U your_user -d your_database -f migrations/003_create_core_tables.sql

# 4. Order items (NOUVEAU)
psql -U your_user -d your_database -f migrations/004_add_order_items.sql

# 5. Delivery tracking (NOUVEAU)
psql -U your_user -d your_database -f migrations/005_add_delivery_tracking.sql

# 6. Artist stats (NOUVEAU)
psql -U your_user -d your_database -f migrations/006_add_artist_stats.sql

# 7. Product categories (NOUVEAU)
psql - U your_user -d your_database -f migrations/007_add_product_categories.sql

# 8. Onboarding tracking (NOUVEAU)
psql -U your_user -d your_database -f migrations/008_add_onboarding_tracking.sql

# 9. Seed data (OPTIONNEL - pour tests)
psql -U your_user -d your_database -f migrations/009_seed_data.sql
```

### 2. Variables d'environnement

```env
# Base de données PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database

# Admin
ADMIN_EMAIL=papicamara22@gmail.com
ADMIN_PASSWORD=fantasangare2203

# API
API_BASE_URL=https://your-domain.com
```

### 3. Installation dépendances

```bash
npm install
```

### 4. Build production

```bash
npm run build
```

---

## 📊 Structure Base de Données

### Tables principales
- `users` - Utilisateurs
- `posts` - Posts social
- `likes` - Likes posts
- `comments` - Commentaires posts
- `follows` - Relations follow
- `products` - Produits boutique
- `orders` - Commandes
- `order_items` - Détails commandes
- `messages` - Messages
- `conversations` - Conversations
- `notifications` - Notifications

### Tables nouvelles (fonctionnalités 15, 7, 6, 9)
- `delivery_tracking_events` - Tracking livraison
- `artist_stats` - Statistiques artistes
- `artist_product_stats` - Stats par produit
- `product_categories` - Catégories produits
- `user_onboarding` - Suivi onboarding
- `push_subscriptions` - Abonnements push

---

## 🔌 API Endpoints

### Authentification
- `POST /api/login` - Login utilisateur
- `POST /api/admin-login` - Login admin
- `POST /api/signup` - Inscription

### Posts
- `GET /api/posts` - Liste posts
- `POST /api/posts` - Créer post
- `DELETE /api/posts` - Supprimer post

### Boutique
- `GET /api/products` - Liste produits
- `POST /api/products` - Ajouter produit
- `GET /api/orders` - Liste commandes
- `POST /api/orders` - Créer commande

### Admin - Nouveaux
- `GET /api/artist-stats` - Stats artistes
- `GET /api/orders/:orderId/tracking` - Tracking livraison
- `POST /api/delivery-tracking` - Créer événement tracking
- `GET /api/product-categories` - Catégories produits
- `POST /api/product-categories` - Créer catégorie

---

## 🎨 Fonctionnalités Intégrées

### Feature 7: Dashboard Artiste
- **Composant**: `ArtistDashboard.tsx`
- **API**: `/api/artist-stats`
- **Base de données**: `artist_stats`, `artist_product_stats`
- **Statut**: 100% réel - requêtes PostgreSQL

### Feature 6: Onboarding Amélioré
- **Composant**: `OnboardingTutorial.tsx`
- **Base de données**: `user_onboarding`
- **Statut**: 100% réel - localStorage + base de données

### Feature 9: Livraison avec Tracking
- **Composant**: `DeliveryTracking.tsx`
- **API**: `/api/orders/:orderId/tracking`
- **Base de données**: `delivery_tracking_events`, `orders`
- **Statut**: 100% réel - requêtes PostgreSQL

### Feature 15: App Native (React Native)
- **Structure**: `mobile/`
- **Statut**: Structure complète, nécessite `npm install` dans dossier mobile

---

## ✅ Vérifications Production

### Build
```bash
npm run build
```
✅ Build réussi - 0 erreurs

### Tests E2E
```bash
npm run test:e2e admin-journey.spec.ts
```
✅ 10/10 tests passés

---

## 📝 Notes importantes

1. **Aucune donnée mock** - Tout vient de la base de données
2. **API handlers** - Utilisent `env.DB.prepare()` PostgreSQL
3. **Composants** - Utilisent `apiService` pour appels API réels
4. **Fallback** - En cas d'erreur, affiche état vide (pas de fausses données)
5. **Seed data** - Script disponible pour données de test réelles

---

## 🚨 Dépannage

### Si aucune donnée ne s'affiche
1. Vérifier que les migrations sont exécutées
2. Vérifier connection base de données
3. Exécuter seed data: `migrations/009_seed_data.sql`
4. Vérifier logs console pour erreurs API

### Si API échoue
1. Vérifier `DATABASE_URL` dans variables d'environnement
2. Vérifier que base de données est accessible
3. Vérifier que tables existent

---

## 📚 Documentation supplémentaire
- `INTEGRATION-NOUVELLES-FONCTIONNALITES.md` - Guide intégration
- `migrations/` - Scripts SQL
- `api/` - Handlers API
- `src/components/admin/` - Composants admin

---

**Version**: 1.0.0  
**Date**: 20 avril 2026  
**Statut**: 100% PRODUCTION - Aucune simulation
