# Test Manuel Complet - Fonctionnalités Guest & Artist

**Date:** ${new Date().toLocaleDateString('fr-FR')}  
**Testeur:** _________________  
**Environnement:** □ Local □ Staging □ Production

---

## 🎯 Objectif
Vérifier que toutes les fonctionnalités pour les utilisateurs **Guest** et **Artist** fonctionnent correctement de A à Z.

---

## 📋 PARTIE 1 : MODE GUEST

### 1.1 Landing Page (/)
- [ ] La page d'accueil charge correctement
- [ ] Le logo animé "Chibi Vulture" est visible
- [ ] Le titre "CHIBI VULTURE" s'affiche
- [ ] Le sous-titre "Premium Art Community" est présent
- [ ] Bouton "SE CONNECTER" est visible et cliquable
- [ ] Bouton "Explorer en invité" est visible et cliquable
- [ ] L'animation du logo fonctionne (fade-in, rotation)

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 1.2 Navigation en Mode Guest
- [ ] Cliquer sur "Explorer en invité" → Redirige vers `/feed`
- [ ] Alternative: Aller sur `/login` puis cliquer "CONTINUER EN INVITÉ"
- [ ] Le feed s'affiche avec des posts
- [ ] La bottom navigation est visible avec les icônes:
  - [ ] Home (Fil d'actu)
  - [ ] Explore
  - [ ] Shop (Boutique)
  - [ ] Cart (Panier)
  - [ ] Profile (Profil)

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 1.3 Feed - Visualisation des Posts
- [ ] Les posts s'affichent correctement (images, titres)
- [ ] Scroll infini fonctionne (charger plus de posts)
- [ ] Cliquer sur un post → Ouvre le détail du post
- [ ] Voir le nom de l'artiste, la description
- [ ] Voir le nombre de likes et commentaires
- [ ] Bouton "like" visible (mais peut nécessiter connexion)
- [ ] Retour au feed fonctionne

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 1.4 Explore - Découverte
- [ ] Aller sur `/explore` via bottom nav
- [ ] La page Explore charge
- [ ] Voir une grille de posts/artistes
- [ ] Filtres disponibles (si implémentés)
- [ ] Cliquer sur un artiste → Voir son profil public
- [ ] Retour fonctionne

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 1.5 Shop - Boutique
- [ ] Aller sur `/shop` via bottom nav
- [ ] Les produits s'affichent (images, prix, titres)
- [ ] Cliquer sur un produit → Ouvre `/product/:id`
- [ ] Voir détails: image, prix, description, artiste
- [ ] Bouton "Ajouter au panier" visible
- [ ] Cliquer "Ajouter au panier" → Produit ajouté
- [ ] Notification/toast de confirmation
- [ ] Compteur panier s'incrémente (icône panier)

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 1.6 Cart - Panier
- [ ] Aller sur `/cart` via bottom nav
- [ ] Le panier affiche les produits ajoutés
- [ ] Voir: image, nom, prix, quantité
- [ ] Modifier la quantité (+ / -)
- [ ] Supprimer un produit du panier
- [ ] Total calculé correctement
- [ ] Bouton "Passer commande" / "Checkout" visible
- [ ] Cliquer "Checkout" → Redirige vers `/login` (guest doit se connecter)

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 1.7 Profile - Profil Guest
- [ ] Aller sur `/profile` via bottom nav
- [ ] Affiche "Visiteur" ou message invitant à se connecter
- [ ] Bouton "Se connecter" visible
- [ ] Pas d'accès aux fonctionnalités réservées (édition, posts)

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 1.8 Restrictions Guest
- [ ] Impossible de liker un post (demande connexion)
- [ ] Impossible de commenter (demande connexion)
- [ ] Impossible de suivre un artiste (demande connexion)
- [ ] Impossible de créer un post (demande connexion)
- [ ] Impossible de finaliser un achat sans compte

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

## 📋 PARTIE 2 : MODE ARTIST (Utilisateur Connecté)

### 2.1 Inscription (Signup)
- [ ] Aller sur `/signup`
- [ ] Formulaire visible avec champs:
  - [ ] Nom complet
  - [ ] Email
  - [ ] Handle (@username)
  - [ ] Mot de passe
- [ ] Remplir tous les champs avec des données valides
- [ ] Cliquer "S'INSCRIRE"
- [ ] Message de succès: "Compte créé, en attente d'approbation admin"
- [ ] Redirection vers page de patience ou login

**Données de test:**
- Nom: `Test Artist ${Date.now()}`
- Email: `test${Date.now()}@test.com`
- Handle: `testartist${Date.now()}`
- Password: `Test123!`

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.2 Approbation Admin (Prérequis)
⚠️ **Important:** Un admin doit approuver le compte avant connexion

- [ ] Se connecter en tant qu'admin sur `/admin-login`
- [ ] Aller dans "Pending Approvals"
- [ ] Approuver le nouvel utilisateur
- [ ] Vérifier que le statut passe à "approved"

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.3 Connexion (Login)
- [ ] Aller sur `/login`
- [ ] Entrer email et mot de passe du compte approuvé
- [ ] Cliquer "SE CONNECTER"
- [ ] Redirection vers `/feed`
- [ ] Vérifier que l'utilisateur est connecté (nom visible en haut)
- [ ] Token JWT stocké (vérifier localStorage/sessionStorage)

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.4 Feed - Artiste Connecté
- [ ] Le feed affiche les posts
- [ ] Bouton "Créer un post" visible (+ ou icône)
- [ ] Liker un post fonctionne (cœur devient rouge)
- [ ] Unliker fonctionne (cœur redevient gris)
- [ ] Compteur de likes s'incrémente/décrémente
- [ ] Cliquer sur un post → Voir détails + commentaires
- [ ] Ajouter un commentaire fonctionne
- [ ] Le commentaire s'affiche immédiatement

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.5 Créer un Post
- [ ] Cliquer sur "Créer un post" ou aller sur `/create-post`
- [ ] Formulaire visible:
  - [ ] Upload image (drag & drop ou sélection)
  - [ ] Titre
  - [ ] Description
  - [ ] Tags (optionnel)
- [ ] Uploader une image (JPG, PNG)
- [ ] Remplir titre et description
- [ ] Cliquer "Publier"
- [ ] Message de succès
- [ ] Redirection vers feed ou détail du post
- [ ] Le nouveau post apparaît dans le feed

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.6 Profil Artiste
- [ ] Aller sur `/profile` (son propre profil)
- [ ] Voir:
  - [ ] Photo de profil
  - [ ] Nom et handle
  - [ ] Bio
  - [ ] Nombre de followers/following
  - [ ] Grille de posts personnels
- [ ] Bouton "Éditer profil" visible
- [ ] Cliquer "Éditer profil" → Aller sur `/edit-profile`

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.7 Éditer Profil
- [ ] Formulaire d'édition visible:
  - [ ] Photo de profil (upload)
  - [ ] Nom
  - [ ] Bio
  - [ ] Localisation
  - [ ] Site web
- [ ] Modifier la bio
- [ ] Uploader une nouvelle photo de profil
- [ ] Cliquer "Enregistrer"
- [ ] Message de succès
- [ ] Retour au profil avec modifications visibles

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.8 Suivre un Artiste
- [ ] Aller sur le profil d'un autre artiste
- [ ] Bouton "Suivre" visible
- [ ] Cliquer "Suivre"
- [ ] Bouton devient "Suivi" ou "Ne plus suivre"
- [ ] Compteur followers de l'artiste s'incrémente
- [ ] Aller sur `/followers` → Voir la liste des abonnés
- [ ] Se désabonner fonctionne

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.9 Explore - Artiste Connecté
- [ ] Aller sur `/explore`
- [ ] Voir des suggestions d'artistes à suivre
- [ ] Filtrer par catégorie/tags
- [ ] Cliquer sur un artiste → Voir son profil
- [ ] Suivre depuis Explore fonctionne

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.10 Shop - Acheter en tant qu'Artiste
- [ ] Aller sur `/shop`
- [ ] Ajouter un produit au panier
- [ ] Aller sur `/cart`
- [ ] Modifier quantité
- [ ] Cliquer "Passer commande"
- [ ] Redirection vers `/checkout`
- [ ] Formulaire de livraison visible:
  - [ ] Adresse
  - [ ] Ville
  - [ ] Code postal
  - [ ] Pays
- [ ] Remplir les informations
- [ ] Méthode de paiement (simulée ou Stripe)
- [ ] Cliquer "Confirmer la commande"
- [ ] Redirection vers `/checkout-success`
- [ ] Message de confirmation
- [ ] Email de confirmation (si configuré)

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.11 Messages / Chat
- [ ] Aller sur `/messages`
- [ ] Liste des conversations visible
- [ ] Cliquer sur une conversation → Ouvre le chat
- [ ] Envoyer un message
- [ ] Le message s'affiche immédiatement
- [ ] Recevoir une réponse (tester avec 2 comptes)
- [ ] Notifications de nouveaux messages

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.12 Notifications
- [ ] Aller sur `/notifications`
- [ ] Voir les notifications:
  - [ ] Nouveau follower
  - [ ] Like sur un post
  - [ ] Commentaire sur un post
  - [ ] Nouveau message
- [ ] Cliquer sur une notification → Redirige vers l'élément concerné
- [ ] Marquer comme lu fonctionne

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.13 Paramètres
- [ ] Aller sur `/settings`
- [ ] Options visibles:
  - [ ] Changer mot de passe
  - [ ] Notifications (activer/désactiver)
  - [ ] Confidentialité
  - [ ] Langue
  - [ ] Thème (clair/sombre)
- [ ] Modifier un paramètre
- [ ] Enregistrer
- [ ] Vérifier que le changement est appliqué

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 2.14 Déconnexion
- [ ] Bouton "Déconnexion" visible (menu ou settings)
- [ ] Cliquer "Déconnexion"
- [ ] Redirection vers `/login` ou landing page
- [ ] Token JWT supprimé
- [ ] Impossible d'accéder aux pages protégées
- [ ] Retour en mode guest

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

## 📋 PARTIE 3 : TESTS TRANSVERSAUX

### 3.1 Responsive Design
- [ ] Tester sur mobile (< 768px)
- [ ] Tester sur tablette (768px - 1024px)
- [ ] Tester sur desktop (> 1024px)
- [ ] Bottom navigation visible sur mobile
- [ ] Sidebar visible sur desktop
- [ ] Images responsive
- [ ] Textes lisibles sur tous écrans

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 3.2 Performance
- [ ] Temps de chargement initial < 3s
- [ ] Images optimisées (lazy loading)
- [ ] Scroll fluide
- [ ] Pas de lag lors des interactions
- [ ] Animations fluides (60fps)

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 3.3 Accessibilité
- [ ] Navigation au clavier fonctionne (Tab, Enter)
- [ ] Focus visible sur les éléments interactifs
- [ ] Alt text sur les images
- [ ] Labels sur les formulaires
- [ ] Contraste suffisant (WCAG AA)
- [ ] Screen reader compatible (tester avec NVDA/JAWS)

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 3.4 PWA (Progressive Web App)
- [ ] Manifest.json présent
- [ ] Service Worker enregistré
- [ ] Installable sur mobile (prompt "Ajouter à l'écran d'accueil")
- [ ] Fonctionne hors ligne (mode offline)
- [ ] Icône d'app visible après installation

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

### 3.5 Sécurité
- [ ] HTTPS activé (cadenas dans la barre d'adresse)
- [ ] Pas de données sensibles dans l'URL
- [ ] Token JWT sécurisé (httpOnly si possible)
- [ ] Rate limiting sur login (max 5 tentatives)
- [ ] Validation des inputs (pas d'injection SQL/XSS)
- [ ] CORS configuré correctement

**Résultat:** ✅ ❌  
**Notes:** _______________________________________________

---

## 📊 RÉSUMÉ DES TESTS

### Statistiques
- **Total tests:** 100+
- **Tests réussis:** _____ / _____
- **Tests échoués:** _____ / _____
- **Taux de réussite:** _____ %

### Bugs Critiques Identifiés
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Bugs Mineurs
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Améliorations Suggérées
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## ✅ VALIDATION FINALE

- [ ] Toutes les fonctionnalités Guest fonctionnent
- [ ] Toutes les fonctionnalités Artist fonctionnent
- [ ] Aucun bug bloquant
- [ ] Performance acceptable
- [ ] Sécurité validée
- [ ] Prêt pour production

**Signature Testeur:** _________________  
**Date:** _________________

---

## 🚀 COMMANDES UTILES

```bash
# Lancer l'application en local
npm run dev

# Lancer les tests E2E automatisés
npm run test:e2e

# Lancer les tests E2E en mode UI
npm run test:e2e:ui

# Build pour production
npm run build

# Preview du build
npm run preview
```

---

**Note:** Ce document doit être rempli manuellement en testant chaque fonctionnalité dans un navigateur.
