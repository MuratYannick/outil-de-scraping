# Backend - API Node.js & Express

API REST pour le scraping, la gestion et l'enrichissement de prospects B2B.

## Stack Technique

- **Node.js** 22.19.0
- **Express** 4.18.2 - Framework web
- **Sequelize** 6.35.2 - ORM pour MySQL
- **MySQL2** 3.6.5 - Driver MySQL
- **Playwright** 1.40.1 - Moteur de scraping
- **Cheerio** 1.0.0-rc.12 - Parsing HTML
- **Joi** 17.11.0 - Validation des données
- **Helmet** 7.1.0 - Sécurité HTTP
- **CORS** 2.8.5 - Gestion des CORS

## Structure du projet

```
backend/
├── src/
│   ├── app.js                          # Point d'entrée Express
│   ├── config/
│   │   ├── database.js                 # Configuration Sequelize
│   │   └── antiBotConfig.js            # Configuration anti-bot
│   ├── models/
│   │   ├── index.js                    # Export centralisé modèles
│   │   ├── Prospect.js                 # Modèle Prospect
│   │   └── Tag.js                      # Modèle Tag
│   ├── controllers/
│   │   ├── prospectController.js       # CRUD prospects + filtres + tri
│   │   ├── tagController.js            # CRUD tags
│   │   ├── scrapingController.js       # Lancement scraping
│   │   ├── antiBotConfigController.js  # Config stratégies anti-bot
│   │   └── googleMapsConfigController.js # Config Google Maps
│   ├── routes/
│   │   ├── prospectRoutes.js           # Routes /api/prospects
│   │   ├── tagRoutes.js                # Routes /api/tags
│   │   ├── scrapingRoutes.js           # Routes /api/scraping
│   │   ├── antiBotConfigRoutes.js      # Routes /api/antibot-config
│   │   └── googleMapsConfigRoutes.js   # Routes /api/google-maps-config
│   ├── validators/
│   │   ├── prospectValidators.js       # Validation Joi prospects
│   │   ├── tagValidators.js            # Validation Joi tags
│   │   └── scrapingValidators.js       # Validation Joi scraping
│   ├── middlewares/
│   │   ├── validate.js                 # Middleware validation Joi
│   │   └── errorHandler.js             # Gestionnaire d'erreurs centralisé
│   └── services/
│       ├── playwrightService.js        # Service Playwright
│       ├── proxyManager.js             # Rotation de proxies
│       ├── captchaSolverService.js     # Résolution CAPTCHA
│       ├── stealthService.js           # Masquage anti-détection (14 techniques)
│       ├── rateLimiter.js              # Rate limiting (5 patterns)
│       ├── sessionManager.js           # Gestion sessions avec cookies
│       ├── humanBehavior.js            # Comportement humain réaliste
│       ├── taskManager.js              # Gestion tâches asynchrones
│       ├── googleMapsService.js        # Service Google Maps dual-strategy
│       └── scrapers/
│           └── pagesJaunesScraper.js   # Scraper Pages Jaunes
├── scripts/
│   ├── init-db.sql                     # Script SQL initialisation
│   ├── setup-db.js                     # Setup base de données
│   ├── migrate.js                      # Migrations manuelles
│   ├── drop-tables.js                  # Drop toutes les tables
│   ├── seed-db.js                      # Données de test
│   └── test-*.js                       # Scripts de test
├── package.json
├── .env.example
└── .eslintrc.json
```

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` basé sur `.env.example` :

```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=scraping_db
DB_USER=root
DB_PASSWORD=votre_mot_de_passe

# Serveur
PORT=3001
NODE_ENV=development

# API Keys (optionnel)
GOOGLE_MAPS_API_KEY=
CAPTCHA_SOLVER_API_KEY=

# Anti-bot (optionnel)
PROXY_LIST=
USER_AGENTS_LIST=
```

## Développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

## Scripts Disponibles

```bash
# Développement
npm run dev              # Démarre avec nodemon

# Base de données
npm run db:setup         # Initialise la base de données
npm run db:drop          # Supprime toutes les tables
npm run db:seed          # Insère des données de test
npm run db:migrate       # Exécute les migrations manuelles

