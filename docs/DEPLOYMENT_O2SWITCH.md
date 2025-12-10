# 🚀 Guide de Déploiement sur O2Switch

**Date** : 10 décembre 2025
**Version** : MVP 1.0

Ce guide détaille le déploiement complet de l'outil de scraping sur O2Switch.

---

## 📋 Prérequis

### Compte O2Switch
- ✅ Compte O2Switch actif
- ✅ Accès cPanel
- ✅ Accès SSH activé
- ✅ Nom de domaine configuré (ou sous-domaine)

### Logiciels Locaux
- Node.js >= 22.19.0
- Git
- Client SSH (PuTTY ou terminal)

---

## 🏗️ Architecture sur O2Switch

```
O2Switch Hébergement
├── Frontend (React)
│   └── /public_html/scraping-tool/
│       └── Build React statique
│
├── Backend (Node.js)
│   └── /nodejs/scraping-api/
│       ├── src/
│       ├── node_modules/
│       ├── .env.production
│       └── package.json
│
└── Base de Données (MySQL)
    └── outil_scraping_db
        ├── prospects
        ├── tags
        ├── sources_scraping
        └── tables de liaison
```

---

## 📦 Étape 1 : Préparation Locale

### 1.1 Build du Frontend

```bash
cd frontend
npm install
npm run build
```

**Résultat** : Dossier `frontend/dist/` avec les fichiers statiques optimisés

### 1.2 Préparation du Backend

```bash
cd backend
npm install --production
```

**Note** : Installer uniquement les dépendances de production (sans devDependencies)

### 1.3 Configuration .env.production

Créer `backend/.env.production` :

```env
# Environment
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=votrecompte_outil_scraping
DB_USER=votrecompte_outil_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE

# Server
PORT=3001
FRONTEND_URL=https://votre-domaine.com

# Anti-Bot Configuration
ANTIBOT_STRATEGY=stealth
STEALTH_ENABLED=true
BROWSER_PROFILE_PATH=./browser-profiles/production

# Playwright
PLAYWRIGHT_BROWSERS_PATH=/home/votrecompte/nodejs/scraping-api/browsers
```

⚠️ **Important** : Remplacer tous les `votrecompte` et `votre-domaine.com` par vos valeurs réelles

---

## 🗄️ Étape 2 : Configuration Base de Données MySQL

### 2.1 Créer la Base de Données via cPanel

1. **Connexion cPanel** : https://votre-domaine.com:2083
2. **MySQL® Databases**
3. **Créer une nouvelle base de données** :
   - Nom : `outil_scraping`
   - cPanel ajoutera automatiquement le préfixe : `votrecompte_outil_scraping`

### 2.2 Créer un Utilisateur MySQL

1. **Section "Utilisateurs MySQL"**
2. **Créer un nouvel utilisateur** :
   - Nom d'utilisateur : `outil_user`
   - Mot de passe : Générer un mot de passe fort
   - Préfixe auto : `votrecompte_outil_user`

### 2.3 Associer l'Utilisateur à la Base de Données

1. **Section "Ajouter un utilisateur à une base de données"**
2. Sélectionner :
   - Utilisateur : `votrecompte_outil_user`
   - Base de données : `votrecompte_outil_scraping`
3. **Privilèges** : Cocher "TOUS LES PRIVILÈGES"

### 2.4 Importer le Schéma de Base de Données

**Option A : Via phpMyAdmin (recommandé)**

1. Ouvrir **phpMyAdmin** depuis cPanel
2. Sélectionner la base `votrecompte_outil_scraping`
3. Onglet **"SQL"**
4. Copier-coller le schéma suivant :

```sql
-- Table prospects
CREATE TABLE IF NOT EXISTS `prospects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom_entreprise` VARCHAR(255) NOT NULL,
  `nom_contact` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `telephone` VARCHAR(50) DEFAULT NULL,
  `telephone_2` VARCHAR(50) DEFAULT NULL,
  `telephone_3` VARCHAR(50) DEFAULT NULL,
  `adresse` TEXT DEFAULT NULL,
  `url_site` VARCHAR(500) DEFAULT NULL,
  `latitude` DECIMAL(10,8) DEFAULT NULL,
  `longitude` DECIMAL(11,8) DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  `ville` VARCHAR(255) DEFAULT NULL,
  `code_postal` VARCHAR(10) DEFAULT NULL,
  `date_ajout` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_nom_entreprise` (`nom_entreprise`),
  INDEX `idx_ville` (`ville`),
  INDEX `idx_date_ajout` (`date_ajout`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table tags
CREATE TABLE IF NOT EXISTS `tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL UNIQUE,
  INDEX `idx_nom` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table sources_scraping
CREATE TABLE IF NOT EXISTS `sources_scraping` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `couleur` VARCHAR(7) DEFAULT '#3B82F6',
  `actif` BOOLEAN DEFAULT TRUE,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_nom` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de liaison prospects_tags
CREATE TABLE IF NOT EXISTS `prospects_tags` (
  `prospect_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`prospect_id`, `tag_id`),
  FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de liaison prospects_sources
CREATE TABLE IF NOT EXISTS `prospects_sources` (
  `prospect_id` INT NOT NULL,
  `source_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`prospect_id`, `source_id`),
  FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`source_id`) REFERENCES `sources_scraping`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données initiales : Sources
