# WeeklyLunch

WeeklyLunch est une application web simple de meal prep hebdomadaire. Elle permet de creer un compte, gerer des recettes, creer des repas a partir de recettes, planifier une semaine, calculer les quantites d'ingredients, generer un resume de batch cooking et obtenir une liste de courses.

## Stack technique

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- ORM: Prisma
- Base de donnees: SQLite
- Authentification: JWT
- Mots de passe: bcryptjs
- CSS: simple, sans librairie UI
- API externe: aucune

## Structure

```txt
weeklylunch/
  package.json
  README.md
  docker-compose.yml
  frontend/
    package.json
    Dockerfile
    nginx.conf
    vite.config.ts
    tsconfig.json
    index.html
    src/
      main.tsx
      App.tsx
      index.css
      types/
      services/
      utils/
      components/
      pages/
  backend/
    package.json
    Dockerfile
    tsconfig.json
    .env.example
    prisma/
      schema.prisma
      seed.ts
    src/
      server.ts
      app.ts
      controllers/
      routes/
      middlewares/
      services/
      utils/
      types/
```

## Installation

Depuis la racine du projet:

```bash
npm install
npm run install:all
```

## Configuration

Copier le fichier d'exemple du backend:

```bash
cp backend/.env.example backend/.env
```

Sous Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Contenu attendu:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-production"
PORT=3001
```

## Prisma

Creer la base SQLite, appliquer les migrations deja fournies et generer Prisma Client:

```bash
npm run prisma:migrate --prefix backend
```

Pour creer une nouvelle migration pendant le developpement apres modification du schema:

```bash
npm run prisma:migrate:dev --prefix backend
```

Charger les donnees d'exemple de developpement. Cette commande supprime les donnees existantes et ne doit jamais etre lancee en production:

```bash
npm run prisma:seed:dev --prefix backend
```

Ouvrir Prisma Studio:

```bash
npm run prisma:studio --prefix backend
```

## Lancement

Depuis la racine:

```bash
npm run dev
```

Le backend tourne sur:

```txt
http://localhost:3001
```

Le frontend tourne sur:

```txt
http://localhost:5173
```

Le frontend appelle l'API via:

```txt
http://localhost:5173/api
```

En developpement, Vite transmet automatiquement les requetes `/api` au backend sur le port `3001`.

## Docker

Docker Compose lance deux conteneurs:

- `weeklylunch-frontend`: Nginx sert l'application et transmet `/api` au backend
- `weeklylunch-backend`: API Node.js interne, non exposee directement sur Internet

La base SQLite ainsi que les miniatures et pieces jointes de recettes sont conservees dans le volume Docker `weeklylunch-sqlite`. Les migrations Prisma sont appliquees automatiquement au demarrage du backend.

## Production VPS

La configuration de production se trouve dans `docker-compose.prod.yml`:

- frontend lie uniquement a `127.0.0.1:8081`
- backend lie uniquement a `127.0.0.1:3001`
- Nginx hote est le seul point d'entree public sur les ports 80 et 443
- SQLite et les medias de recettes sont conserves dans le volume `weeklylunch-prod-sqlite`
- l'administrateur est cree depuis `ADMIN_EMAIL`, `ADMIN_PASSWORD` et `ADMIN_NAME`
- aucun compte de test n'est cree automatiquement

Le guide complet de deploiement, sauvegarde et passage futur en HTTPS est disponible dans [DEPLOY_IONOS.md](DEPLOY_IONOS.md).

Le workflow Git, la CI GitHub Actions, le deploiement automatique et le retour arriere sont documentes dans [DEVOPS.md](DEVOPS.md).

### Configuration Docker

Depuis la racine du projet, creer le fichier `.env` utilise par Docker Compose:

Sous Windows PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
```

Sous Linux:

```bash
cp .env.example .env
nano .env
```

Variables disponibles:

```env
APP_HOST=0.0.0.0
APP_PORT=5173
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=test@weeklylunch.local
SEED_ON_START=false
```

- `APP_HOST`: interface reseau exposee; utiliser `0.0.0.0` pour un acces direct ou `127.0.0.1` derriere un reverse proxy
- `APP_PORT`: port public de l'application
- `JWT_SECRET`: secret de signature des sessions; il doit etre long, aleatoire et prive
- `ADMIN_EMAIL`: adresse du compte autorise a utiliser la console d'administration
- `SEED_ON_START`: laisser `false` hors d'un environnement de demonstration

### Console d'administration

La console utilise une URL volontairement peu evidente et apparait dans la navigation uniquement pour le compte configure dans `ADMIN_EMAIL`:

```txt
http://localhost:5173/system/weeklylunch-console-7f3a
```

L'utilisateur doit etre connecte avec l'adresse configuree dans `ADMIN_EMAIL`. La protection est controlee par le backend: connaitre l'URL ne suffit pas pour acceder aux donnees.

La console permet:

- d'exporter en JSON toutes les recettes et leurs ingredients
- d'importer un export JSON WeeklyLunch sans modifier les repas ni les plannings
- de creer, consulter, modifier et supprimer les utilisateurs

