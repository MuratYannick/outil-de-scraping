# 🕷️ Outil de Scraping pour l'Enrichissement de Bases Clients

Projet de développement d'un outil de scraping autonome permettant de collecter, stocker et visualiser des prospects à partir de différentes sources en ligne.

## 📋 Vue d'ensemble

**Objectif Phase 1 (MVP)** : Livrer une application fonctionnelle permettant de :

- Collecter 50 prospects initialement
- Établir un flux récurrent de 10 prospects/semaine
- Stocker et visualiser les données collectées

**Durée** : 4,5 semaines (22 jours de développement)
**Note** : Durée ajustée suite à l'ajout des optimisations Playwright (Phases 1-3)

---

## 🛠️ Stack Technique

### Frontend

- **Vite** ^7.2.2 - Build tool rapide
- **React** ^18.2.0 - Interface utilisateur
- **Tailwind CSS** ^3.3.6 - Styling
- **React Router DOM** ^6.20.0 - Navigation
- **Axios** ^1.6.2 - HTTP client

### Backend

- **Node.js** 22.19.0 - Runtime JavaScript
- **Express** ^4.18.2 - Framework web
- **Sequelize** ^6.35.2 - ORM pour base de données
- **Playwright** ^1.40.1 - Moteur de scraping
- **Cheerio** ^1.0.0-rc.12 - Parsing HTML
- **MySQL2** ^3.6.5 - Driver MySQL

### Données

- **MySQL** >= 8.0 - Base de données relationnelle (local)

### DevOps

- **Git** - Contrôle de version

---

## 📁 Structure du Projet

```
outil-de-scraping/
├── README.md                   # Vue d'ensemble du projet
├── PROGRESS.md                 # Progression du projet
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── app.js              # Express app
│   │   ├── config/
│   │   │   ├── database.js     # Config Sequelize
│   │   │   └── antiBotConfig.js  # Configuration stratégies anti-bot
│   │   ├── models/
│   │   │   ├── index.js
│   │   │   ├── Prospect.js
│   │   │   └── Tag.js
│   │   ├── controllers/
│   │   │   ├── prospectController.js
│   │   │   ├── tagController.js
│   │   │   ├── scrapingController.js
│   │   │   ├── antiBotConfigController.js
│   │   │   └── googleMapsConfigController.js
│   │   ├── routes/
│   │   │   ├── prospectRoutes.js
│   │   │   ├── tagRoutes.js
│   │   │   ├── scrapingRoutes.js
│   │   │   ├── antiBotConfigRoutes.js
│   │   │   └── googleMapsConfigRoutes.js
│   │   ├── middlewares/
│   │   │   ├── validate.js           # Middleware validation Joi
│   │   │   └── errorHandler.js       # Gestionnaire erreurs centralisé
│   │   ├── validators/
│   │   │   ├── prospectValidators.js
│   │   │   ├── tagValidators.js
│   │   │   └── scrapingValidators.js
│   │   └── services/
│   │       ├── playwrightService.js
│   │       ├── proxyManager.js            # Gestion rotation proxies
│   │       ├── captchaSolverService.js    # Résolution automatique CAPTCHA
│   │       ├── stealthService.js          # Masquage avancé (14 techniques)
│   │       ├── rateLimiter.js             # Rate limiting (5 patterns)
│   │       ├── sessionManager.js          # Gestion sessions avec cookies
│   │       ├── humanBehavior.js           # Comportement humain réaliste
│   │       ├── taskManager.js             # Gestion tâches asynchrones
│   │       ├── googleMapsService.js       # Service Google Maps dual-strategy
│   │       └── scrapers/
│   │           └── pagesJaunesScraper.js
│   └── scripts/
│       ├── init-db.sql
│       ├── setup-db.js
│       ├── migrate.js
│       ├── drop-tables.js
│       ├── seed-db.js
│       ├── test-playwright.js
│       ├── analyze-pages-jaunes.js
│       ├── debug-pages-jaunes.js
│       ├── test-pages-jaunes-scraper.js
│       ├── test-proxy-rotation.js         # Test rotation proxies (8 tests)
│       ├── test-pages-jaunes-with-proxy.js # Test comparatif avec/sans proxy
│       ├── test-captcha-solver.js         # Test détection et résolution CAPTCHA
│       ├── test-stealth-mode.js           # Test masquage Stealth
│       ├── test-task-manager.js           # Test gestionnaire de tâches
│       ├── test-scraping-api.js           # Test API scraping complète
│       ├── test-validation.js             # Test validation Joi (14 tests)
│       ├── test-phase1-optimization.js    # Tests Phase 1 (6 tests)
│       ├── test-phase2-optimization.js    # Tests Phase 2 (7 tests)
│       └── test-phase3-optimization.js    # Tests Phase 3 (6 tests)
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.cjs      # PostCSS config (CommonJS)
│   ├── .eslintrc.json
│   ├── index.html              # Entrée Vite
│   └── src/
│       ├── main.jsx            # Point d'entrée
│       ├── App.jsx             # Composant principal avec 5 onglets
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── ProspectList.jsx         # Tableau/grille prospects
│       │   ├── ProspectCard.jsx         # Carte individuelle prospect
│       │   ├── ProspectStats.jsx        # Dashboard statistiques
│       │   ├── ProspectFilters.jsx      # Filtres avancés
│       │   ├── Pagination.jsx           # Pagination intelligente
│       │   ├── ScrapingForm.jsx         # Formulaire lancement scraping
│       │   ├── ProgressTracker.jsx      # Suivi temps réel
│       │   ├── Notification.jsx         # Toast notifications
│       │   ├── ExportMenu.jsx           # Menu export (CSV, JSON, clipboard)
│       │   ├── TagManager.jsx           # Gestion complète CRUD des tags
│       │   ├── TagBadge.jsx             # Gestion tags d'un prospect
│       │   ├── AntiBotConfig.jsx        # Panneau config anti-bot
│       │   ├── GoogleMapsConfig.jsx     # Config Google Maps dual-strategy
│       │   ├── ErrorBoundary.jsx        # Gestion erreurs React
│       ├── pages/
│       │   ├── NotFound.jsx             # Page 404
│       │   └── ServerError.jsx          # Page 500
│       ├── services/
│       │   └── api.js          # Service API Axios
│       ├── utils/
│       │   └── export.js       # Utilitaires export
│       └── styles/
│           └── index.css       # Styles Tailwind
├── docs/
│   ├── API.md                     # Spécifications API
│   ├── DATABASE.md                # Schéma base de données
│   ├── SETUP.md                   # Guide d'installation
│   ├── PLAYWRIGHT_DECISION.md     # Rationale du choix Playwright
│   ├── TESTS.md                   # Documentation de tous les tests
│   ├── TESTING_GUIDE.md           # Guide de lancement des tests
│   ├── ANTIBOT_CONFIG.md          # Guide configuration stratégies anti-bot
│   ├── PROXY_TEST_RESULTS.md      # Résultats tests proxies
│   ├── CAPTCHA_SOLVER.md          # Guide CAPTCHA solver
│   ├── DECISION_ANTI_BOT.md          # Guide de décision
│   ├── SCRAPING_API.md               # Documentation API de scraping
│   ├── STEALTH_ENHANCED.md           # Guide complet anti-détection
│   ├── TESTS_STEALTH_ENHANCED.md     # Résultats détaillés tests Phases 1-3
│   ├── GOOGLE_MAPS_EXTRACTION.md     # Méthode de scoring extraction Google Maps
│   ├── SUCCESS_RATE_ANALYSIS.md      # 📊 Analyse taux de réussite (Jour 28)
│   └── TESTS_ANTIBOT_EXPECTED_RESULTS.md  # Résultats attendus tests anti-bot
└── .gitignore
```

