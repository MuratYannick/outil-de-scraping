# 📊 Progression du Projet Outil de Scraping

**Dernière mise à jour** : 13 novembre 2025

## 🎯 Objectif Phase 1 (MVP)

- [x] Définir les objectifs du MVP
  - Collecter 50 prospects initialement
  - Établir un flux récurrent de 10 prospects/semaine
  - Stocker et visualiser les données collectées

**Durée prévue** : 4 semaines (20 jours de développement)

---

## 📅 Roadmap et Statut

### Semaine 1 : 🏗️ Infrastructure Backend & DB (✅ COMPLÉTÉE à 100%)

#### Jour 1 : Initialisation du projet & Architecture
- [x] Créer le repository GitHub
- [x] Initialiser la structure du projet (backend/frontend/docs)
- [x] Valider la stack technique (Node.js 22.19.0, Express, Sequelize, MySQL, Vite, React)
- [x] Configurer Git et .gitignore

#### Jour 2-3 : Configuration de la base de données
- [x] Installer et configurer MySQL localement
- [x] Créer le schéma de base de données (prospects, tags, prospects_tags)
- [x] Créer les modèles Sequelize (Prospect, Tag)
- [x] Implémenter les associations N:M entre Prospect et Tag
- [x] Créer le script SQL d'initialisation (`init-db.sql`)
- [x] Créer les scripts de gestion DB (`setup-db.js`, `migrate.js`)
- [x] Créer le script de suppression des tables (`drop-tables.js`)
- [x] Créer le script de seed avec données de test (`seed-db.js`)

#### Jour 4 : API de gestion des données (CRUD)
- [x] Configurer Express app minimale
- [x] Configurer la connexion MySQL avec Sequelize
- [x] Créer la route `/health` pour vérification serveur
- [x] Créer les controllers (prospectController.js, tagController.js)
- [x] Créer les routes `/api/prospects` (GET, POST, PUT, DELETE + tags)
- [x] Créer les routes `/api/tags` (GET, POST, PUT, DELETE)
- [x] Tester les endpoints API

#### Jour 5 : Initialisation du Frontend & connexion API
- [x] Initialiser Vite 7.x avec React 18
- [x] Configurer Tailwind CSS v3
- [x] Créer la structure de base (main.jsx, App.jsx)
- [x] Configurer PostCSS et autoprefixer
- [x] Mettre à niveau Vite 5.x → 7.x (résoudre advisory esbuild)
- [x] Créer le service API avec Axios (api.js)
- [x] Créer les composants de base React (Header, ProspectList)
- [x] Connecter le frontend à l'API backend
- [x] Tester la communication frontend/backend

---

### Semaine 2 : 🕷️ Moteur de Scraping MVP (📋 À FAIRE)

#### Jour 6 : Mise en place de Playwright
- [ ] Installer Playwright et ses dépendances
- [ ] Créer le service `playwrightService.js`
- [ ] Implémenter les utilitaires de base (pool de contexts, retry, logging)
- [ ] Configurer l'émulation de navigateur (User-Agent, viewport)
- [ ] Tester le lancement basique de Playwright

#### Jour 7-8 : Développement du scraper Pages Jaunes
- [ ] Analyser la structure HTML de Pages Jaunes
- [ ] Créer le scraper `pagesJaunesScraper.js`
- [ ] Implémenter l'extraction des données (nom, adresse, téléphone, site web)
- [ ] Ajouter la normalisation des données (format téléphone, emails)
- [ ] Implémenter la gestion des erreurs et retry
- [ ] Ajouter la logique anti-détection (delays, rotation proxies si disponible)
- [ ] Tester le scraper avec plusieurs requêtes

#### Jour 9 : Intégration du scraper à l'API
- [ ] Créer les routes `/api/scraping/lancer` et `/api/scraping/status/:task_id`
- [ ] Créer le controller de scraping
- [ ] Implémenter la gestion des tâches asynchrones
- [ ] Ajouter le feedback en temps réel (progression, nombre de prospects)
- [ ] Tester l'intégration API ↔ Scraper

#### Jour 10 : Sauvegarde des données & feedback
- [ ] Implémenter la sauvegarde automatique des prospects en DB
- [ ] Ajouter la détection et gestion des doublons
- [ ] Créer le système de feedback utilisateur (notifications, logs)
- [ ] Tester le flux complet : lancement → scraping → sauvegarde → feedback
- [ ] Valider l'objectif de 50 prospects initiaux

---

### Semaine 3 : 💻 Interface Utilisateur (📋 À FAIRE)

#### Jour 11-12 : Interface de lancement du scraping
- [ ] Créer le composant formulaire de scraping (keyword, location, source)
- [ ] Implémenter la validation des inputs côté client
- [ ] Créer le composant d'affichage de progression en temps réel
- [ ] Ajouter les notifications de succès/erreur
- [ ] Styliser avec Tailwind CSS
- [ ] Tester le lancement de scraping depuis l'interface

