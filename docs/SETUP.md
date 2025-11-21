# 🚀 Guide d'Installation et Configuration

## Prérequis (livrable local)

> Remarque : la version initiale du MVP est prévue pour un fonctionnement local. Les instructions de conteneurisation / déploiement seront ajoutées ultérieurement selon les choix du chef de projet.

---

## Installation Locale

### 1️⃣ Cloner le repository

```bash
git clone https://github.com/your-username/outil-de-scraping.git
cd outil-de-scraping
```

### 2️⃣ Configuration Base de Données (MySQL)

Pour un usage local nous utilisons MySQL. Exemple de création de base (ligne de commande) :

```bash
# Connectez-vous et créez la base
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS outil_scraping CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Si vous préférez une interface graphique, créez la base `outil_scraping` via votre client MySQL habituel.

---

### 3️⃣ Configuration Backend

```powershell
cd backend

# Installer les dépendances
npm install

# Copier le fichier .env (PowerShell)
Copy-Item .env.example .env

# (ou sous Linux/macOS)
# cp .env.example .env
```

**Éditer `.env`:**

```env
# Node
NODE_ENV=development
PORT=3001

# Database (MySQL)
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=outil_scraping
DB_USER=root
DB_PASSWORD=your_password

# Scraping
PLAYWRIGHT_HEADLESS=true
REQUEST_TIMEOUT=30000
```

**Lancer les migrations (si disponibles):**

```bash
npm run migrate
```

**Démarrer le serveur**

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm run start
```

Le serveur écoutera sur `http://localhost:3001`

---

### 4️⃣ Configuration Frontend

```powershell
cd ../frontend

# Installer les dépendances
npm install

# Copier le fichier .env.local (PowerShell)
Copy-Item .env.example .env.local

# (ou sous Linux/macOS)
# cp .env.example .env.local
```

**Éditer `.env.local`:**

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Outil de Scraping
```

**Démarrer le serveur de développement**

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

---

---

## 📊 Initialiser la Base de Données

### Commandes Disponibles

```bash
cd backend

# 1. Créer la base de données (si elle n'existe pas)
npm run db:setup

# 2. Créer ou mettre à jour les tables
npm run db:migrate

# 3. Remplir avec des données de test (13 prospects + tags)
npm run db:seed

# 4. Vider toutes les tables (avec confirmation)
npm run db:clear

# 5. Détruire toutes les tables (avec double confirmation)
npm run db:drop
```

### Workflows Courants

**Installation initiale :**
```bash
npm run db:setup      # Créer la DB
npm run db:migrate    # Créer les tables
npm run db:seed       # Ajouter données de test
```

**Réinitialisation complète :**
```bash
npm run db:drop       # Détruire les tables (⚠️ confirmation requise)
npm run db:migrate    # Recréer les tables
npm run db:seed       # Ajouter données de test
```

**Nettoyage simple :**
```bash
npm run db:clear      # Vider les données (⚠️ confirmation requise)
npm run db:seed       # Ajouter de nouvelles données
```

### Description des Commandes

#### `npm run db:setup`
Crée la base de données si elle n'existe pas. À exécuter une seule fois.

#### `npm run db:migrate`
Crée ou met à jour les tables selon les modèles Sequelize.
Utilise `sequelize.sync({ alter: true })` pour appliquer les modifications de structure.

#### `npm run db:seed`
Remplit la base avec 13 prospects de test et leurs tags :
- Tags par domaine d'activité (Plomberie, Boulangerie, Restaurant, etc.)
- Localités variées avec doublons pour tester les filtres
- Certains champs vides (email, téléphone, adresse, coordonnées GPS)
- Associations réalistes prospects ↔ tags

#### `npm run db:clear` ⚠️
Vide toutes les tables (DELETE FROM) avec confirmation interactive.
- Demande confirmation `oui/non`
- Affiche le nombre d'enregistrements avant suppression
- Préserve la structure des tables

**Exemple d'utilisation :**
```bash
npm run db:clear
# > Êtes-vous sûr de vouloir VIDER toutes les tables ? (oui/non): oui
```

#### `npm run db:drop` 💥
Détruit complètement toutes les tables (DROP TABLE) avec double confirmation.
- Première confirmation : `oui/non`
- Deuxième confirmation : Taper `DÉTRUIRE` en majuscules
- Supprime les tables `prospects`, `tags`, et `prospects_tags`

**Exemple d'utilisation :**
```bash
npm run db:drop
# > Êtes-vous sûr de vouloir DÉTRUIRE toutes les tables ? (oui/non): oui
# > Tapez 'DÉTRUIRE' en majuscules pour confirmer: DÉTRUIRE
```

### Manuellement (MySQL)

```bash
# Se connecter à MySQL et exécuter un script SQL
mysql -u root -p outil_scraping < scripts/init-db.sql
```

---

## ✅ Vérifier l'Installation

### Backend

```bash
curl http://localhost:3001/api/prospects
# Doit retourner : {"data": [], "total": 0}
```

### Frontend

Ouvrir `http://localhost:5173` dans le navigateur et vérifier :

- ✅ Page d'accueil chargée
- ✅ Connexion API fonctionnelle
- ✅ Tableau de bord visible

---

## 🔧 Troubleshooting

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # Mac/Linux

# Tuer le processus (Windows)
taskkill /PID <PID> /F
```

### Erreur de connexion à la base de données

- Vérifier que PostgreSQL/MySQL est en cours d'exécution
- Vérifier les identifiants dans `.env`
- Vérifier que la base de données existe

### Module non trouvé

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Commandes Utiles

### Backend

```bash
npm run dev          # Développement
npm start            # Production
npm test             # Tests
npm run lint         # Linter

# Base de données
npm run db:setup     # Créer la DB
npm run db:migrate   # Créer/mettre à jour les tables
npm run db:seed      # Remplir avec données de test
npm run db:clear     # Vider les tables (⚠️ confirmation)
npm run db:drop      # Détruire les tables (⚠️⚠️ double confirmation)
```

### Frontend

```bash
npm run dev          # Développement
npm run build        # Build production
npm run preview      # Aperçu build
npm run lint         # Linter
```

---

## 🚀 Déploiement Production

**À définir avec Charles** - Options possibles :

- AWS (EC2, RDS)
- Google Cloud
- Serveur dédié OVH
- Heroku

---

**Questions ?** Contacter Yannick Murat : muratyannick.dev@gmail.com
