# 🧪 Guide de Lancement Manuel des Tests

Ce guide décrit comment lancer manuellement tous les tests du projet **Outil de Scraping**.

---

## 📋 Prérequis

Avant de lancer les tests, assurez-vous que :

1. **Node.js 22.19.0** est installé
2. **MySQL 8.0+** est en cours d'exécution
3. Les dépendances sont installées :
   ```bash
   cd backend && npm install
   cd frontend && npm install
   ```
4. Le fichier `.env` du backend est configuré (voir `.env.example`)

---

## 🔧 Tests Backend

### 1. Tests de Base de Données

#### Test Setup de la DB

```bash
cd backend
npm run db:setup
```

**Résultat attendu** :
```
Connecting to MySQL...
Database ensured: outil_scraping_db
Executing SQL file: ...
SQL initialization script executed successfully
Running Sequelize sync...
Sequelize sync completed
Database setup finished
```

---

#### Test Seed de Données

```bash
cd backend
npm run db:seed
```

**Résultat attendu** :
```
🌱 Démarrage du seed...
✓ Connecté à la base de données
📌 Création des tags...
  ✓ Tag créé : Bâtiment
  ...
✓ 10 tags disponibles
👥 Création des prospects...
  ✓ Prospect créé : Plomberie Martin
  ...
✓ 6 prospects créés
📊 Statistiques :
  - Total prospects : 6
  - Total tags : 10
✅ Seed terminé avec succès !
```

---

#### Test Drop/Reset de Tables

```bash
cd backend

# Drop (demande confirmation)
npm run db:drop
# Tapez "oui" quand demandé

# Reset complet (drop + setup)
npm run db:reset

# Reset + seed
npm run db:reset && npm run db:seed
```

**Résultat attendu** :
```
⚠️  ATTENTION : Suppression de toutes les tables ⚠️
Êtes-vous sûr ? (oui/non) : oui
🗑️  Suppression de 3 table(s)...
✓ Toutes les tables ont été supprimées
```

---

### 2. Tests API CRUD

#### Préparation

```bash
# Terminal 1: Démarrer le serveur backend
cd backend
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

---

#### Test Routes Prospects

**Terminal 2** : Exécuter les commandes curl

```bash
# GET - Liste tous les prospects
curl http://localhost:3001/api/prospects

# POST - Créer un prospect
curl -X POST http://localhost:3001/api/prospects \
  -H "Content-Type: application/json" \
  -d '{
    "nom_entreprise": "Test SARL",
    "nom_contact": "Jean Dupont",
    "email": "jean@test.com",
    "telephone": "01 23 45 67 89",
    "adresse": "1 Rue de Test, 75001 Paris",
    "url_site": "https://test.com",
    "source_scraping": "Manual"
  }'

# GET - Prospect par ID (remplacer 1 par l'ID retourné)
curl http://localhost:3001/api/prospects/1

# PUT - Modifier un prospect
curl -X PUT http://localhost:3001/api/prospects/1 \
  -H "Content-Type: application/json" \
  -d '{"telephone": "01 99 88 77 66"}'

# POST - Associer un tag
curl -X POST http://localhost:3001/api/prospects/1/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_id": 1}'

# DELETE - Dissocier un tag
curl -X DELETE http://localhost:3001/api/prospects/1/tags/1

# DELETE - Supprimer un prospect
curl -X DELETE http://localhost:3001/api/prospects/1
```

**Résultats attendus** :
- GET : Liste JSON des prospects
- POST : Retour du prospect créé avec ID
- PUT : Prospect mis à jour
- DELETE : Message de confirmation

---

#### Test Routes Tags

```bash
# GET - Liste tous les tags
curl http://localhost:3001/api/tags

# POST - Créer un tag
curl -X POST http://localhost:3001/api/tags \
  -H "Content-Type: application/json" \
  -d '{"nom": "Nouveau Secteur"}'

# GET - Tag par ID
curl http://localhost:3001/api/tags/1

# PUT - Modifier un tag
curl -X PUT http://localhost:3001/api/tags/1 \
  -H "Content-Type: application/json" \
  -d '{"nom": "Bâtiment & Travaux"}'

# DELETE - Supprimer un tag
curl -X DELETE http://localhost:3001/api/tags/11
```

---

#### Test Health Check

```bash
curl http://localhost:3001/api/health
```

**Résultat attendu** :
```json
{
  "status": "ok",
  "message": "API Backend opérationnelle"
}
```

---

### 3. Tests Service Playwright

#### Test Complet du Service

```bash
cd backend
node scripts/test-playwright.js
```

**Résultat attendu** :
```
🧪 Test de Playwright Service

📋 Test 1: Initialisation du service
[PlaywrightService] Initialisation du browser...
✓ Initialisation réussie

📋 Test 2: Création d'un browser context
✓ Context créé

📋 Test 3: Création d'une page
✓ Page créée

📋 Test 4: Navigation vers example.com
✓ Page chargée - Titre: "Example Domain"

