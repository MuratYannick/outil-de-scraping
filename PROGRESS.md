# 📊 Progression du Projet Outil de Scraping

**Dernière mise à jour** : 13 novembre 2025

## 🎯 Objectif Phase 1 (MVP)

- Collecter 50 prospects initialement
- Établir un flux récurrent de 10 prospects/semaine
- Stocker et visualiser les données collectées

**Durée prévue** : 4 semaines (20 jours de développement)

---

## 📅 Roadmap et Statut

### Semaine 1 : 🏗️ Infrastructure Backend & DB

| Jour | Tâche | Statut |
|------|-------|--------|
| J1 | Initialisation du projet & Architecture | ✅ **EFFECTUÉE** |
| J2-J3 | Configuration de la base de données | ✅ **EFFECTUÉE** |
| J4 | API de gestion des données (CRUD) | ✅ **EFFECTUÉE** |
| J5 | Initialisation du Frontend & connexion API | 🏗️ **EN COURS** |

**Détail** :
- ✅ Repository GitHub créé et initialisé
- ✅ Stack technique validée (Node.js 22.19.0, Express, Sequelize, MySQL, Vite, React)
- ✅ Modèles Sequelize implémentés (Prospect, Tag) avec associations
- ✅ SQL init script créé (`init-db.sql`)
- ✅ Scripts DB (`setup-db.js`, `migrate.js`) fonctionnels
- ✅ Express app minimale avec routes `/health`, `/api/prospects`, `/api/tags`
- ✅ Configuration MySQL et Sequelize complétée
- 🏗️ Frontend skeleton avec Vite 7.x, React 18, Tailwind CSS v3

---

### Semaine 2 : 🕷️ Moteur de Scraping MVP

| Jour | Tâche | Statut |
|------|-------|--------|
| J6 | Mise en place de Playwright | 📋 **À FAIRE** |
| J7-J8 | Développement du scraper Pages Jaunes | 📋 **À FAIRE** |
| J9 | Intégration du scraper à l'API | 📋 **À FAIRE** |
| J10 | Sauvegarde des données & feedback | 📋 **À FAIRE** |

**Détail** :
- 📋 Service Playwright à implémenter
- 📋 Scraper Pages Jaunes en développement
- 📋 Routes API scraping à ajouter

---

### Semaine 3 : 💻 Interface Utilisateur

| Jour | Tâche | Statut |
|------|-------|--------|
| J11-J12 | Interface de lancement du scraping | 📋 **À FAIRE** |
| J13 | Tableau de bord des prospects | 📋 **À FAIRE** |
| J14 | Gestion des tags | 📋 **À FAIRE** |
| J15 | Gestion des erreurs & logique proxy | 📋 **À FAIRE** |

**Détail** :
- 📋 Composants React à développer
- 📋 Intégration frontend/backend

---

### Semaine 4 : 🌐 Scraping Dynamique & Déploiement

| Jour | Tâche | Statut |
|------|-------|--------|
| J16-J18 | Scraper Google Maps/LinkedIn | 📋 **À FAIRE** |
| J19 | Nettoyage et finalisation du code | 📋 **À FAIRE** |
| J20 | Déploiement MVP & démo | 📋 **À FAIRE** |

**Détail** :
- 📋 Scrapers additionnels
- 📋 Nettoyage et optimisations

---

## 🔐 Problèmes Résolus

### Security

- ✅ **npm audit (Backend)** : Suppression de Puppeteer, audit finalisé à 0 vulnérabilités
- ✅ **npm audit (Frontend)** : Mise à jour de Vite 5.x → 7.x, résolution advisory esbuild (GHSA-67mh-4wv8-2f99), audit finalisé à 0 vulnérabilités

---

## 📦 Versions Actuelles

### Backend

