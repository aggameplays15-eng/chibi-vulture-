# 🧪 Guide de Test Manuel - Interface Admin

## Préparation

1. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

2. **Ouvrir le navigateur**
   - URL : `http://localhost:5173/goated`

---

## 🔐 Test 1 : Connexion Admin

### Étapes
1. ✅ Vérifier que la page `/goated` s'affiche
2. ✅ Observer le design sombre avec l'icône ShieldAlert rouge
3. ✅ Vérifier le titre "Admin Terminal"
4. ✅ Vérifier le texte "Zone d'accès restreinte"

### Saisie des identifiants
5. ✅ Cliquer dans le champ "Secure Email"
6. ✅ Taper : `papicamara22@gmail.com`
7. ✅ Cliquer dans le champ "Access Key"
8. ✅ Taper : `fantasangare2203`
9. ✅ Cliquer sur le bouton "DÉVERROUILLER"

### Résultat attendu
- ✅ Toast de succès : "Identité Admin confirmée. Bienvenue."
- ✅ Redirection vers `/admin`
- ✅ Chargement du dashboard admin

### Test d'échec
10. ✅ Se déconnecter
11. ✅ Retourner sur `/goated`
12. ✅ Essayer avec un mauvais mot de passe
13. ✅ Vérifier le message d'erreur : "Accès refusé"

---

## 📊 Test 2 : Dashboard - Vue d'ensemble

### Vérifications visuelles
1. ✅ Header avec "ADMINISTRATION" visible
2. ✅ Sous-titre "Panel Suprême" visible
3. ✅ Icône Activity (vert) en haut à droite

### Cartes de statistiques (4 cartes)
4. ✅ **Carte Revenus**
   - Icône TrendingUp (vert)
   - Valeur en millions GNF
   - Badge "+12%" avec flèche montante
   - Hover : effet d'agrandissement de l'icône

5. ✅ **Carte Utilisateurs**
   - Icône Users (bleu)
   - Nombre total d'utilisateurs
   - Badge "Total"

6. ✅ **Carte Commandes**
   - Icône Zap (jaune)
   - Nombre de commandes
   - Badge "Live" qui pulse

7. ✅ **Carte Alertes**
   - Icône AlertTriangle (rouge)
   - Nombre de signalements
   - Badge "Signalements"

### Graphiques
8. ✅ Scroller vers le bas
9. ✅ Vérifier la présence de graphiques (AdminCharts)
10. ✅ Vérifier que les graphiques sont interactifs

---

## 🎨 Test 3 : Navigation entre les onglets

### Barre d'onglets
1. ✅ Vérifier 6 onglets avec icônes :
   - Dashboard (LayoutDashboard)
   - Shop (ShoppingBag)
   - Delivery (Truck)
   - Modération (ShieldCheck)
   - Users (Users)
   - Appearance (Palette)

### Test de chaque onglet

#### Onglet 1 : Dashboard (déjà testé)
2. ✅ Cliquer sur l'icône Dashboard
3. ✅ Vérifier l'animation fade-in
4. ✅ Vérifier que l'onglet est actif (fond blanc, ombre)

#### Onglet 2 : Shop
5. ✅ Cliquer sur l'icône ShoppingBag
6. ✅ Attendre l'animation (500ms)
7. ✅ Vérifier le composant ShopManagement
8. ✅ Vérifier la liste des produits
9. ✅ Chercher les boutons d'action (Ajouter, Modifier, Supprimer)

#### Onglet 3 : Delivery
10. ✅ Cliquer sur l'icône Truck
11. ✅ Vérifier le composant DeliveryManagement
12. ✅ Vérifier la liste des commandes
13. ✅ Vérifier les statuts (En attente, Préparation, Livré)

#### Onglet 4 : Modération
14. ✅ Cliquer sur l'icône ShieldCheck
15. ✅ Vérifier 2 sections :
    - PendingApprovals (en haut)
    - PostModeration (en bas)

#### Onglet 5 : Users
16. ✅ Cliquer sur l'icône Users
17. ✅ Vérifier le composant UserManagement
18. ✅ Vérifier la liste des utilisateurs
19. ✅ Vérifier le badge avec le nombre total

