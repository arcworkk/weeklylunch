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

Charger les donnees d'exemple:

```bash
npm run prisma:seed --prefix backend
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
http://localhost:3001/api
```

## Docker

Le projet peut aussi tourner avec Docker Compose. La base SQLite est stockee dans un volume Docker nomme `weeklylunch-sqlite`.

Construire et lancer les conteneurs:

```bash
npm run docker:up
```

Ou directement:

```bash
docker compose up --build
```

Charger les donnees de demonstration dans le conteneur backend:

```bash
npm run docker:seed
```

Arreter les conteneurs:

```bash
npm run docker:down
```

Reinitialiser completement la base Docker:

```bash
docker compose down -v
docker compose up --build
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
npm run prisma:seed --prefix backend
npm run prisma:studio --prefix backend
```

Frontend:

```bash
npm run dev --prefix frontend
npm run build --prefix frontend
```