- **Node.js** : 22.19.0
- **npm** : >= 10.0.0
- **Express** : ^4.18.2
- **Sequelize** : ^6.35.2
- **MySQL2** : ^3.6.5
- **Playwright** : ^1.40.1
- **Cheerio** : ^1.0.0-rc.12
- **Dotenv** : ^16.3.1
- **Helmet** : ^7.1.0
- **Axios** : ^1.6.2
- **Joi** : ^17.11.0
- **UUID** : ^9.0.1
- **ESLint** : ^8.55.0

### Frontend

- **Node.js** : 22.19.0
- **npm** : >= 10.0.0
- **React** : ^18.2.0
- **React DOM** : ^18.2.0
- **React Router DOM** : ^6.20.0
- **Vite** : ^7.2.2 (upgraded from ^5.0.8)
- **@vitejs/plugin-react** : ^5.1.1 (upgraded from ^4.2.1)
- **Tailwind CSS** : ^3.3.6
- **PostCSS** : ^8.4.32
- **Autoprefixer** : ^10.4.16
- **Axios** : ^1.6.2
- **ESLint** : ^8.55.0
- **ESLint Plugin React** : ^7.33.2

### Base de Données

- **MySQL** : >= 8.0 (local)

---

## 🗂️ Structure Actuelle

```
outil-de-scraping/
├── README.md                   # Vue d'ensemble du projet
├── PROGRESS.md                 # Ce fichier (progression du projet)
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── app.js              # Express app
│   │   ├── config/
│   │   │   └── database.js     # Config Sequelize
│   │   ├── models/
│   │   │   ├── index.js
│   │   │   ├── Prospect.js
│   │   │   └── Tag.js
│   │   ├── controllers/        # À implémenter
│   │   ├── routes/             # À implémenter
│   │   ├── middlewares/        # À implémenter
│   │   └── services/           # À implémenter (Playwright service)
│   └── scripts/
│       ├── init-db.sql
│       ├── setup-db.js
│       └── migrate.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.cjs      # PostCSS config (CommonJS)
│   ├── .eslintrc.json
│   ├── index.html              # Entrée Vite
│   └── src/
│       ├── main.jsx            # Point d'entrée
│       ├── App.jsx             # Composant principal
│       ├── components/         # À implémenter
│       ├── pages/              # À implémenter
│       ├── services/           # À implémenter
│       └── styles/
│           └── index.css       # Styles Tailwind
├── docs/
│   ├── API.md                  # Spécifications API
│   ├── DATABASE.md             # Schéma base de données
│   ├── SETUP.md                # Guide d'installation
│   └── PLAYWRIGHT_DECISION.md  # Rationale du choix Playwright
└── .gitignore
```

---

## 🚀 Prochaines Étapes (Priorité)

1. **Semaine 2 — Moteur de Scraping** (à commencer immédiatement)
   - Implémenter `backend/src/services/playwrightService.js`
   - Créer un scraper exemple (Pages Jaunes)
   - Ajouter routes API pour lancer le scraping

2. **Semaine 3 — Frontend**
   - Développer composants React
   - Intégrer l'API backend
   - Afficher les prospects et permettre de lancer un scraping

3. **Sécurité & Qualité**
   - Ajouter validation Joi sur les routes
   - Tests unitaires (à définir avec le chef de projet)
   - Gestion des erreurs améliorée

---

## 📞 Contact & Ressources

- **Créateur** : Yannick Murat
- **Email** : muratyannick.dev@gmail.com
- **GitHub** : https://github.com/MuratYannick/outil-de-scraping

---

## 📝 Notes de Développement

### Décisions Techniques

- **Playwright** choisi comme moteur de scraping (pas Puppeteer)
- **Vite 7.x** pour build frontend rapide et moderne
- **Sequelize** pour ORM MySQL (sync mode en dev, migrations en prod)
- **Tailwind CSS v3** pour styling utilitaire
- **Pas de Docker** pour le MVP (déploiement local/simple)

### Configuration

- Frontend build: `npm run build` génère `dist/`
- Backend dev: `npm run dev` avec nodemon (`node --watch`)
- DB: script `npm run db:migrate` pour Sequelize sync

---

**Dernière mise à jour** : 13 novembre 2025
