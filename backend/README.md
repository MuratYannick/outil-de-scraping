# Backend - API Node.js

À compléter selon les technologies définies par le chef de projet.

## Structure

## À définir

# Backend - API Node.js & Express

## Stack Technique

- **Node.js** 22.19.0
- **Express** 4.18.2
- **Sequelize** (ORM) pour MySQL
- **MySQL** base de données
- **Playwright** + **Puppeteer** + **Cheerio** pour le scraping

## Structure du projet

```
backend/
├── src/
│   ├── app.js              # Point d'entrée Express
│   ├── config/
│   │   └── database.js     # Configuration Sequelize
│   ├── models/             # Modèles Sequelize (Prospect, Tag, etc.)
│   ├── routes/             # Routes API (/api/prospects, /api/tags, etc.)
│   ├── controllers/        # Logique métier (CRUD, scraping)
│   ├── services/           # Services métier (scraper, email, etc.)
│   └── middlewares/        # Middlewares (auth, validation, etc.)
├── package.json
├── .env.example            # Variables d'environnement
└── .eslintrc.json
```

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` basé sur `.env.example`

## Développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001`
