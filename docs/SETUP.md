# 🚀 Guide d'Installation et Configuration

## Prérequis

- **Node.js** >= 16.x ([Télécharger](https://nodejs.org/))
- **PostgreSQL** >= 12 ou **MySQL** >= 8.0
- **Git** >= 2.0
- **Docker** (optionnel, pour le déploiement)

---

## Installation Locale

### 1️⃣ Cloner le repository

```bash
git clone https://github.com/your-username/outil-de-scraping.git
cd outil-de-scraping
```

### 2️⃣ Configuration Base de Données

#### PostgreSQL

```bash
# Créer une nouvelle base de données
createdb outil_scraping

# Créer un utilisateur (optionnel)
createuser scraping_user
```

#### MySQL

```bash
# Créer une nouvelle base de données
mysql -u root -p
> CREATE DATABASE outil_scraping CHARACTER SET utf8mb4;
> EXIT;
```

---

### 3️⃣ Configuration Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier le fichier .env
cp .env.example .env
```

**Éditer `.env`:**

```env
# Node
NODE_ENV=development
PORT=3001

# Database
DB_DIALECT=postgres  # ou mysql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=outil_scraping
DB_USER=postgres
DB_PASSWORD=your_password

# JWT (optionnel, pour authentification future)
JWT_SECRET=your_secret_key

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

```bash
cd ../frontend

# Installer les dépendances
npm install

# Copier le fichier .env
cp .env.example .env
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

## 🐳 Installation avec Docker

### 1️⃣ Lancer tous les services

```bash
docker-compose up -d
```

Cela démarre :
- PostgreSQL sur le port 5432
- Backend Node.js sur le port 3001
- Frontend Vite sur le port 5173

### 2️⃣ Vérifier les logs

```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# Base de données
docker-compose logs -f postgres
```

### 3️⃣ Arrêter les services

```bash
docker-compose down
```

---

## 📊 Initialiser la Base de Données

### Avec Sequelize (Backend)

```bash
cd backend

# Créer les tables
npm run db:migrate

# Insérer des données de test (optionnel)
npm run db:seed
```

### Manuellement

```bash
# Se connecter à la base de données
psql -U postgres -d outil_scraping

# Exécuter les scripts SQL
\i scripts/init-db.sql
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