INSERT INTO `sources_scraping` (`nom`, `description`, `couleur`) VALUES
('Pages Jaunes', 'Annuaire Pages Jaunes', '#FFD700'),
('Google Maps', 'Google Maps Business', '#4285F4')
ON DUPLICATE KEY UPDATE nom=nom;

-- Données initiales : Tags par défaut
INSERT INTO `tags` (`nom`) VALUES
('Restaurant'),
('Commerce'),
('Service'),
('Artisan'),
('Professionnel'),
('Particulier'),
('À contacter'),
('Prioritaire')
ON DUPLICATE KEY UPDATE nom=nom;
```

5. Cliquer sur **"Exécuter"**

**Option B : Via SSH**

```bash
mysql -u votrecompte_outil_user -p votrecompte_outil_scraping < schema.sql
```

---

## 📤 Étape 3 : Upload des Fichiers

### 3.1 Upload du Frontend

**Via FTP/SFTP (FileZilla, WinSCP...)**

1. Connexion :
   - Hôte : `ftp.votre-domaine.com` ou `ssh.o2switch.net`
   - Utilisateur : Votre compte cPanel
   - Mot de passe : Mot de passe cPanel
   - Port : 21 (FTP) ou 22 (SFTP)

2. Naviguer vers `/public_html/`

3. Créer le dossier `scraping-tool/`

4. Uploader **TOUT le contenu** du dossier `frontend/dist/` vers `/public_html/scraping-tool/`

**Structure finale** :
```
/public_html/scraping-tool/
├── index.html
├── assets/
│   ├── index-xxx.js
│   └── index-xxx.css
└── ...
```

### 3.2 Upload du Backend

**Via SFTP ou SSH**

1. Créer le dossier backend :
```bash
mkdir -p /home/votrecompte/nodejs/scraping-api
```

2. Uploader les fichiers suivants :
   - `backend/src/` (tout le dossier)
   - `backend/package.json`
   - `backend/package-lock.json`
   - `backend/.env.production` → renommer en `.env`

**Ne PAS uploader** :
- ❌ `node_modules/` (sera installé sur le serveur)
- ❌ `.env` de développement
- ❌ `scripts/` (tests uniquement)

---

## ⚙️ Étape 4 : Configuration Node.js sur O2Switch

### 4.1 Activer Node.js via cPanel

1. **Setup Node.js App** dans cPanel
2. **Create Application** :
   - Node.js version : **22.x** (dernière stable)
   - Application mode : **Production**
   - Application root : `/home/votrecompte/nodejs/scraping-api`
   - Application URL : `scraping-api.votre-domaine.com` (ou sous-domaine)
   - Application startup file : `src/app.js`

3. Cliquer sur **"Create"**

### 4.2 Installer les Dépendances

1. Cliquer sur **"Run NPM Install"** dans l'interface cPanel

**OU** via SSH :

```bash
cd /home/votrecompte/nodejs/scraping-api
source /home/votrecompte/nodevenv/scraping-api/22/bin/activate
npm install --production
```

### 4.3 Installer Playwright et les Navigateurs

```bash
cd /home/votrecompte/nodejs/scraping-api
source /home/votrecompte/nodevenv/scraping-api/22/bin/activate

# Installer Playwright
npm install playwright

# Installer les navigateurs (Chromium seulement pour économiser l'espace)
npx playwright install chromium
```

⚠️ **Note** : L'installation des navigateurs peut prendre 5-10 minutes et ~300 MB d'espace disque.

### 4.4 Démarrer l'Application

1. Dans cPanel → **Setup Node.js App**
2. Cliquer sur votre application
3. Cliquer sur **"Restart"** ou **"Start"**

**Vérification** :
```bash
curl https://scraping-api.votre-domaine.com/health
```

**Résultat attendu** :
```json
{
  "status": "ok",
  "message": "API Scraping is running",
  "timestamp": "2025-12-10T..."
}
```

---

## 🔧 Étape 5 : Configuration Frontend pour l'API Production

### 5.1 Mettre à Jour l'URL de l'API

**Fichier** : `frontend/.env.production` (créer s'il n'existe pas)

```env
VITE_API_URL=https://scraping-api.votre-domaine.com
```

### 5.2 Rebuild et Re-upload

```bash
cd frontend
npm run build
```

Re-uploader le contenu de `dist/` vers `/public_html/scraping-tool/`

---

## 🔒 Étape 6 : Sécurité et SSL

### 6.1 Activer SSL (Let's Encrypt)

1. **cPanel** → **SSL/TLS Status**
2. Cocher votre domaine et sous-domaine API
3. Cliquer sur **"Run AutoSSL"**

**Résultat** : Certificats SSL installés automatiquement et gratuits

### 6.2 Configuration CORS

Le backend est déjà configuré pour accepter les requêtes du frontend en production.

**Vérifier** : `backend/src/app.js`

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
```