# Tests
npm test                 # Lance tous les tests
node scripts/test-*.js   # Lance un test spécifique
```

## API Endpoints

### Prospects

#### GET /api/prospects
Récupérer tous les prospects avec pagination, filtres et tri.

**Query Parameters** :
- `limit` (integer, 1-10000, default: 20) - Nombre de résultats par page
- `offset` (integer, min: 0, default: 0) - Offset de pagination
- `source` (string) - Filtrer par source (ex: "Pages Jaunes", "Google Maps")
- `tag` (string) - Filtrer par nom de tag
- `search` (string) - Recherche textuelle sur tous les champs
- `sortBy` (string) - Colonne de tri: "nom_entreprise", "ville", "code_postal"
- `sortOrder` (string) - Ordre: "ASC" ou "DESC"

**Exemple** :
```
GET /api/prospects?limit=50&offset=0&source=Google%20Maps&sortBy=nom_entreprise&sortOrder=ASC
```

**Réponse** :
```json
{
  "data": [...],
  "total": 250,
  "limit": 50,
  "offset": 0
}
```

**Implémentation technique** :
- Utilise des sous-requêtes SQL pour optimiser le tri avec GROUP BY
- Préserve l'ordre de tri même avec jointures multiples
- Compte distinct pour éviter les doublons avec tags

#### GET /api/prospects/:id
Récupérer un prospect par ID avec ses tags.

#### POST /api/prospects
Créer un nouveau prospect.

**Body** :
```json
{
  "nom_entreprise": "string (required)",
  "nom_contact": "string (optional)",
  "email": "string (optional, valid email)",
  "telephone": "string (optional, format validé)",
  "adresse": "string (optional)",
  "ville": "string (optional)",
  "code_postal": "string (optional)",
  "url_site": "string (optional, valid URL)",
  "latitude": "decimal (optional)",
  "longitude": "decimal (optional)",
  "source_scraping": "string (required)",
  "tags": [1, 2, 3] (optional, array of tag IDs)
}
```

#### PUT /api/prospects/:id
Mettre à jour un prospect.

#### DELETE /api/prospects/:id
Supprimer un prospect.

#### POST /api/prospects/:id/tags
Associer un tag à un prospect.

**Body** :
```json
{
  "tag_id": 1
}
```

#### DELETE /api/prospects/:id/tags/:tagId
Retirer un tag d'un prospect.

### Tags

#### GET /api/tags
Récupérer tous les tags avec compteur de prospects associés.

**Réponse** :
```json
[
  {
    "id": 1,
    "nom": "Prioritaire",
    "couleur": "#FF5733",
    "prospectCount": 25
  }
]
```

#### POST /api/tags
Créer un nouveau tag.

**Body** :
```json
{
  "nom": "string (required, 1-50 chars)",
  "couleur": "string (optional, hex color)"
}
```

#### PUT /api/tags/:id
Mettre à jour un tag.

#### DELETE /api/tags/:id
Supprimer un tag et ses associations.

### Scraping

#### POST /api/scraping/start
Lancer une tâche de scraping.

**Body** :
```json
{
  "source": "Pages Jaunes" | "Google Maps",
  "query": "string (required, 1-200 chars)",
  "location": "string (required, 1-100 chars)",
  "maxResults": 50 (optional, 1-1000, default: 50),
  "maxPages": 5 (optional, 1-100, default: 5),
  "startPage": 1 (optional, 1-10000, default: 1),
  "excludeDuplicates": true (optional, default: true)
}
```

**Réponse** :
```json
{
  "taskId": "uuid",
  "status": "started",
  "message": "Scraping started"
}
```

#### GET /api/scraping/status/:taskId
Obtenir le statut d'une tâche de scraping.

**Réponse** :
```json
{
  "taskId": "uuid",
  "status": "in_progress" | "completed" | "failed",
  "progress": 45,
  "prospectsFound": 23,
  "startTime": "2025-11-14T10:30:00.000Z",
  "error": null
}
```

## Validation des Données

Toutes les routes utilisent la validation Joi via le middleware `validate`.

### Règles de Validation Principales

**Prospects** :
- `nom_entreprise` : requis, 1-255 caractères
- `email` : format email valide
- `telephone` : format valide (chiffres, espaces, +, -, (, ), .)
- `url_site` : format URL valide
- `source_scraping` : requis, 1-100 caractères
- `limite` : 1-10000
- `sortBy` : enum ('nom_entreprise', 'ville', 'code_postal')
- `sortOrder` : enum ('ASC', 'DESC')

**Tags** :
- `nom` : requis, 1-50 caractères, unique
- `couleur` : format hex color (ex: #FF5733)

**Scraping** :
- `source` : enum ('Pages Jaunes', 'Google Maps')
- `query` : requis, 1-200 caractères
- `location` : requis, 1-100 caractères
- `maxResults` : 1-1000
- `maxPages` : 1-100
- `startPage` : 1-10000

Messages d'erreur en français pour meilleure UX.

## Base de Données

### Modèle Prospect

```sql
CREATE TABLE prospects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom_entreprise VARCHAR(255) NOT NULL,
  nom_contact VARCHAR(255),
  email VARCHAR(255),
  telephone VARCHAR(50),
  adresse TEXT,
  ville VARCHAR(100),
  code_postal VARCHAR(20),
  url_site VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  note TEXT,
  source_scraping VARCHAR(100) NOT NULL,
  date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_prospect (nom_entreprise, adresse)
);
```

### Modèle Tag

```sql
CREATE TABLE tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(50) UNIQUE NOT NULL,
  couleur VARCHAR(7) DEFAULT '#3B82F6',
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table de Liaison