L'import ajoute les recettes aux comptes identifies par leur adresse email. Les utilisateurs correspondants doivent donc exister avant l'import. Le compte configure dans `ADMIN_EMAIL` ne peut pas etre supprime ni renomme depuis la console.

Pour generer un secret sous Windows PowerShell:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Sous Linux:

```bash
openssl rand -base64 32
```

Reporter la valeur obtenue dans `JWT_SECRET`.

### Windows avec Docker Desktop

Prerequis:

- Docker Desktop installe et demarre
- le mode de conteneurs Linux active
- Docker Compose disponible avec `docker compose version`

Construire et demarrer WeeklyLunch en arriere-plan:

```powershell
docker compose up -d --build
docker compose ps
```

L'application est alors disponible sur:

```txt
http://localhost:5173
```

Pour charger les donnees de demonstration lors de la premiere installation:

```powershell
docker compose exec backend npm run prisma:seed:dev
```

Attention: le seed supprime les donnees deja presentes. Ne pas l'executer sur une base de production.

Afficher les journaux:

```powershell
docker compose logs -f
```

Arreter les conteneurs sans supprimer les donnees:

```powershell
docker compose down
```

### Serveur de production

Ne pas exposer directement les ports 5173, 3001 ou 8081. Le deploiement public utilise `docker-compose.prod.yml`, lie les services a `127.0.0.1` et publie uniquement Nginx sur 80/443. Suivre [DEPLOY_IONOS.md](DEPLOY_IONOS.md).

### Sauvegarde et restauration

Pour obtenir une copie coherente de la base, arreter temporairement le backend puis copier le fichier SQLite:

```bash
docker compose stop backend
docker cp weeklylunch-backend:/data/dev.db ./weeklylunch-backup.db
docker compose start backend
```

Pour restaurer cette sauvegarde:

```bash
docker compose stop backend
docker cp ./weeklylunch-backup.db weeklylunch-backend:/data/dev.db
docker compose start backend
```

### Reinitialisation complete

Cette commande supprime definitivement la base Docker:

```bash
docker compose down -v
docker compose up -d --build
docker compose exec backend npm run prisma:seed:dev
```

### Commandes Docker utiles

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
docker compose exec backend npm run prisma:seed:dev
docker compose down
```

## Identifiants de test

Apres le seed:

```txt
email: test@weeklylunch.local
password: password123
```

## Calcul des portions

Chaque recette possede un nombre de portions de reference. Les ingredients sont recalcules avec la formule:

```txt
quantiteCalculee = quantiteDeBase * nombreDePortionsSouhaitees / nombreDePersonnesDeReference
```

Exemple: une recette pour 10 portions avec 2 kg de poulet donne 1 kg de poulet pour 5 portions.

Le backend expose la fonction `calculateScaledIngredients(recipe, desiredServings)`. Elle refuse les recettes dont `baseServings` est inferieur ou egal a 0 et conserve les unites saisies sans conversion automatique.

## Planning hebdomadaire

Un planning contient les jours de lundi a dimanche et les creneaux suivants:

- Petit-dejeuner
- Dejeuner
- Collation
- Diner

Chaque creneau peut recevoir un repas existant et un nombre de portions. Les routes de planning sont protegees par JWT et filtrees par utilisateur.

Note SQLite: Prisma ne supporte pas les enums avec le connecteur SQLite utilise ici. Les champs `day` et `slot` sont donc stockes en `String`, avec validation TypeScript cote backend sur les valeurs autorisees: `MONDAY` a `SUNDAY` et `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`.

## Resume de preparation

La route suivante genere le resume:

```txt
GET /api/weekly-plans/:id/prep-summary
```

Le resume regroupe les creneaux par recette unique. Pour une meme recette utilisee plusieurs fois dans la semaine:

- les portions sont additionnees
- les ingredients sont recalcules pour le total de portions
- le temps de preparation et le temps de cuisson ne sont comptes qu'une seule fois

Avec le seed, le planning exemple genere:

- Chili con carne prise de masse: 5 portions
- Poulet coco curry: 5 portions
- Temps total semaine: 120 min, soit 2h

## Liste de courses

La liste de courses regroupe les ingredients par nom normalise et unite identique:

- le nom est trim puis passe en minuscule pour le regroupement
- l'unite doit etre identique
- aucune conversion automatique n'est faite

Exemple: `riz 500 g` + `riz 500 g` devient `riz 1000 g`, mais `riz 500 g` et `riz 1 kg` restent deux lignes.

## Commandes utiles

Racine:

```bash
npm run install:all
npm run dev
npm run docker:up
npm run docker:seed
npm run docker:down
```

Backend:

```bash
npm run dev --prefix backend
npm run build --prefix backend
npm run prisma:migrate --prefix backend
npm run prisma:migrate:dev --prefix backend
npm run prisma:seed:dev --prefix backend
npm run admin:create --prefix backend
npm run prisma:studio --prefix backend
```

Frontend:

```bash
npm run dev --prefix frontend
npm run build --prefix frontend
```
