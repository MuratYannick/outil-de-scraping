# 📡 API de Scraping - Documentation

**Dernière mise à jour** : 27 novembre 2025

Ce document décrit l'API de scraping asynchrone qui permet de lancer, suivre et gérer des tâches de scraping.

## 🆕 Nouveautés (Jour 25)

### Pages Jaunes - Améliorations majeures

✅ **Extraction optimale des données** :
- Mise à jour des sélecteurs DOM pour 2024 (`.bi-list > li`, `.bi-denomination h3`)
- Extraction des numéros de téléphone depuis `.bi-fantomas .number-contact`
- Nettoyage automatique des adresses ("Voir le plan", "Site web")
- Extraction automatique du code postal et de la ville dans des champs séparés

✅ **Nouvelles fonctionnalités** :
- Méthode `extractAddressComponents()` pour parser les adresses françaises
- Séparation automatique : adresse / code postal / ville
- Normalisation des téléphones au format français
- **Option `excludeDuplicates`** : Scraper jusqu'à N nouveaux prospects (hors doublons)
  - Vérification en temps réel contre la base de données
  - Continue jusqu'à obtenir le nombre demandé de NOUVEAUX prospects
  - Métriques détaillées : `duplicates_skipped`, `total_scraped`

✅ **Correction de bugs** :
- Fix `ReferenceError: result is not defined` dans scrapingController
- Meilleure gestion du scope des variables

**Exemple de données extraites** :
```json
{
  "nom_entreprise": "Artisans Bernard Et Sylvestre",
  "telephone": "01 44 40 02 61",
  "adresse": "7 rue Rochebrune",
  "ville": "Paris",
  "code_postal": "75011",
  "url_site": null,
  "source_scraping": "Pages Jaunes"
}
```