📋 Test 5: Extraction de contenu
✓ Contenu H1: "Example Domain"

📋 Test 6: Prise de screenshot
✓ Screenshot sauvegardé: backend/scripts/test-screenshot.png

📋 Test 7: Test de la fonction retry
✓ Fonction retry opérationnelle

📋 Test 8: Test du delay aléatoire
✓ Delay aléatoire fonctionnel

📋 Test 9: Récupération des statistiques
✓ Statistiques du service:
  - Initialisé: true
  - Contexts actifs: 1
  - Max contexts: 3
  - Headless: false

📋 Test 10: Fermeture du context
✓ Context fermé

════════════════════════════════════════════════════════════
✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS
════════════════════════════════════════════════════════════
```

**Vérifications** :
- Un screenshot `test-screenshot.png` doit être créé dans `backend/scripts/`
- Aucune erreur ne doit apparaître
- Le navigateur doit se fermer proprement

---

### 4. Tests Scraping Pages Jaunes

#### Test du Scraper Pages Jaunes

```bash
cd backend
node scripts/test-pages-jaunes-scraper.js
```

**Description** :
- Teste le scraper avec 2 recherches différentes
- Test 1: "plombier" à "Lyon" (1 page, 10 résultats max)
- Test 2: "restaurant" à "Paris" (2 pages, 20 résultats max)

**Résultat attendu** :
```
🧪 Test du Scraper Pages Jaunes

════════════════════════════════════════════════════════════════════════════════
📋 TEST 1: Recherche 'plombier' à 'Lyon' (1 page)
════════════════════════════════════════════════════════════════════════════════

[PagesJaunesScraper] Démarrage du scraping: "plombier" à "Lyon"
[PagesJaunesScraper] Max pages: 1, Max résultats: 10
...
[PagesJaunesScraper] ✅ Scraping terminé: X prospects récupérés

📊 RÉSULTATS TEST 1:
{
  "success": true,
  "prospects": [...],
  "total": X,
  "pages_scraped": 1
}

✅ TEST 1 PASSÉ
   - X prospects extraits
   - 1 page(s) scrapée(s)
```

**⚠️ État actuel** : Bloqué par anti-bot de Pages Jaunes
- Le site détecte l'automatisation et affiche une page d'erreur
- Les fonctionnalités du scraper sont implémentées mais non testables avec Pages Jaunes
- Solutions: Proxies, CAPTCHA solving, ou utiliser un autre site de test

#### Script de Debug Pages Jaunes

```bash
cd backend
node scripts/debug-pages-jaunes.js
```

**Description** :
- Analyse la structure HTML de Pages Jaunes
- Teste différents sélecteurs CSS
- Prend un screenshot de la page chargée
- Détecte la présence de CAPTCHA

**Résultat attendu** :
```
🔍 Debug Pages Jaunes - Analyse de la structure HTML

Navigation vers: https://www.pagesjaunes.fr/...

📸 Prise de screenshot...
✓ Screenshot sauvegardé: backend/scripts/pages-jaunes-debug.png

🔍 Test des sélecteurs:
  .bi-product                              → X éléments trouvés
  [class*="result-item"]                   → X éléments trouvés
  ...

📋 Classes CSS présentes sur la page:
...

✅ Analyse terminée
```

**Vérifications** :
- Screenshot créé dans `backend/scripts/pages-jaunes-debug.png`
- Liste des sélecteurs testés affichée
- Classes CSS de la page listées

---

## 🎨 Tests Frontend

### 1. Test Connexion Frontend-Backend

#### Préparation

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Accès** : Ouvrir `http://localhost:5173` dans le navigateur

---

#### Vérifications Visuelles

**Header** :
- ✅ Titre "Outil de Scraping" affiché
- ✅ Indicateur vert "API Connectée" visible

**Liste des Prospects** :
- ✅ Tableau affiché avec colonnes : Entreprise, Contact, Email, Téléphone, Tags, Actions
- ✅ 6 prospects chargés (si seed effectué)
- ✅ Tags affichés sous forme de badges colorés
- ✅ Bouton "Actualiser" fonctionnel

**Debug Info** (en mode dev) :
- ✅ API URL: http://localhost:3001/api
- ✅ API Status: ✓ Connected
- ✅ Prospects chargés: 6
- ✅ Total en DB: 6

---

#### Test du Bouton Actualiser

1. Cliquer sur le bouton "Actualiser"
2. Vérifier :
   - ✅ Le bouton affiche "Chargement..." pendant le chargement
   - ✅ La liste se recharge correctement
   - ✅ Pas d'erreur dans la console du navigateur

---

### 2. Test API Service (Console Navigateur)

Ouvrir la console du navigateur (F12) et exécuter :

```javascript
// Test manuel de l'API service
import { getProspects, checkHealth } from './services/api.js';

// Health check
checkHealth().then(console.log);

// Récupérer prospects
getProspects({ limit: 10, offset: 0 }).then(console.log);
```