```sql
CREATE TABLE prospects_tags (
  prospect_id INT,
  tag_id INT,
  PRIMARY KEY (prospect_id, tag_id),
  FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  FOREIGN KEY (prospect_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

## Optimisations de Performance

### Requêtes SQL Optimisées

**Problème résolu** : Tri avec GROUP BY causait des résultats désordonnés.

**Solution** : Utilisation de sous-requêtes en 3 étapes
1. Compter le total (avec DISTINCT sur id)
2. Récupérer les IDs triés via sous-requête SQL brute
3. Charger les prospects complets avec tags, préserver l'ordre

**Code** (prospectController.js:87-164) :
```javascript
// Étape 1: Count
const count = await Prospect.count({ where, include, distinct: true, col: 'id' });

// Étape 2: Sous-requête pour IDs triés
const idQuery = `
  SELECT id FROM prospects p
  WHERE ...
  ORDER BY ${sortField} ${sortOrder}, p.id ${sortOrder}
  LIMIT :limit OFFSET :offset
`;
const idRows = await sequelize.query(idQuery, { replacements, type: QueryTypes.SELECT });

// Étape 3: Charger prospects et préserver l'ordre
const prospectIds = idRows.map(row => row.id);
const prospectsUnordered = await Prospect.findAll({ where: { id: { [Op.in]: prospectIds } } });
const prospectMap = new Map(prospectsUnordered.map(p => [p.id, p]));
const prospects = prospectIds.map(id => prospectMap.get(id)).filter(Boolean);
```

### Indexation

Indexes créés automatiquement par Sequelize :
- PRIMARY KEY sur `id`
- UNIQUE KEY sur `(nom_entreprise, adresse)`
- UNIQUE KEY sur `tags.nom`
- FOREIGN KEYS sur `prospects_tags`

Indexes recommandés (à ajouter manuellement) :
```sql
CREATE INDEX idx_source ON prospects(source_scraping);
CREATE INDEX idx_ville ON prospects(ville);
CREATE INDEX idx_code_postal ON prospects(code_postal);
CREATE INDEX idx_date_ajout ON prospects(date_ajout);
```

## Gestion des Erreurs

### Middleware centralisé (errorHandler.js)

Gère tous les types d'erreurs :
- Erreurs Sequelize (validation, contraintes)
- Erreurs Joi (validation)
- Erreurs HTTP (404, 500, etc.)
- Erreurs inattendues

**Format de réponse** :
```json
{
  "error": "Validation Error",
  "message": "Le nom de l'entreprise est requis"
}
```

### Codes HTTP

- `200` : OK
- `201` : Created
- `400` : Bad Request (validation)
- `404` : Not Found
- `409` : Conflict (doublon)
- `500` : Internal Server Error

## Sécurité

### Helmet
Protection des en-têtes HTTP :
- XSS Protection
- Content Security Policy
- HSTS
- Frame Options

### CORS
Configuration CORS pour autoriser frontend :
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Validation
- Validation stricte avec Joi sur toutes les entrées
- Échappement automatique des requêtes SQL par Sequelize
- Protection contre injection SQL

### Audit
```bash
npm audit
```
0 vulnérabilités détectées (frontend & backend)

## Services de Scraping

### Playwright Service
Service principal pour automatisation de navigateur.

**Features** :
- Lancement de navigateurs (Chromium, Firefox, WebKit)
- Gestion des contextes et pages
- Screenshot et debugging
- Gestion des timeouts

### Scrapers

#### Pages Jaunes Scraper
Scraper pour PagesJaunes.fr avec détection automatique de dernière page.

**Stratégie** :
- Double URL pour pagination (with/without page param)
- Détection intelligente de dernière page
- Extraction complète (nom, adresse, téléphone, email, site)

#### Google Maps Service
Service dual-strategy pour extraction Google Maps.

**Stratégies** :
1. Recherche directe
2. Extraction depuis URL

**Scoring** : Méthode de scoring pour sélectionner meilleure stratégie.

## Anti-Bot & Optimisations

### Stratégies Anti-Bot (3 phases)

**Phase 1** : Stealth Mode (6 techniques)
- User-Agent rotation
- Viewport randomisation
- Timezone/locale masking
- WebGL fingerprint
- Canvas fingerprint
- Plugins masking

**Phase 2** : Advanced Stealth (14 techniques)
- Navigator properties
- Screen properties
- Permission queries
- WebDriver removal
- Chrome runtime
- Automation flags

**Phase 3** : Behavioral (5 patterns)
- Human mouse movements
- Realistic scrolling
- Random delays
- Click patterns
- Typing simulation

### Configuration

Voir [ANTIBOT_CONFIG.md](../docs/ANTIBOT_CONFIG.md) pour documentation complète.

## Tests

### Scripts de Test

```bash
# Tests unitaires
node scripts/test-validation.js              # 14 tests validation Joi
node scripts/test-pages-jaunes-scraper.js    # Test scraper Pages Jaunes
node scripts/test-scraping-api.js            # Test API scraping complète