---

## 🎯 Fonctionnalités MVP

|  ID  | Fonctionnalité               |   Statut   |
| :--: | ---------------------------- | :--------: |
| F-01 | Gestion des Prospects (CRUD) | 📋 À faire |
| F-02 | Lancement du Scraping        | 📋 À faire |
| F-03 | Extraction de Données Cibles | 📋 À faire |
| F-04 | Gestion des Tags             | 📋 À faire |
| F-05 | Tableau de Bord              | 📋 À faire |

---

## 📅 Roadmap Phase 1 (4 Semaines)

Voir [PROGRESS.md](./PROGRESS.md) pour l'état détaillé de chaque tâche.

### Semaine 1 : 🏗️ Infrastructure Backend & DB
- ✅ **EFFECTUÉE** : Repository, architecture, modèles DB, Express app

### Semaine 2 : 🕷️ Moteur de Scraping MVP
- ✅ **EFFECTUÉE** : Service Playwright, scrapers Pages Jaunes, intégration API, TaskManager

### Semaine 3 : 💻 Interface Utilisateur
- ✅ **EFFECTUÉE** : Composants React, dashboard, gestion tags, formulaire scraping, filtres

### Semaine 4-5 : 🌐 Scraping Dynamique & Déploiement (Jours 16-22)
- ✅ **COMPLÉTÉES** : Google Maps dual-strategy (J16), Optimisations Playwright Phases 1-3 (J17-18)
- 📋 **À FAIRE** : LinkedIn scraper (J19-20), nettoyage (J21), déploiement (J22)

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 22.19.0
- MySQL >= 8.0
- Git

### Installation Locale

#### 1. Cloner le repository

```bash
git clone https://github.com/MuratYannick/outil-de-scraping.git
cd outil-de-scraping
```

#### 2. Configuration Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos paramètres MySQL
npm run db:setup    # Initialiser la base de données
npm run dev         # Démarrer le serveur
```

Le serveur écoutera sur `http://localhost:3001`

#### 3. Configuration Frontend

```bash
cd ../frontend
npm install
npm run dev         # Démarrer le serveur de développement
```

L'application sera disponible sur `http://localhost:5173`

---

## 📚 Documentation

- [**PROGRESS.md**](./PROGRESS.md) - État d'avancement du projet
- [**API Reference**](./docs/API.md) - Endpoints et spécifications
- [**Database Schema**](./docs/DATABASE.md) - Modèle de données
- [**Setup Guide**](./docs/SETUP.md) - Instructions d'installation détaillées
- [**Playwright Decision**](./docs/PLAYWRIGHT_DECISION.md) - Justification du choix de Playwright

---

## 🔐 Sécurité

- ✅ Audit npm : 0 vulnérabilités (backend & frontend)
- ✅ Pas de Docker pour le MVP (déploiement local)
- ✅ Validation des inputs avec Joi
- ✅ Helmet pour sécuriser les en-têtes HTTP

---

## 🤝 Contribution

Ce projet est géré par Yannick Murat.

---

## 📞 Contact

**Créateur** : Yannick Murat  
**Email** : muratyannick.dev@gmail.com

---

## 📝 License

Propriétaire - Tous droits réservés

---

**Dernière mise à jour** : 14 Novembre 2025