#### Onglet 6 : Appearance
20. ✅ Cliquer sur l'icône Palette
21. ✅ Vérifier le composant LogoManagement
22. ✅ Chercher les options de personnalisation

---

## 🛍️ Test 4 : Gestion Boutique (Shop)

### Navigation
1. ✅ Aller dans l'onglet Shop

### Liste des produits
2. ✅ Vérifier que les produits s'affichent
3. ✅ Pour chaque produit, vérifier :
   - Image du produit
   - Nom du produit
   - Prix en GNF
   - Catégorie
   - Stock disponible
   - Badge "Featured" si applicable

### Ajouter un produit
4. ✅ Chercher le bouton "Ajouter un produit" ou "+"
5. ✅ Cliquer dessus
6. ✅ Vérifier l'ouverture d'un formulaire/modal
7. ✅ Remplir les champs :
   - Nom : "Test Produit Admin"
   - Prix : 150000
   - Catégorie : "Test"
   - Stock : 10
   - Image URL : (une URL valide)
8. ✅ Cocher "Featured" si disponible
9. ✅ Cliquer sur "Ajouter" ou "Sauvegarder"
10. ✅ Vérifier le toast de succès
11. ✅ Vérifier que le produit apparaît dans la liste

### Modifier un produit
12. ✅ Trouver un produit existant
13. ✅ Cliquer sur le bouton "Modifier" ou icône crayon
14. ✅ Modifier le nom : "Produit Modifié"
15. ✅ Modifier le prix
16. ✅ Sauvegarder
17. ✅ Vérifier le toast de succès
18. ✅ Vérifier que les modifications sont visibles

### Supprimer un produit
19. ✅ Trouver le produit de test créé
20. ✅ Cliquer sur le bouton "Supprimer" ou icône poubelle
21. ✅ Vérifier la demande de confirmation
22. ✅ Confirmer la suppression
23. ✅ Vérifier le toast de succès
24. ✅ Vérifier que le produit a disparu

---

## 🚚 Test 5 : Gestion Livraisons (Delivery)

### Navigation
1. ✅ Aller dans l'onglet Delivery

### Liste des commandes
2. ✅ Vérifier que les commandes s'affichent
3. ✅ Pour chaque commande, vérifier :
   - ID de commande
   - Nom du client
   - Total en GNF
   - Statut (badge coloré)
   - Date de commande
   - Liste des articles

### Changer le statut d'une commande
4. ✅ Trouver une commande "En attente"
5. ✅ Cliquer sur le menu déroulant de statut
6. ✅ Sélectionner "Préparation"
7. ✅ Vérifier le changement de couleur du badge
8. ✅ Vérifier le toast de confirmation

9. ✅ Changer à nouveau vers "Livré"
10. ✅ Vérifier le badge vert
11. ✅ Vérifier le toast de confirmation

### Détails d'une commande
12. ✅ Cliquer sur une commande pour voir les détails
13. ✅ Vérifier la liste complète des articles
14. ✅ Vérifier les quantités
15. ✅ Vérifier le calcul du total

### Zones de livraison
16. ✅ Chercher la section "Zones de livraison"
17. ✅ Vérifier la liste des zones
18. ✅ Vérifier les tarifs par zone
19. ✅ Tester l'ajout d'une nouvelle zone si disponible
20. ✅ Tester la modification d'un tarif

---

## 🛡️ Test 6 : Modération

### Navigation
1. ✅ Aller dans l'onglet Modération

### Section Approbations en attente
2. ✅ Vérifier le titre "Approbations en attente"
3. ✅ Vérifier l'icône Clock (orange)

### Liste des demandes
4. ✅ Pour chaque demande, vérifier :
   - Avatar de l'utilisateur
   - Nom de l'utilisateur
   - Badge "En attente"
   - Bouton vert (Check) pour approuver
   - Bouton rouge (X) pour rejeter

### Approuver un artiste
5. ✅ Trouver une demande en attente
6. ✅ Cliquer sur le bouton vert (Check)
7. ✅ Vérifier le toast : "Compte de [Nom] approuvé ! ✅"
8. ✅ Vérifier que la demande disparaît de la liste