#### Jour 13 : Tableau de bord des prospects
- [ ] Créer le composant tableau de prospects
- [ ] Implémenter la pagination
- [ ] Ajouter les filtres (par tag, par source, par date)
- [ ] Créer les composants de visualisation (cartes, statistiques)
- [ ] Implémenter l'export des données (CSV, JSON)
- [ ] Tester l'affichage de données volumineuses

#### Jour 14 : Gestion des tags
- [ ] Créer le composant de gestion des tags
- [ ] Implémenter l'ajout/suppression de tags
- [ ] Créer l'interface d'association prospect ↔ tag
- [ ] Ajouter la recherche et filtrage par tags
- [ ] Tester les opérations CRUD sur les tags

#### Jour 15 : Gestion des erreurs & logique proxy
- [ ] Implémenter la gestion globale des erreurs frontend
- [ ] Créer les pages d'erreur (404, 500)
- [ ] Ajouter la validation Joi côté backend
- [ ] Implémenter la logique de rotation des proxies (si applicable)
- [ ] Tester les scénarios d'erreur et la récupération

---

### Semaine 4 : 🌐 Scraping Dynamique & Déploiement (📋 À FAIRE)

#### Jour 16-18 : Scraper Google Maps/LinkedIn
- [ ] Analyser la structure de Google Maps
- [ ] Créer le scraper `googleMapsScraper.js`
- [ ] Tester et valider le scraper Google Maps
- [ ] Analyser la structure de LinkedIn (si applicable)
- [ ] Créer le scraper `linkedInScraper.js`
- [ ] Implémenter les stratégies anti-détection spécifiques
- [ ] Ajouter la géolocalisation et extraction de coordonnées
- [ ] Tester les scrapers additionnels

#### Jour 19 : Nettoyage et finalisation du code
- [ ] Refactoring du code backend
- [ ] Refactoring du code frontend
- [ ] Ajouter les commentaires et documentation inline
- [ ] Optimiser les performances (requêtes DB, chargement frontend)
- [ ] Exécuter les linters (ESLint) et corriger les warnings
- [ ] Vérifier la sécurité (npm audit, validation inputs)
- [ ] Créer/mettre à jour les tests unitaires

#### Jour 20 : Déploiement MVP & démo
- [ ] Préparer l'environnement de production
- [ ] Déployer la base de données (MySQL en prod)
- [ ] Déployer le backend
- [ ] Déployer le frontend
- [ ] Configurer les variables d'environnement prod
- [ ] Tester l'application en production
- [ ] Préparer la démo et documentation utilisateur
- [ ] Livrer le MVP au chef de projet

---

## 🔐 Problèmes Résolus

### Security
- [x] **npm audit (Backend)** : Suppression de Puppeteer effectuée, seul Playwright est utilisé
- [x] **npm audit (Frontend)** : Mise à jour de Vite 5.x → 7.x, résolution advisory esbuild (GHSA-67mh-4wv8-2f99), audit finalisé à 0 vulnérabilités

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
│   │   ├── controllers/
│   │   │   ├── prospectController.js
│   │   │   └── tagController.js
│   │   ├── routes/
│   │   │   ├── prospectRoutes.js
│   │   │   └── tagRoutes.js
│   │   ├── middlewares/        # À implémenter
│   │   └── services/           # À implémenter (Playwright service)
│   └── scripts/
│       ├── init-db.sql
│       ├── setup-db.js
│       ├── migrate.js
│       ├── drop-tables.js
│       └── seed-db.js
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
│       ├── components/
│       │   ├── Header.jsx
│       │   └── ProspectList.jsx
│       ├── pages/              # À implémenter
│       ├── services/
│       │   └── api.js          # Service API Axios
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

### Semaine 2 — Moteur de Scraping (À commencer immédiatement)
- [ ] Implémenter `backend/src/services/playwrightService.js`
- [ ] Créer un scraper exemple (Pages Jaunes)
- [ ] Ajouter routes API pour lancer le scraping
- [ ] Tester le flux complet de scraping

### Semaine 3 — Frontend
- [ ] Développer composants React (Dashboard, Formulaire scraping, Liste prospects)
- [ ] Intégrer l'API backend avec Axios
- [ ] Afficher les prospects et permettre de lancer un scraping
- [ ] Implémenter la gestion des tags

### Sécurité & Qualité
- [ ] Ajouter validation Joi sur les routes
- [ ] Tests unitaires (à définir avec le chef de projet)
- [ ] Gestion des erreurs améliorée
- [ ] Configuration Helmet pour sécuriser les headers HTTP

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
