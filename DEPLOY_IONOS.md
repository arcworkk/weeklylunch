# Deploiement WeeklyLunch sur un VPS IONOS

Ce guide deploie WeeklyLunch sans nom de domaine, sur `http://IP_DU_VPS`. Nginx est le seul service public. Les ports applicatifs Docker restent lies a `127.0.0.1`.

## 1. Panel IONOS et acces SSH

Dans le panel IONOS:

- relever l'adresse IPv4 publique du VPS
- verifier que la connexion SSH fonctionne
- autoriser uniquement les ports entrants 22, 80 et 443 dans le firewall IONOS
- ne jamais ouvrir 3001, 8081, 5173 ou Prisma Studio
- plus tard, creer un record DNS `A` du domaine vers l'IPv4 du VPS

Connexion initiale:

```bash
ssh root@IP_DU_VPS
```

Utiliser ensuite de preference un utilisateur `sudo`, une cle SSH, et desactiver l'authentification SSH par mot de passe apres verification de la cle.

## 2. Installer les paquets serveur

```bash
apt update && apt upgrade -y
apt install -y git curl ca-certificates nginx ufw
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo ${UBUNTU_CODENAME:-$VERSION_CODENAME}) stable" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker nginx
```

Verifier:

```bash
docker --version
docker compose version
nginx -v
```

## 3. Configurer les firewalls

Le firewall IONOS doit autoriser 22, 80 et 443. Configurer aussi UFW dans Ubuntu:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status verbose
```

Ne pas ajouter de regle UFW pour 3001, 8081 ou 5173.

## 4. Cloner le projet

```bash
mkdir -p /opt/weeklylunch
git clone URL_DU_DEPOT_GIT /opt/weeklylunch
cd /opt/weeklylunch
```

Pour un depot prive, utiliser une deploy key SSH ou un jeton limite en lecture. Ne pas stocker de jeton dans le depot.

## 5. Configurer l'environnement production

```bash
cp backend/.env.production.example backend/.env
nano backend/.env
chmod 600 backend/.env
```

Renseigner au minimum:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="SECRET_ALEATOIRE_LONG"
PORT=3001
NODE_ENV=production
FRONTEND_URL="http://IP_DU_VPS"
ADMIN_EMAIL="votre-email@example.com"
ADMIN_PASSWORD="MOT_DE_PASSE_ADMIN_LONG_ET_UNIQUE"
ADMIN_NAME="Admin"
```

Generer un secret JWT sans l'afficher dans un historique partage:

```bash
openssl rand -base64 48
```

Le Compose production remplace `DATABASE_URL` par `file:/data/weeklylunch.db`, qui pointe vers le volume Docker persistant. Le fichier `backend/.env` est ignore par Git et ne doit jamais etre commite.

## 6. Construire et demarrer

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

Le backend execute `prisma migrate deploy` au demarrage. Pour appliquer ou verifier explicitement les migrations:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run prisma:migrate
```

Creer le compte administrateur de facon idempotente:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run admin:create
```

Cette commande ne journalise jamais le mot de passe. Elle ne recree pas l'utilisateur s'il existe deja. Ne jamais lancer `prisma:seed:dev` en production: ce seed supprime les donnees et cree le compte de test.

## 7. Tester les services locaux

```bash
curl http://127.0.0.1:3001/api/health
curl -I http://127.0.0.1:8081
```

La route de sante doit renvoyer `status: ok`, `app: weeklylunch` et un timestamp. Depuis une autre machine, `IP_DU_VPS:3001` et `IP_DU_VPS:8081` ne doivent pas repondre.

## 8. Installer la configuration Nginx par IP

```bash
cp deploy/nginx/weeklylunch-ip.conf /etc/nginx/sites-available/weeklylunch
ln -s /etc/nginx/sites-available/weeklylunch /etc/nginx/sites-enabled/weeklylunch
unlink /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Tester ensuite:

```bash
curl http://IP_DU_VPS/api/health
```

L'application est accessible sur:

```text
http://IP_DU_VPS
```

## 9. Sauvegarder et restaurer SQLite

Rendre les scripts executables une seule fois:

```bash
chmod +x deploy/scripts/backup-sqlite.sh deploy/scripts/restore-sqlite.sh
```

Creer un backup date dans `backups/`:

```bash
./deploy/scripts/backup-sqlite.sh
```

Le backend est arrete quelques secondes pendant la copie afin de garantir la coherence SQLite. Le script cree le fichier `.db` et, lorsque des miniatures ou pieces jointes existent, un dossier `weeklylunch-...-uploads` avec le meme horodatage. Aucun backup n'est supprime automatiquement. Copier regulierement le fichier et son dossier de medias hors du VPS.

Restaurer un backup:

```bash
./deploy/scripts/restore-sqlite.sh backups/weeklylunch-YYYYMMDDTHHMMSSZ.db
```

Le script demande de saisir `RESTORE` avant de remplacer la base. S'il trouve le dossier `-uploads` associe au backup, il restaure aussi les miniatures et pieces jointes.

Ne jamais executer `docker compose -f docker-compose.prod.yml down -v` sans backup: l'option `-v` supprime le volume SQLite.

## 10. Ajouter un domaine et HTTPS plus tard

1. Acheter ou rattacher le domaine.
2. Creer des records `A` pour le domaine et `www` vers l'IP du VPS.
3. Copier `deploy/nginx/weeklylunch-domain.conf` vers `/etc/nginx/sites-available/weeklylunch` et remplacer les domaines d'exemple.
4. Remplacer `FRONTEND_URL` dans `backend/.env` par `https://mon-domaine.fr`.
5. Recreer le backend et recharger Nginx.

```bash
docker compose -f docker-compose.prod.yml up -d --build backend
nginx -t && systemctl reload nginx
apt install -y certbot python3-certbot-nginx
certbot --nginx -d mon-domaine.fr -d www.mon-domaine.fr
```

Certbot ajoutera les blocs HTTPS et pourra configurer la redirection HTTP vers HTTPS.

## 11. Mise a jour et commandes utiles

```bash
cd /opt/weeklylunch
git pull --ff-only
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.prod.yml down
docker volume inspect weeklylunch-prod-sqlite
```

`docker compose down` conserve le volume. `docker compose down -v` le supprime.

## 12. Controle avant ouverture publique

- `backend/.env` existe, appartient a l'administrateur et a les permissions `600`
- `JWT_SECRET` et `ADMIN_PASSWORD` ne contiennent plus `CHANGE_ME`
- `FRONTEND_URL` correspond exactement a l'origine publique, sans slash final
- le compte `test@weeklylunch.local` n'a pas ete cree en production
- `docker compose ps` indique les services sains
- `ss -lntp` montre 3001 et 8081 uniquement sur `127.0.0.1`
- seuls 22, 80 et 443 sont autorises dans IONOS et UFW
- `/api/health` fonctionne via Nginx
- un backup SQLite et son eventuel dossier de medias ont ete crees et copies hors du VPS
- Prisma Studio n'est ni lance ni expose