---

## 🔗 Tests d'Intégration

### Test avec Thunder Client (VS Code)

**Extension** : Thunder Client pour VS Code

#### 1. Créer une Collection "Outil de Scraping"

#### 2. Ajouter les Requêtes

**GET Prospects** :
- Method: GET
- URL: `http://localhost:3001/api/prospects`
- Headers: (aucun)

**POST Prospect** :
- Method: POST
- URL: `http://localhost:3001/api/prospects`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "nom_entreprise": "Thunder Test SARL",
  "nom_contact": "Marie Martin",
  "email": "marie@thunder.test",
  "telephone": "04 56 78 90 12",
  "adresse": "10 Rue Thunder, 69001 Lyon",
  "url_site": "https://thunder.test",
  "source_scraping": "Manual"
}
```

**GET Tags** :
- Method: GET
- URL: `http://localhost:3001/api/tags`

**POST Tag** :
- Method: POST
- URL: `http://localhost:3001/api/tags`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "nom": "Test Tag"
}
```

#### 3. Exécuter la Collection

Cliquer sur "Run All" pour exécuter toutes les requêtes.

**Résultats attendus** :
- ✅ Toutes les requêtes retournent status 200 ou 201
- ✅ Les données créées apparaissent dans les GET suivants
- ✅ Pas d'erreurs 4xx ou 5xx

---

## 🔐 Tests de Sécurité

### Audit NPM

```bash
# Backend
cd backend
npm audit

# Frontend
cd frontend
npm audit
```

**Résultat attendu** :
```
found 0 vulnerabilities
```

---

### Test Validation des Données

Tester avec des données invalides :

```bash
# Email invalide
curl -X POST http://localhost:3001/api/prospects \
  -H "Content-Type: application/json" \
  -d '{"nom_entreprise": "Test", "email": "invalid-email"}'

# Tag vide
curl -X POST http://localhost:3001/api/tags \
  -H "Content-Type: application/json" \
  -d '{"nom": ""}'
```

**Résultat attendu** : Erreurs 400 avec messages explicites

---

## 📊 Script de Test Automatisé

### Créer un Script de Test Rapide

Créer `backend/scripts/quick-test.sh` (Linux/Mac) ou `quick-test.bat` (Windows) :

**Windows (quick-test.bat)** :
```batch
@echo off
echo ========================================
echo Tests Rapides - Outil de Scraping
echo ========================================

cd backend

echo.
echo [1/4] Test Health Check...
curl -s http://localhost:3001/api/health

echo.
echo [2/4] Test GET Prospects...
curl -s http://localhost:3001/api/prospects

echo.
echo [3/4] Test GET Tags...
curl -s http://localhost:3001/api/tags

echo.
echo [4/4] Test Playwright Service...
node scripts/test-playwright.js

echo.
echo ========================================
echo Tests Terminés !
echo ========================================
```

**Lancer** :
```bash
cd backend
./quick-test.bat  # Windows
# ou
./quick-test.sh   # Linux/Mac
```

---

## 🐛 Debugging des Tests

### Logs Backend

Le backend utilise des logs détaillés. Vérifier :
- Console du terminal où `npm run dev` est lancé
- Messages `[PlaywrightService]` pour les opérations Playwright
- Erreurs Sequelize pour les problèmes DB

### Logs Frontend

Ouvrir la console du navigateur (F12) :
- Onglet "Console" : Logs applicatifs
- Onglet "Network" : Requêtes API
- Onglet "React DevTools" : État des composants (si extension installée)

### Problèmes Courants

**Port déjà utilisé** :
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

**Base de données non accessible** :
```bash
# Vérifier que MySQL est démarré
# Windows: Services → MySQL
# Linux: sudo systemctl status mysql
```

**Playwright browser non trouvé** :
```bash
cd backend
npx playwright install chromium
```

---

## 📝 Checklist Avant Push

Avant de pusher du code, exécuter :

- [ ] `npm run db:reset && npm run db:seed` (backend)
- [ ] `node scripts/test-playwright.js` (backend)
- [ ] Tester les routes API avec curl ou Thunder Client
- [ ] Démarrer frontend et vérifier l'affichage
- [ ] `npm audit` (backend + frontend)
- [ ] Vérifier les logs - pas d'erreurs

---

## 🎯 Tests par Fonctionnalité

### Test Complet d'une Feature

Pour tester une fonctionnalité de bout en bout :

1. **Reset DB** : `npm run db:reset && npm run db:seed`
2. **Start Backend** : `npm run dev` (backend)
3. **Start Frontend** : `npm run dev` (frontend)
4. **Test API** : Curl ou Thunder Client
5. **Test UI** : Navigateur sur localhost:5173
6. **Vérifier DB** : Connecter à MySQL et vérifier les données

---

**Pour la liste complète des tests effectués** : Voir [TESTS.md](./TESTS.md)

**Dernière mise à jour** : 14 novembre 2025
