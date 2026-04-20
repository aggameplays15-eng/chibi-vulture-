# Guide de déploiement sur Vercel

## Prérequis

- Compte GitHub avec le repository `aggameplays15-eng/chibi-vulture-`
- Compte Vercel (vercel.com)
- Node.js et npm installés localement
- Variables d'environnement configurées

## Étape 1: Configuration des variables d'environnement

1. Consultez le fichier `VERCEL-ENV-VARS.md` pour la liste complète des variables
2. Les variables obligatoires minimum:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV` (valeur: `production`)

## Étape 2: Lier le repository GitHub à Vercel

### Option A: Via l'interface web Vercel

1. Connectez-vous à [vercel.com](https://vercel.com)
2. Cliquez sur "Add New Project"
3. Importez le repository GitHub `aggameplays15-eng/chibi-vulture-`
4. Vercel détectera automatiquement la configuration

### Option B: Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter à Vercel
vercel login

# Lier le projet
vercel link
```

## Étape 3: Configuration du projet Vercel

### Paramètres de build

Vercel détectera automatiquement:
- **Framework**: Preset (détecté automatiquement)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Si la détection automatique échoue, configurez manuellement dans Project Settings.

### Variables d'environnement

1. Allez dans Project Settings > Environment Variables
2. Ajoutez toutes les variables listées dans `VERCEL-ENV-VARS.md`
3. Sélectionnez les environnements appropriés:
   - **Production**: Pour le déploiement principal
   - **Preview**: Pour les déploiements de preview
   - **Development**: Pour l'environnement de développement

## Étape 4: Premier déploiement

### Via l'interface web

1. Cliquez sur "Deploy"
2. Vercel construira et déploiera automatiquement
3. Attendez la fin du build (environ 2-5 minutes)

### Via CLI

```bash
# Déployer en production
vercel --prod

# Déployer en preview
vercel
```

## Étape 5: Vérification du déploiement

1. Vérifiez que le build a réussi dans l'onglet "Deployments"
2. Testez l'URL de production
3. Vérifiez les logs si nécessaire (onglet "Logs")

## Configuration spécifique

### Routes API

Le fichier `vercel.json` est configuré pour:
- Gérer les routes API (`/api/*`)
- Servir le frontend SPA avec routing client
- Ajouter les headers CORS nécessaires pour les API

### Base de données

Assurez-vous que:
- La `DATABASE_URL` pointe vers une base PostgreSQL accessible
- La base de données est configurée pour accepter les connexions depuis Vercel
- Les migrations SQL ont été exécutées sur la base de production

### Migrations de base de données

Exécutez les migrations sur votre base de production:

```bash
# Si vous utilisez Neon PostgreSQL ou un autre service
psql $DATABASE_URL -f migrations/001_add_push_notifications.sql
psql $DATABASE_URL -f migrations/002_add_app_settings.sql
```

## Déploiements automatiques

Vercel déploiera automatiquement à chaque push sur:
- **Branch main/master**: Déploiement en production
- **Pull requests**: Déploiement en preview

## Résolution de problèmes

### Build échoue

1. Vérifiez les logs de build dans l'onglet "Deployments"
2. Assurez-vous que toutes les dépendances sont dans `package.json`
3. Vérifiez que les variables d'environnement sont correctement configurées

### Erreur 500 sur les routes API

1. Vérifiez les logs de fonction dans l'onglet "Functions"
2. Assurez-vous que `DATABASE_URL` et `JWT_SECRET` sont configurés
3. Vérifiez que la base de données est accessible

### Problèmes CORS

Le fichier `vercel.json` inclut déjà les headers CORS nécessaires. Si vous avez toujours des problèmes:
1. Vérifiez la configuration CORS dans `api/_lib/cors.js`
2. Assurez-vous que `FRONTEND_URL` est configuré si nécessaire

## Mise à jour du déploiement

Pour mettre à jour l'application:

1. Faites vos modifications localement
2. Commit et push sur GitHub
3. Vercel déploiera automatiquement

```bash
git add .
git commit -m "Votre message de commit"
git push origin master
```

## Domaine personnalisé

Pour configurer un domaine personnalisé:

1. Allez dans Project Settings > Domains
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions de Vercel
4. Attendez la propagation DNS (environ 24-48h)

## Monitoring et logs

- **Deployments**: Historique des déploiements
- **Logs**: Logs en temps réel des fonctions et du build
- **Analytics**: Statistiques d'utilisation (disponible sur les plans payants)

## Support

- Documentation Vercel: https://vercel.com/docs
- Documentation du projet: Consultez les fichiers `.md` dans le repository
- Issues GitHub: Signalez les problèmes dans le repository
