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

## 📊 Gestion de la Base de Données

### Commandes disponibles (Backend)

```bash
cd backend

# Initialiser la base de données (créer DB + tables)
npm run db:setup

# Synchroniser les modèles Sequelize avec la DB
npm run db:migrate

# Supprimer toutes les tables (⚠️ ATTENTION : destructif)
npm run db:drop

# Réinitialiser complètement la DB (drop + setup)
npm run db:reset
```

### Description des commandes

- **`npm run db:setup`** : Crée la base de données si elle n'existe pas, puis exécute le script SQL d'initialisation et synchronise les modèles Sequelize
- **`npm run db:migrate`** : Synchronise uniquement les modèles Sequelize avec la base de données existante
- **`npm run db:drop`** : Supprime TOUTES les tables de la base de données (demande confirmation)
- **`npm run db:reset`** : Supprime toutes les tables puis les recrée (utile pour le développement)

### ⚠️ Réinitialisation pour les tests de développement

Pendant le développement, si vous modifiez les modèles et voulez repartir de zéro :

```bash
cd backend

# Option 1 : Réinitialisation complète (recommandé)
npm run db:reset

# Option 2 : Supprimer puis recréer manuellement
npm run db:drop
npm run db:setup
```

**Note** : La commande `npm run db:drop` demande une confirmation avant de supprimer les tables pour éviter les suppressions accidentelles.

### Manuellement (MySQL)

```bash
# Se connecter à MySQL et exécuter un script SQL
mysql -u root -p outil_scraping_db < scripts/init-db.sql
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
npm run db:migrate   # Migrations DB
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