# Tests anti-bot
node scripts/test-proxy-rotation.js          # 8 tests rotation proxies
node scripts/test-captcha-solver.js          # Test résolution CAPTCHA
node scripts/test-stealth-mode.js            # Test masquage

# Tests d'optimisation
node scripts/test-phase1-optimization.js     # 6 tests Phase 1
node scripts/test-phase2-optimization.js     # 7 tests Phase 2
node scripts/test-phase3-optimization.js     # 6 tests Phase 3
```

Voir [TESTS.md](../docs/TESTS.md) et [TESTING_GUIDE.md](../docs/TESTING_GUIDE.md) pour documentation complète.

## Déploiement

### Prérequis
- Node.js 22.19.0
- MySQL >= 8.0
- Mémoire : >= 2GB RAM
- Playwright browsers installés

### Steps

1. Installer les dépendances
```bash
npm install
npx playwright install
```

2. Configurer l'environnement
```bash
cp .env.example .env
# Éditer .env
```

3. Initialiser la base de données
```bash
npm run db:setup
```

4. Démarrer le serveur
```bash
npm start
```

### Production

```bash
NODE_ENV=production npm start
```

Recommandations :
- Utiliser PM2 pour gestion de processus
- Configurer reverse proxy (nginx)
- Activer HTTPS
- Rate limiting sur les endpoints publics
- Monitoring avec logs structurés

## Troubleshooting

### Erreur de connexion MySQL
Vérifier les credentials dans `.env` et que MySQL est démarré.

### Playwright browsers manquants
```bash
npx playwright install
```

### Port 3001 déjà utilisé
Changer `PORT` dans `.env` ou tuer le processus :
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Erreur "ER_NOT_SUPPORTED_AUTH_MODE"
MySQL 8+ utilise caching_sha2_password. Changer en mysql_native_password :
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```

## Documentation Complémentaire

- [API.md](../docs/API.md) - Spécifications API détaillées
- [DATABASE.md](../docs/DATABASE.md) - Schéma base de données
- [SETUP.md](../docs/SETUP.md) - Guide d'installation détaillé
- [PLAYWRIGHT_DECISION.md](../docs/PLAYWRIGHT_DECISION.md) - Choix Playwright
- [ANTIBOT_CONFIG.md](../docs/ANTIBOT_CONFIG.md) - Configuration anti-bot
- [SCRAPING_API.md](../docs/SCRAPING_API.md) - Documentation API scraping

## Contribution

Projet géré par Yannick Murat.

## License

Propriétaire - Tous droits réservés
