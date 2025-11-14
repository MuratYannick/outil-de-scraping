# 🕷️ Outil de Scraping pour l'Enrichissement de Bases Clients

Projet de développement d'un outil de scraping autonome permettant de collecter, stocker et visualiser des prospects à partir de différentes sources en ligne.

## 📋 Vue d'ensemble

**Objectif Phase 1 (MVP)** : Livrer une application fonctionnelle permettant de :

- Collecter 50 prospects initialement
- Établir un flux récurrent de 10 prospects/semaine
- Stocker et visualiser les données collectées

**Durée** : 4 semaines (20 jours de développement)

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
├── README.md                   # Vue d'ensemble
├── PROGRESS.md                 # Progression du projet
├── backend/                    # API Node.js/Express
│   ├── src/
│   │   ├── config/            # Configuration (DB, env)
│   │   ├── controllers/       # Logique métier
│   │   ├── models/            # Modèles Sequelize
│   │   ├── routes/            # Routes API
│   │   ├── middlewares/       # Middlewares Express
│   │   ├── services/          # Services (scraping, etc)
│   │   └── app.js             # Point d'entrée
│   ├── package.json
│   └── .env.example
├── frontend/                   # App React/Vite
│   ├── src/
│   │   ├── components/        # Composants React
│   │   ├── pages/             # Pages/views
│   │   ├── services/          # Services API
│   │   ├── styles/            # Styles globaux
│   │   ├── main.jsx           # Point d'entrée
│   │   └── App.jsx            # Composant principal
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── docs/                       # Documentation
│   ├── API.md                 # Spécifications API
│   ├── DATABASE.md            # Schéma base de données
│   ├── SETUP.md               # Guide d'installation
│   └── PLAYWRIGHT_DECISION.md # Choix du moteur de scraping
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
- 📋 À faire : Service Playwright, scrapers, intégration API

### Semaine 3 : 💻 Interface Utilisateur
- 📋 À faire : Composants React, dashboard, gestion tags

### Semaine 4 : 🌐 Scraping Dynamique & Déploiement
- 📋 À faire : Scrapers additionnels, nettoyage, déploiement

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
