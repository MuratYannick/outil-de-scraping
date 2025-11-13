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

- **Vite** - Build tool rapide
- **React** - Interface utilisateur
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Sequelize** - ORM pour base de données
- **Playwright/Puppeteer** - Moteur de scraping
- **Cheerio** - Parsing HTML

### Données

- **PostgreSQL** ou **MySQL** - Base de données relationnelle

### DevOps

- **Docker** - Conteneurisation
- **Git** - Contrôle de version

---

## 📁 Structure du Projet

```
outil-de-scraping/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── config/         # Configuration (DB, env)
│   │   ├── controllers/    # Logique métier
│   │   ├── models/         # Modèles Sequelize
│   │   ├── routes/         # Routes API
│   │   ├── middlewares/    # Middlewares Express
│   │   ├── services/       # Services (scraping, etc)
│   │   └── app.js          # Point d'entrée
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                # App React/Vite
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages/views
│   │   ├── services/       # Services API
│   │   ├── styles/         # Styles globaux
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── docs/                    # Documentation
│   ├── API.md              # Spécifications API
│   ├── DATABASE.md         # Schéma base de données
│   └── SETUP.md            # Guide d'installation
│
├── docker-compose.yml      # Orchestration des conteneurs
├── .gitignore
└── README.md               # Ce fichier
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

### Semaine 1 : 🏗️ Infrastructure Backend & DB

- **J1** : Initialisation du projet & Architecture
- **J2-J3** : Configuration de la base de données
- **J4** : API de gestion des données (CRUD)
- **J5** : Initialisation du Frontend & connexion API

### Semaine 2 : 🕷️ Moteur de Scraping MVP

- **J6** : Mise en place de Playwright/Puppeteer
- **J7-J8** : Développement du scraper Pages Jaunes
- **J9** : Intégration du scraper à l'API
- **J10** : Sauvegarde des données & feedback

### Semaine 3 : 💻 Interface Utilisateur

- **J11-J12** : Interface de lancement du scraping
- **J13** : Tableau de bord des prospects
- **J14** : Gestion des tags
- **J15** : Gestion des erreurs & logique proxy

### Semaine 4 : 🌐 Scraping Dynamique & Déploiement

- **J16-J18** : Scraper Google Maps/LinkedIn
- **J19** : Nettoyage et finalisation du code
- **J20** : Déploiement MVP & démo

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js >= 16.x
- PostgreSQL ou MySQL
- Git
- Docker (optionnel)

### Installation Locale

#### 1. Cloner le repository

```bash
git clone <repository-url>
cd outil-de-scraping
```

#### 2. Configuration Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos paramètres
npm run dev
```

#### 3. Configuration Frontend

```bash
cd ../frontend
npm install
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

### Avec Docker

```bash
docker-compose up -d
```

---

## 📚 Documentation

- [**API Reference**](./docs/API.md) - Endpoints et spécifications
- [**Database Schema**](./docs/DATABASE.md) - Modèle de données
- [**Setup Guide**](./docs/SETUP.md) - Instructions d'installation détaillées

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

**Dernière mise à jour** : 13 Novembre 2025