### Rejeter une demande
9. ✅ Trouver une autre demande
10. ✅ Cliquer sur le bouton rouge (X)
11. ✅ Vérifier la demande de confirmation
12. ✅ Confirmer le rejet
13. ✅ Vérifier le toast de confirmation
14. ✅ Vérifier que la demande disparaît

### Section Modération des posts
15. ✅ Scroller vers le bas
16. ✅ Vérifier la section PostModeration
17. ✅ Vérifier la liste des posts signalés
18. ✅ Pour chaque post, vérifier :
    - Image du post
    - Nom de l'artiste
    - Nombre de signalements
    - Boutons d'action

### Modérer un post
19. ✅ Trouver un post signalé
20. ✅ Cliquer sur "Approuver" ou "Supprimer"
21. ✅ Vérifier le toast de confirmation
22. ✅ Vérifier que le post disparaît ou change de statut

---

## 👥 Test 7 : Gestion Utilisateurs

### Navigation
1. ✅ Aller dans l'onglet Users

### Vue d'ensemble
2. ✅ Vérifier le titre "Utilisateurs"
3. ✅ Vérifier le badge avec le nombre total
4. ✅ Vérifier la liste des utilisateurs

### Informations utilisateur
5. ✅ Pour chaque utilisateur, vérifier :
   - Avatar (avec badge Admin si applicable)
   - Nom de l'utilisateur
   - Badge de rôle (Artiste, Admin, Member)
   - Email
   - Indicateur de statut (point vert/rouge)
   - Bouton menu (MoreVertical)

### Menu d'actions
6. ✅ Cliquer sur le bouton menu (3 points) d'un utilisateur
7. ✅ Vérifier les options :
   - Contacter (icône Mail)
   - Promouvoir (icône Shield)
   - Bannir (icône UserX, en rouge)

### Contacter un utilisateur
8. ✅ Cliquer sur "Contacter"
9. ✅ Vérifier l'action (ouverture email ou modal)

### Promouvoir un utilisateur
10. ✅ Trouver un utilisateur "Member"
11. ✅ Ouvrir le menu
12. ✅ Cliquer sur "Promouvoir"
13. ✅ Vérifier la demande de confirmation
14. ✅ Confirmer
15. ✅ Vérifier le changement de badge