---

## 🧪 Étape 7 : Tests Post-Déploiement

### 7.1 Test du Frontend

1. Ouvrir : `https://votre-domaine.com/scraping-tool/`
2. Vérifier :
   - ✅ Page se charge correctement
   - ✅ Aucune erreur dans la console (F12)
   - ✅ Connexion API (point vert dans le header)

### 7.2 Test de l'API Backend

```bash
# Health check
curl https://scraping-api.votre-domaine.com/health

# Liste des prospects (devrait retourner un tableau vide au départ)
curl https://scraping-api.votre-domaine.com/api/prospects
```

### 7.3 Test de Scraping Complet

1. Aller sur l'onglet **"Scraping"**
2. Remplir le formulaire :
   - Source : **Pages Jaunes**
   - Mot-clé : `restaurant`
   - Localisation : `Paris`
   - Max résultats : `5`
3. Cliquer sur **"Lancer le scraping"**
4. Vérifier :
   - ✅ Tâche lancée avec succès
   - ✅ Progression visible
   - ✅ Prospects sauvegardés dans la base de données

---

## 📊 Monitoring et Logs

### Via cPanel

1. **Setup Node.js App** → Votre application
2. Cliquer sur **"Open logs"**

### Via SSH

```bash
# Logs en temps réel
tail -f /home/votrecompte/nodejs/scraping-api/logs/app.log

# Logs d'erreur Node.js
tail -f /home/votrecompte/logs/scraping-api-error.log
```

---

## 🔄 Mises à Jour Futures

### Mise à Jour du Frontend

```bash
cd frontend
git pull
npm install
npm run build
# Re-upload dist/ vers /public_html/scraping-tool/
```

### Mise à Jour du Backend

```bash
# Sur le serveur
cd /home/votrecompte/nodejs/scraping-api
git pull
source /home/votrecompte/nodevenv/scraping-api/22/bin/activate
npm install --production

# Redémarrer l'app via cPanel → Setup Node.js App → Restart
```

---

## 🆘 Dépannage

### Problème : Backend ne démarre pas

**Solution** :
1. Vérifier les logs : cPanel → Setup Node.js App → Open logs
2. Vérifier `.env` : Les credentials MySQL sont corrects ?
3. Test de connexion DB :
```bash
mysql -u votrecompte_outil_user -p votrecompte_outil_scraping -e "SELECT 1"
```

### Problème : Playwright ne trouve pas les navigateurs

**Solution** :
```bash
cd /home/votrecompte/nodejs/scraping-api
source /home/votrecompte/nodevenv/scraping-api/22/bin/activate
PLAYWRIGHT_BROWSERS_PATH=/home/votrecompte/nodejs/scraping-api/browsers npx playwright install chromium
```

### Problème : CORS errors

**Solution** :
1. Vérifier `FRONTEND_URL` dans `.env` :
```env
FRONTEND_URL=https://votre-domaine.com
```
2. Redémarrer le backend

### Problème : Frontend ne se connecte pas à l'API

**Solution** :
1. Vérifier `frontend/.env.production` :
```env
VITE_API_URL=https://scraping-api.votre-domaine.com
```
2. Rebuild le frontend
3. Re-upload

---

## 📞 Support O2Switch

**Si problème technique** :
- Email : support@o2switch.fr
- Ticket : Depuis cPanel → Support
- Téléphone : +33 4 44 44 60 40

---

## ✅ Checklist Finale

Avant de considérer le déploiement terminé :

- [ ] Base de données MySQL créée et schéma importé
- [ ] Backend uploadé et Node.js configuré
- [ ] Dépendances installées (`npm install`)
- [ ] Playwright et Chromium installés
- [ ] Backend démarré et accessible (`/health` retourne OK)
- [ ] Frontend buildé et uploadé
- [ ] SSL activé sur domaine et sous-domaine API
- [ ] Test de scraping réussi (5 prospects Pages Jaunes)
- [ ] Prospects visibles dans l'onglet "Prospects"
- [ ] Export CSV fonctionne
- [ ] Gestion des tags fonctionne

---

**Date de déploiement** : _____________
**Déployé par** : _____________
**Version** : MVP 1.0
**URL Production** : https://votre-domaine.com/scraping-tool/

🎉 **Félicitations ! Votre outil de scraping est maintenant en production sur O2Switch !**