---

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Endpoints API](#endpoints-api)
- [Workflow](#workflow)
- [Tests](#tests)
- [Utilisation](#utilisation)

---

## Vue d'ensemble

L'API de scraping permet de :
- ✅ Lancer des tâches de scraping de manière asynchrone
- ✅ Suivre la progression en temps réel
- ✅ Sauvegarder automatiquement les prospects en base de données
- ✅ Gérer les doublons automatiquement
- ✅ Annuler des tâches en cours
- ✅ Récupérer l'historique des tâches

---

## Architecture

```
┌──────────────┐
│   Client     │
│  (Frontend)  │
└──────┬───────┘
       │ POST /api/scraping/lancer
       ▼
┌──────────────────────┐
│ ScrapingController   │
│  - Validation        │
│  - Création tâche    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   TaskManager        │
│  - Gestion état      │
│  - Événements        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ PagesJaunesScraper   │
│  - Scraping async    │
│  - Callbacks progrès │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Sauvegarde DB       │
│  - Prospects         │
│  - Tags              │
│  - Doublons          │
└──────────────────────┘
```

---

## Endpoints API

### POST /api/scraping/lancer

Lance une nouvelle tâche de scraping.

**Body** :
```json
{
  "keyword": "plombier",
  "location": "Lyon",
  "source": "Pages Jaunes",      // Optionnel, défaut: "Pages Jaunes"
  "maxPages": 1,                 // Optionnel, défaut: 1
  "maxResults": 10,              // Optionnel, défaut: 10
  "excludeDuplicates": false     // Optionnel, défaut: false (voir ci-dessous)
}
```

**⚙️ Paramètre `excludeDuplicates`** :

- `false` (défaut) : Le scraper s'arrête après avoir scrapé `maxResults` prospects (peut inclure des doublons)
- `true` : Le scraper continue jusqu'à trouver `maxResults` NOUVEAUX prospects (exclut les doublons déjà en DB)

**Exemple d'utilisation** :

Si vous avez déjà 20 restaurants à Cannes en base de données et que vous lancez un scraping avec `maxResults: 10` et `excludeDuplicates: true`, le scraper va :
1. Vérifier chaque prospect contre la base de données en temps réel
2. Ignorer les doublons et continuer à scraper
3. S'arrêter uniquement quand 10 NOUVEAUX restaurants ont été trouvés

Sans `excludeDuplicates`, le scraper s'arrêterait après avoir scrapé 10 prospects au total (même si tous sont des doublons).

**Response** (202 Accepted) :
```json
{
  "task_id": "uuid-de-la-tache",
  "status": "pending",
  "message": "Tâche de scraping créée et lancée",
  "params": {
    "keyword": "plombier",
    "location": "Lyon",
    "source": "Pages Jaunes",
    "maxPages": 1,
    "maxResults": 10
  }
}
```

---

### GET /api/scraping/status/:task_id

Récupère le statut et la progression d'une tâche.

**Response** (200 OK) :
```json
{
  "task_id": "uuid-de-la-tache",
  "status": "in_progress",  // pending, in_progress, completed, failed, cancelled
  "progress": 45,            // 0-100
  "params": {
    "keyword": "plombier",
    "location": "Lyon"
  },
  "results": {
    "total": 5,
    "pages_scraped": 1,
    "errors": [],
    "duplicates_skipped": 3,      // Si excludeDuplicates=true
    "total_scraped": 8            // Si excludeDuplicates=true (total + duplicates)
  },
  "createdAt": "2025-11-17T10:30:00Z",
  "startedAt": "2025-11-17T10:30:05Z",
  "completedAt": null,
  "error": null
}
```

**États possibles** :
- `pending` : Tâche créée, en attente de démarrage
- `in_progress` : Scraping en cours
- `completed` : Terminé avec succès
- `failed` : Échoué (voir le champ `error`)
- `cancelled` : Annulé par l'utilisateur

---

### POST /api/scraping/cancel/:task_id

Annule une tâche en cours.

**Response** (200 OK) :
```json
{
  "task_id": "uuid-de-la-tache",
  "status": "cancelled",
  "message": "Tâche annulée avec succès"
}
```

**Response** (400 Bad Request) :
```json
{
  "error": "Bad Request",
  "message": "Impossible d'annuler cette tâche (non trouvée ou déjà terminée)"
}
```

---

### GET /api/scraping/tasks

Récupère toutes les tâches (avec filtres optionnels).

**Query Parameters** :
- `status` : Filtrer par statut (pending, in_progress, completed, failed, cancelled)
- `limit` : Nombre maximum de résultats (défaut: 20)

**Exemple** :
```
GET /api/scraping/tasks?status=completed&limit=10
```

**Response** (200 OK) :
```json
{
  "data": [
    {
      "id": "uuid-1",
      "status": "completed",
      "progress": 100,
      "results": {
        "total": 10,
        "pages_scraped": 2
      },
      "createdAt": "2025-11-17T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### GET /api/scraping/stats

Récupère les statistiques du gestionnaire de tâches.

**Response** (200 OK) :
```json
{
  "total": 15,
  "pending": 0,
  "in_progress": 2,
  "completed": 10,
  "failed": 2,
  "cancelled": 1
}
```

---

## Workflow

### 1. Lancer un scraping

```javascript
// Frontend
const response = await axios.post('/api/scraping/lancer', {
  keyword: 'plombier',
  location: 'Lyon',
  maxPages: 2,
  maxResults: 20
});

const taskId = response.data.task_id;
```

### 2. Suivre la progression (polling)

```javascript
// Polling toutes les 2 secondes
const interval = setInterval(async () => {
  const status = await axios.get(`/api/scraping/status/${taskId}`);

  console.log(`Progress: ${status.data.progress}%`);
  console.log(`Prospects: ${status.data.results.total}`);

  if (status.data.status === 'completed') {
    clearInterval(interval);
    console.log('Scraping terminé !');
  }

  if (status.data.status === 'failed') {
    clearInterval(interval);
    console.error('Erreur:', status.data.error);
  }
}, 2000);
```

### 3. Récupérer les prospects

Une fois la tâche terminée, les prospects sont automatiquement sauvegardés en DB.

```javascript
// Récupérer les prospects sauvegardés
const prospects = await axios.get('/api/prospects?source=Pages Jaunes');
```

---

## Tests

### Test du TaskManager

```bash
cd backend
node scripts/test-task-manager.js
```

**Résultat attendu** : 12/12 tests passés ✅

### Test de l'intégration complète

```bash
# Terminal 1: Démarrer le serveur backend
cd backend
npm run dev

# Terminal 2: Lancer les tests
cd backend
node scripts/test-scraping-api.js
```

**Tests effectués** :
1. ✅ Health check du serveur
2. ✅ Lancement d'une tâche de scraping
3. ✅ Récupération du statut
4. ✅ Suivi de la progression jusqu'à completion
5. ✅ Récupération de toutes les tâches
6. ✅ Statistiques du gestionnaire
7. ✅ Vérification des prospects en DB

---

## Utilisation

### Configuration Anti-Bot

L'API de scraping utilise automatiquement la configuration anti-bot définie dans `.env` :

```env
# Stratégie anti-bot (none, proxies, captcha_solver, stealth, hybrid)
ANTIBOT_STRATEGY=stealth

# Proxies (si ANTIBOT_STRATEGY=proxies)
PROXY_ENABLED=true
PROXY_PROVIDER=smartproxy

# CAPTCHA Solver (si ANTIBOT_STRATEGY=captcha_solver)
CAPTCHA_SOLVER_ENABLED=true
CAPTCHA_SOLVER_PROVIDER=2captcha

# Stealth Mode (si ANTIBOT_STRATEGY=stealth)
STEALTH_ENABLED=true
```

Voir [ANTIBOT_CONFIG.md](./ANTIBOT_CONFIG.md) pour plus de détails.

### Gestion des Doublons

Les doublons sont automatiquement détectés et ignorés lors de la sauvegarde :

**Critères de détection** :
- Email identique
- OU URL de site identique

**Comportement** :
- Si un doublon est détecté, le prospect est ignoré
- Un log est affiché : `[ScrapingController] Doublon détecté: [nom]`
- Le compteur `duplicates_skipped` est incrémenté

### Tags Automatiques

Un tag est automatiquement créé et associé à chaque prospect basé sur le mot-clé de recherche :

```javascript
// Recherche: "plombier" → Tag: "Plombier"
// Recherche: "restaurant" → Tag: "Restaurant"
```

---

## Limitations

### Actuelles

1. **Stockage en mémoire** : Les tâches sont stockées en mémoire (max 100)
   - En production, utiliser Redis ou une DB pour la persistance

2. **Pas de WebSocket** : Le client doit faire du polling pour la progression
   - Future amélioration : WebSocket ou Server-Sent Events

3. **Mono-instance** : Le TaskManager est un singleton
   - Pour du scaling horizontal, utiliser un gestionnaire de tâches distribué (Bull, etc.)

### Anti-Bot

Le scraping peut être bloqué par Pages Jaunes selon la stratégie utilisée :

| Stratégie | Efficacité | Coût |
|-----------|-----------|------|
| **none** | ❌ Bloqué | Gratuit |
| **stealth** | ⚠️ Variable | Gratuit |
| **proxies** | ✅✅✅ Excellent | $75-$1000/mois |
| **captcha_solver** | ✅✅ Bon | $0.15-$3/1000p |
| **hybrid** | ✅✅✅✅ Maximum | $75-$1003/mois |

**Recommandation** : Commencer avec `stealth` (gratuit) puis ajouter `captcha_solver` si nécessaire.

---

## Prochaines Améliorations

### Court terme
- [ ] Ajouter la validation Joi sur les routes
- [ ] Implémenter le rate limiting
- [ ] Ajouter des logs structurés (Winston)

### Moyen terme
- [ ] WebSocket pour feedback temps réel (pas de polling)
- [ ] Persistance des tâches en DB ou Redis
- [ ] Interface de monitoring (dashboard admin)

### Long terme
- [ ] Gestion de tâches distribuées (Bull/BullMQ)
- [ ] Scraping de sources multiples (Google Maps, LinkedIn)
- [ ] Système de priorités et de file d'attente

---

## Dépannage

### Erreur: "Impossible de joindre le serveur"

**Solution** : Vérifier que le backend est démarré
```bash
cd backend && npm run dev
```

### Erreur: "Timeout (tâche trop longue)"

**Causes possibles** :
1. Site web lent ou indisponible
2. Anti-bot bloque le scraping
3. Trop de pages demandées

**Solutions** :
- Réduire `maxPages` et `maxResults`
- Activer une stratégie anti-bot (voir [ANTIBOT_CONFIG.md](./ANTIBOT_CONFIG.md))

### Tâche bloquée en "in_progress"

**Cause** : Erreur non gérée dans le scraper

**Solution** : Vérifier les logs du backend pour identifier l'erreur

---

**Questions ?** Voir aussi :
- [API.md](./API.md) - Spécifications complètes de l'API
- [ANTIBOT_CONFIG.md](./ANTIBOT_CONFIG.md) - Configuration anti-bot
- [TESTS.md](./TESTS.md) - Documentation des tests

---

**Dernière mise à jour** : 27 novembre 2025
**Version** : 1.2.0 (Jour 25 - Optimisation Pages Jaunes)
