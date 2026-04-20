# 🔐 Accès Administration

## Connexion Admin

### URL d'accès
```
http://localhost:5173/goated
```
ou en production :
```
https://votre-domaine.com/goated
```

### Identifiants
- **Email** : `papicamara22@gmail.com`
- **Mot de passe** : `fantasangare2203`

## 🎯 Fonctionnalités Admin

Une fois connecté, vous aurez accès à :

### 📊 Dashboard
- Statistiques en temps réel
- Revenus totaux
- Nombre d'utilisateurs
- Commandes actives
- Alertes et signalements

### 🛍️ Gestion Boutique
- Ajouter/modifier/supprimer des produits
- Gérer les stocks
- Définir les produits en vedette
- Catégorisation

### 🚚 Gestion Livraisons
- Suivi des commandes
- Statuts de livraison
- Zones de livraison
- Tarifs de livraison

### 🛡️ Modération
- Approbation des nouveaux artistes
- Modération des posts signalés
- Gestion des contenus

### 👥 Gestion Utilisateurs
- Liste complète des utilisateurs
- Suspendre/bannir des comptes
- Promouvoir des utilisateurs
- Contacter les utilisateurs

### 🎨 Apparence
- Modifier le logo de la plateforme
- Personnaliser les couleurs
- Thème général

## ⚠️ Important

1. **Ne partagez jamais ces identifiants**
2. **Changez le mot de passe en production**
3. **Activez 2FA si possible**
4. **Surveillez les logs de connexion**

## 🔒 Sécurité

- Route admin non évidente (`/goated`)
- API séparée de l'authentification artiste
- Rate limiting : 5 tentatives max / 15 minutes
- Token JWT avec expiration
- Validation stricte des entrées

## 🆘 En cas de problème

Si vous ne pouvez pas vous connecter :

1. Vérifiez l'URL : `/goated` (pas `/admin` ou `/login`)
2. Vérifiez l'email : `papicamara22@gmail.com`
3. Vérifiez le mot de passe : `fantasangare2203`
4. Videz le cache du navigateur
5. Vérifiez que le serveur est lancé
6. Consultez les logs du serveur

## 📱 Accès Mobile

L'interface admin est responsive et accessible depuis mobile, mais pour une meilleure expérience, utilisez un ordinateur.