### Bannir un utilisateur
16. ✅ Trouver un utilisateur à bannir (pas l'admin !)
17. ✅ Ouvrir le menu
18. ✅ Cliquer sur "Bannir" (rouge)
19. ✅ Vérifier la demande de confirmation
20. ✅ Confirmer
21. ✅ Vérifier le toast : "[Nom] a été banni de la plateforme."
22. ✅ Vérifier que l'indicateur devient rouge
23. ✅ Vérifier que le statut change à "Banni"

---

## 🎨 Test 8 : Apparence (Logo & Couleurs)

### Navigation
1. ✅ Aller dans l'onglet Appearance

### Gestion du logo
2. ✅ Vérifier la section LogoManagement
3. ✅ Vérifier l'aperçu du logo actuel
4. ✅ Chercher le champ "URL du logo"

### Changer le logo
5. ✅ Entrer une nouvelle URL de logo
6. ✅ Exemple : `https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`
7. ✅ Cliquer sur "Mettre à jour" ou "Sauvegarder"
8. ✅ Vérifier le toast de succès
9. ✅ Vérifier que l'aperçu change
10. ✅ Vérifier que le logo change dans la navigation

### Gestion des couleurs
11. ✅ Chercher la section "Couleur principale"
12. ✅ Vérifier le sélecteur de couleur
13. ✅ Cliquer sur le sélecteur
14. ✅ Choisir une nouvelle couleur (ex: bleu #3B82F6)
15. ✅ Sauvegarder
16. ✅ Vérifier que les éléments de l'interface changent de couleur
17. ✅ Vérifier les boutons, badges, etc.

### Réinitialiser
18. ✅ Remettre la couleur d'origine (#EC4899)
19. ✅ Remettre le logo d'origine
20. ✅ Vérifier que tout revient à la normale

---

## 🔄 Test 9 : Responsive & Mobile

### Desktop
1. ✅ Vérifier que tout s'affiche correctement en plein écran
2. ✅ Vérifier les espacements
3. ✅ Vérifier les animations

### Tablette (768px)
4. ✅ Réduire la fenêtre à ~768px
5. ✅ Vérifier que les cartes s'adaptent
6. ✅ Vérifier que les onglets restent accessibles
7. ✅ Vérifier le scroll horizontal si nécessaire

### Mobile (375px)
8. ✅ Réduire à ~375px
9. ✅ Vérifier que les cartes passent en colonne
10. ✅ Vérifier que les onglets sont scrollables
11. ✅ Vérifier que les tableaux sont scrollables
12. ✅ Vérifier que les boutons restent cliquables

---

## 🚀 Test 10 : Performance & UX

### Temps de chargement
1. ✅ Rafraîchir la page
2. ✅ Chronométrer le temps de chargement
3. ✅ Vérifier que c'est < 3 secondes

### Animations
4. ✅ Vérifier les transitions entre onglets (smooth)
5. ✅ Vérifier les hover effects sur les cartes
6. ✅ Vérifier les animations des boutons

### Feedback utilisateur
7. ✅ Vérifier que chaque action affiche un toast
8. ✅ Vérifier que les toasts disparaissent automatiquement
9. ✅ Vérifier les messages d'erreur clairs

### Navigation
10. ✅ Utiliser le bouton retour du navigateur
11. ✅ Vérifier que l'état est préservé
12. ✅ Vérifier que l'authentification persiste

---

## 🔐 Test 11 : Sécurité & Déconnexion

### Accès non autorisé
1. ✅ Se déconnecter
2. ✅ Essayer d'accéder à `/admin` directement
3. ✅ Vérifier la redirection vers `/goated`

### Token expiration
4. ✅ Se connecter
5. ✅ Ouvrir les DevTools > Application > Local Storage
6. ✅ Supprimer le token `cv_token`
7. ✅ Essayer de faire une action
8. ✅ Vérifier la redirection vers login

### Déconnexion
9. ✅ Se reconnecter
10. ✅ Chercher le bouton de déconnexion
11. ✅ Cliquer sur "Déconnexion"
12. ✅ Vérifier la redirection
13. ✅ Vérifier que le token est supprimé
14. ✅ Vérifier qu'on ne peut plus accéder à `/admin`

---

## 📋 Checklist Finale

### Fonctionnalités Core
- [ ] Connexion admin fonctionne
- [ ] Dashboard affiche les stats
- [ ] Tous les onglets sont accessibles
- [ ] Toutes les animations fonctionnent

### Gestion Boutique
- [ ] Ajouter un produit
- [ ] Modifier un produit
- [ ] Supprimer un produit
- [ ] Voir la liste des produits

### Gestion Livraisons
- [ ] Voir les commandes
- [ ] Changer le statut
- [ ] Voir les détails
- [ ] Gérer les zones

### Modération
- [ ] Approuver un artiste
- [ ] Rejeter une demande
- [ ] Modérer un post
- [ ] Voir les signalements

### Gestion Utilisateurs
- [ ] Voir la liste
- [ ] Contacter un utilisateur
- [ ] Promouvoir un utilisateur
- [ ] Bannir un utilisateur

### Apparence
- [ ] Changer le logo
- [ ] Changer la couleur
- [ ] Voir les changements en temps réel

### Sécurité
- [ ] Protection des routes
- [ ] Déconnexion fonctionne
- [ ] Token géré correctement
- [ ] Accès non autorisé bloqué

---

## 🐛 Bugs à Signaler

Si vous trouvez des bugs, notez :
1. **Étape** : Quelle action vous faisiez
2. **Résultat attendu** : Ce qui devrait se passer
3. **Résultat obtenu** : Ce qui s'est passé
4. **Console** : Messages d'erreur dans la console
5. **Screenshot** : Capture d'écran si possible

---

## ✅ Résultat Final

Une fois tous les tests effectués, vous devriez avoir :
- ✅ Interface admin complètement fonctionnelle
- ✅ Toutes les actions CRUD opérationnelles
- ✅ Sécurité validée
- ✅ UX fluide et responsive
- ✅ Aucun bug critique

**Temps estimé pour tous les tests : 45-60 minutes**
