# 🗑️ Système de suppression soft (Soft Delete)

## Qu'est-ce que la suppression soft ?

Au lieu de supprimer définitivement un compte de la base de données, le système marque le compte comme "Supprimé" tout en conservant toutes les données. Cela permet de :

- ✅ Conserver l'historique des posts, commandes, etc.
- ✅ Éviter les erreurs de référence (foreign keys)
- ✅ Permettre la restauration en cas d'erreur
- ✅ Respecter les obligations légales de conservation des données
- ✅ Analyser les données historiques

## Comment ça fonctionne ?

### Suppression d'un compte (Admin)

Quand un admin supprime un compte depuis le panneau admin :

1. Le statut du compte passe à `"Supprimé"`
2. Le compte est désapprouvé (`is_approved = false`)
3. Un email de notification est envoyé à l'admin
4. Le compte n'apparaît plus dans la liste des utilisateurs actifs
5. L'utilisateur ne peut plus se connecter

**Code modifié** : `handlers/users.js` (DELETE)

```javascript
// Avant (suppression définitive)
await db.query('DELETE FROM users WHERE id = $1', [Number(id)]);

// Après (suppression soft)
await db.query(
  `UPDATE users SET status = 'Supprimé', is_approved = false WHERE id = $1`,
  [Number(id)]
);
```

### Connexion bloquée

Les comptes supprimés ne peuvent plus se connecter :

```javascript
if (user.status === 'Supprimé') {
  return res.status(403).json({ 
    error: 'This account has been deleted. Please contact support.' 
  });
}
```

### Liste des utilisateurs (Admin)

Les comptes supprimés sont exclus de la liste admin :

```javascript
// Exclure les comptes supprimés
SELECT * FROM users 
WHERE status != 'Supprimé' OR status IS NULL 
ORDER BY created_at DESC
```

## Scripts de gestion

### 1. Lister les comptes supprimés

```bash
node scripts/list-deleted-accounts.cjs
```

Affiche :
- Tous les comptes supprimés
- Nombre de posts/commandes associés
- Statistiques globales

### 2. Restaurer un compte

```bash
node scripts/restore-deleted-account.cjs
```

Permet de :
- Voir la liste des comptes supprimés
- Choisir un compte à restaurer
- Le remettre en statut "Actif" et approuvé

### 3. Suppression définitive (⚠️ DANGER)

```bash
node scripts/permanently-delete-account.cjs
```

**ATTENTION** : Supprime définitivement le compte et TOUTES ses données :
- Posts
- Commentaires
- Likes
- Messages
- Notifications
- Relations de suivi
- Commandes (optionnel)

Cette action est **IRRÉVERSIBLE** !

## Statuts possibles

| Statut | Description | Peut se connecter ? | Visible admin ? |
|--------|-------------|---------------------|-----------------|
| `Actif` | Compte normal | ✅ Oui | ✅ Oui |
| `Banni` | Compte banni | ❌ Non | ✅ Oui |
| `Supprimé` | Compte supprimé (soft) | ❌ Non | ❌ Non |
| `NULL` | Compte normal (ancien) | ✅ Oui | ✅ Oui |

## Données conservées après suppression soft

Quand un compte est supprimé (soft), ces données sont conservées :

- ✅ Informations du compte (nom, email, handle)
- ✅ Posts créés par l'utilisateur
- ✅ Commentaires
- ✅ Likes
- ✅ Messages
- ✅ Commandes passées
- ✅ Relations de suivi
- ✅ Notifications

**Avantage** : Pas de "trous" dans les données, les posts restent visibles avec l'auteur

## Notifications

### Email admin lors de la suppression

Un email est envoyé à l'admin avec :
- Nom et handle du compte supprimé
- Email du compte
- Lien vers le panneau admin

**Template** : `accountDeleted` dans `handlers/_lib/email.js`

## Cas d'usage

### 1. Utilisateur demande la suppression de son compte

1. Admin supprime le compte depuis le panneau
2. Le compte passe en statut "Supprimé"
3. L'utilisateur ne peut plus se connecter
4. Les données sont conservées pour l'historique

### 2. Erreur de suppression

1. Admin supprime le mauvais compte
2. Utilise `restore-deleted-account.cjs` pour le restaurer
3. Le compte redevient actif

### 3. Nettoyage de la base de données

1. Lister les comptes supprimés depuis >1 an
2. Vérifier qu'ils n'ont pas de données importantes
3. Utiliser `permanently-delete-account.cjs` pour les supprimer définitivement

## Conformité RGPD

### Droit à l'oubli

Si un utilisateur demande la suppression définitive de ses données (RGPD) :

1. Suppression soft initiale (pour vérification)
2. Attendre 30 jours (délai de rétractation)
3. Suppression définitive avec `permanently-delete-account.cjs`

### Conservation des données

Certaines données peuvent être conservées pour :
- Obligations légales (comptabilité : 10 ans)
- Prévention de la fraude
- Litiges en cours

**Recommandation** : Anonymiser plutôt que supprimer définitivement

## Modifications apportées

### Fichiers modifiés

1. **`handlers/users.js`**
   - DELETE : Suppression soft au lieu de définitive
   - GET : Exclusion des comptes supprimés de la liste

2. **`handlers/login.js`**
   - Vérification du statut "Supprimé"
   - Blocage de la connexion

3. **`handlers/_lib/email.js`**
   - Nouveau template `accountDeleted`

### Scripts créés

1. **`scripts/list-deleted-accounts.cjs`**
   - Liste tous les comptes supprimés
   - Affiche les statistiques

2. **`scripts/restore-deleted-account.cjs`**
   - Restaure un compte supprimé
   - Interface interactive

3. **`scripts/permanently-delete-account.cjs`**
   - Suppression définitive avec confirmation
   - Supprime toutes les données associées

## Configuration

### Afficher les comptes supprimés dans l'admin

Si vous voulez voir les comptes supprimés dans le panneau admin, modifiez `handlers/users.js` :

```javascript
// Inclure les comptes supprimés
const { rows } = await db.query(
  'SELECT id, name, handle, email, bio, avatar_color, role, is_approved, status, created_at FROM users ORDER BY created_at DESC'
);
```

### Suppression définitive automatique

Pour supprimer automatiquement les comptes supprimés depuis >1 an :

```javascript
// Cron job (à ajouter)
async function cleanupOldDeletedAccounts() {
  await db.query(`
    DELETE FROM users 
    WHERE status = 'Supprimé' 
    AND created_at < NOW() - INTERVAL '1 year'
  `);
}
```

## Avantages vs Inconvénients

### Avantages ✅

- Conservation de l'historique
- Possibilité de restauration
- Pas d'erreurs de référence
- Conformité légale
- Analyse des données

### Inconvénients ⚠️

- Base de données plus volumineuse
- Requêtes légèrement plus complexes
- Besoin de nettoyage périodique

## Recommandations

1. **Toujours utiliser la suppression soft** pour les comptes utilisateurs
2. **Attendre 30 jours** avant toute suppression définitive
3. **Sauvegarder** avant toute suppression définitive
4. **Anonymiser** plutôt que supprimer si possible
5. **Documenter** chaque suppression définitive

## Support

Pour toute question sur le système de suppression :
- Consultez `TROUBLESHOOTING-SIGNUP.md`
- Vérifiez les logs du serveur
- Utilisez les scripts de diagnostic
