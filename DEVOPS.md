# Mini DevOps WeeklyLunch

## Strategie Git

La branche de production est `main`.

1. Creer une branche: `git switch -c feature/ma-fonctionnalite`.
2. Developper et tester localement.
3. Pousser la branche et ouvrir une pull request vers `main`.
4. Attendre que le workflow `CI` soit vert.
5. Fusionner la pull request dans `main`.
6. Le workflow `Deploy production` sauvegarde SQLite puis deploie automatiquement.

Eviter de developper directement dans `main`. Activer la protection de branche GitHub pour exiger une pull request et les trois jobs CI.

## Ce que verifie la CI

- installation reproductible avec `npm ci`
- migrations Prisma sur une base SQLite vide
- compilation TypeScript backend
- compilation Vite frontend avec `/api`
- audit des dependances runtime
- validation et construction du Compose production

## Authentification du deploiement

Le workflow n'utilise pas le mot de passe du VPS. Creer une cle dediee depuis un poste de confiance:

```bash
ssh-keygen -t ed25519 -C "github-actions-weeklylunch" -f weeklylunch_github_actions
```

Ajouter le contenu de `weeklylunch_github_actions.pub` dans `~/.ssh/authorized_keys` sur le VPS. Conserver la cle privee uniquement dans le secret GitHub `VPS_SSH_KEY`.

Verifier l'empreinte SSH affichee dans le panel IONOS ou lors de la premiere connexion, puis creer la valeur `known_hosts`:

```bash
ssh-keyscan -H 82.223.243.203
```

## Secrets GitHub

Dans `Settings > Environments > production`, creer l'environnement `production`, puis ajouter:

| Secret | Valeur |
| --- | --- |
| `VPS_HOST` | IP publique du VPS |
| `VPS_USER` | utilisateur de deploiement, temporairement `root` |
| `VPS_SSH_KEY` | cle privee Ed25519 complete |
| `VPS_KNOWN_HOSTS` | ligne verifiee produite par `ssh-keyscan -H` |

Ne jamais enregistrer le mot de passe du VPS dans GitHub Actions ou dans le depot. Une fois le premier deploiement termine, creer un utilisateur `deploy` avec droits Docker limites et remplacer `root` dans `VPS_USER`.

Il est conseille d'activer une approbation obligatoire sur l'environnement GitHub `production`. Le push dans `main` prepare alors le deploiement, mais GitHub attend une validation humaine avant d'acceder aux secrets.

## Premier deploiement

Au premier passage, le workflow peut televerser les fichiers puis s'arreter parce que l'environnement n'existe pas encore. Se connecter alors au VPS et creer le fichier secret:

```bash
cp /opt/weeklylunch/backend/.env.production.example /opt/weeklylunch/backend/.env
chmod 600 /opt/weeklylunch/backend/.env
nano /opt/weeklylunch/backend/.env
```

Relancer ensuite manuellement `Deploy production`. Le workflow conserve automatiquement `backend/.env`, `backups/` et les volumes Docker lors des synchronisations suivantes.

## Deploiement et retour arriere

Un push fusionne dans `main` declenche le deploiement. Pour un lancement manuel ou un retour arriere:

1. Ouvrir `Actions > Deploy production`.
2. Cliquer sur `Run workflow`.
3. Indiquer `main`, un tag ou le SHA d'un ancien commit.
4. Valider le deploiement dans l'environnement `production` si une approbation est active.

Avant chaque mise a jour existante, `deploy-production.sh` cree une sauvegarde SQLite datee. Une migration de base est appliquee avant le redemarrage, puis les routes frontend et backend sont controlees localement.

## Commandes locales

```bash
npm run build
npm run check:prod
docker compose -f docker-compose.prod.yml build
```

## Commandes de secours sur le VPS

```bash
cd /opt/weeklylunch
./deploy/scripts/backup-sqlite.sh
./deploy/scripts/deploy-production.sh
docker compose -f docker-compose.prod.yml logs -f
```
