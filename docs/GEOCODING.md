# 🌍 Geocoding Inversé - Documentation Technique

## Vue d'ensemble

Le service de **geocoding inversé** (reverse geocoding) convertit automatiquement des coordonnées GPS (latitude, longitude) en informations d'adresse lisibles (ville, code postal).

Ce service est intégré au scraper Google Maps pour enrichir automatiquement les données des prospects.

---

## 🎯 Objectif

Enrichir les prospects avec les champs **`ville`** et **`code_postal`** à partir des coordonnées GPS extraites de Google Maps.

**Exemple** :
```
Input:  latitude=48.8584, longitude=2.2945
Output: ville="Paris", code_postal="75007"
```

---

## 🏗️ Architecture

### 1. APIs utilisées (cascade)

#### ✅ **Priorité 1 : API Gouvernementale Française**
- **URL** : `https://api-adresse.data.gouv.fr/reverse/`
- **Avantages** :
  - 100% gratuit
  - Aucune limite de requêtes
  - Données officielles françaises
  - Très précis pour la France
- **Inconvénients** :
  - France uniquement
  - Pas de données hors France

#### 🔄 **Fallback : Nominatim OpenStreetMap**
- **URL** : `https://nominatim.openstreetmap.org/reverse`
- **Avantages** :
  - Gratuit
  - Couverture mondiale
  - Bonne précision
- **Inconvénients** :
  - Rate limit strict : **1 requête/seconde**
  - User-Agent requis

### 2. Système de cache

- **Objectif** : Éviter requêtes répétées pour coordonnées proches
- **Fonctionnement** :
  - Clé de cache = coordonnées arrondies à 4 décimales (~11m de précision)
  - Exemple : `48.8584, 2.2945` → clé `48.8584,2.2945`
  - Toute coord proche (ex: `48.8583, 2.2946`) utilise la même clé
- **Stockage** : Map JavaScript en mémoire
- **Persistence** : Non (réinitialisé au redémarrage)

---

## 📦 Fichiers du service

### Service principal
- **Fichier** : `backend/src/services/geocodingService.js`
- **Export** : Singleton `geocodingService`
- **Méthodes** :
  - `reverseGeocode(latitude, longitude)` : Conversion GPS → ville/CP
  - `getStats()` : Récupérer statistiques d'utilisation
  - `clearCache()` : Vider le cache
  - `resetStats()` : Réinitialiser statistiques

### Intégration
- **Google Maps** : `backend/src/services/googleMapsService.js`
  - Appel automatique après extraction coordonnées GPS
  - Ligne ~595: Enrichissement avec `geocodingService.reverseGeocode()`

### Base de données
- **Modèle** : `backend/src/models/Prospect.js`
  - Champ `ville` : VARCHAR(100), nullable
  - Champ `code_postal` : VARCHAR(10), nullable
- **Controller** : `backend/src/controllers/scrapingController.js`
  - Sauvegarde des champs ville et code_postal (ligne ~199-200)

### Scripts
- **Migration** : `backend/scripts/migrate-add-ville-code-postal.js`
- **Test service** : `backend/scripts/test-geocoding-service.js`
- **Test intégration** : `backend/scripts/test-google-maps-geocoding.js`

---

## 🔧 Utilisation

### Utilisation directe du service

```javascript
import geocodingService from './services/geocodingService.js';

// Convertir coordonnées GPS en ville et code postal
const result = await geocodingService.reverseGeocode(48.8584, 2.2945);

console.log(result);
// {
//   ville: "Paris",
//   code_postal: "75007",
//   source: "api-gouv"
// }
```

### Utilisation via Google Maps (automatique)

Le geocoding est **automatiquement intégré** dans le scraper Google Maps :

```javascript
import { getGoogleMapsService } from './services/googleMapsService.js';

const googleMapsService = getGoogleMapsService();

const prospects = await googleMapsService.search({
  keyword: 'restaurant',
  location: 'Paris',
  maxResults: 10
});

// Les prospects incluent automatiquement ville et code_postal
prospects.forEach(p => {
  console.log(`${p.nom_entreprise} - ${p.ville} (${p.code_postal})`);
});
```

---

## 📊 Statistiques

Le service maintient des statistiques d'utilisation :

```javascript
const stats = geocodingService.getStats();

console.log(stats);
// {
//   totalRequests: 42,
//   cacheHits: 12,
//   gouvApiSuccess: 28,
//   nominatimSuccess: 2,
//   failures: 0,
//   cacheSize: 30,
//   cacheHitRate: 28  // en %
// }
```

**Métriques** :
- `totalRequests` : Nombre total de requêtes reçues
- `cacheHits` : Nombre de fois où le cache a été utilisé
- `gouvApiSuccess` : Succès avec API Gouv
- `nominatimSuccess` : Succès avec Nominatim (fallback)
- `failures` : Échecs totaux
- `cacheSize` : Nombre d'entrées en cache
- `cacheHitRate` : Taux de hit du cache (%)

---

## 🧪 Tests

### Test du service seul

```bash
cd backend
node scripts/test-geocoding-service.js
```

**Teste** :
- ✅ API Gouv (Paris, Marseille, Lyon)
- ✅ Système de cache
- ✅ Fallback Nominatim (Londres)
- ✅ Gestion erreurs (coordonnées nulles)

**Résultat attendu** :
```
✅ TEST RÉUSSI: Le service de geocoding fonctionne correctement !
Taux de succès: 75-100%
```

### Test d'intégration complet

```bash
cd backend
node scripts/test-google-maps-geocoding.js
```

**Teste** :
- ✅ Scraping Google Maps
- ✅ Extraction GPS
- ✅ Geocoding inversé automatique
- ✅ Sauvegarde ville et code postal en DB

**Résultat attendu** :
```
✅ TEST RÉUSSI: Geocoding intégré et fonctionnel !
3/3 prospects avec ville et code postal (100%)
```

---

## 📈 Performances

### Temps de réponse moyen

| API | Temps moyen | Rate limit |
|-----|-------------|------------|
| **API Gouv** | ~100-200ms | Aucun |
| **Nominatim** | ~200-500ms | 1 req/sec |
| **Cache** | <1ms | Illimité |

### Recommandations

1. **Cache hit rate optimal** : Viser 30-50% pour scraping réparti géographiquement
2. **Batch processing** : Pour éviter rate limit Nominatim, traiter par lots
3. **Retry logic** : Déjà implémentée (fallback automatique)

---

## 🚨 Gestion des erreurs

### Cas d'erreur gérés

1. **Coordonnées nulles/invalides**
   ```javascript
   const result = await geocodingService.reverseGeocode(null, null);
   // { ville: null, code_postal: null, source: "error" }
   ```

2. **API Gouv en erreur**
   ```
   [Geocoding] ❌ API Gouv erreur: timeout
   [Geocoding] 🔄 Fallback sur Nominatim...
   [Geocoding] ✅ Nominatim: Paris (75001)
   ```

3. **Toutes les APIs échouent**
   ```javascript
   // Retourne valeurs nulles sans crasher
   { ville: null, code_postal: null, source: "error" }
   ```

---

## 🔐 Configuration

Aucune configuration requise ! Le service fonctionne **out-of-the-box** :
- ✅ Pas de clé API nécessaire
- ✅ Pas de credentials
- ✅ Pas de limite de quota

---

## 🌐 Limitations

### API Gouvernementale FR
- ❌ France uniquement (DOM-TOM inclus)
- ✅ Aucune limite de requêtes
- ✅ Données officielles

### Nominatim OSM
- ✅ Couverture mondiale
- ⚠️ Rate limit strict : 1 req/sec
- ⚠️ User-Agent requis (déjà configuré)

---

## 🔮 Améliorations futures possibles

1. **Persistence du cache** :
   - Sauvegarder cache sur disque (JSON/Redis)
   - Eviter perte cache au redémarrage

2. **Batch geocoding** :
   - API Gouv supporte batch (25 coords/requête)
   - Optimiser pour scraping massif

3. **Enrichissement additionnel** :
   - Région/département
   - Pays
   - Type de lieu (quartier, arrondissement)

4. **Monitoring** :
   - Alertes si taux d'échec > seuil
   - Logs structurés (Winston/Bunyan)

---

## 📚 Ressources

### Documentation APIs

- **API Gouv** : https://adresse.data.gouv.fr/api-doc/adresse
- **Nominatim** : https://nominatim.org/release-docs/develop/api/Reverse/

### Code source

- Service : `backend/src/services/geocodingService.js`
- Intégration : `backend/src/services/googleMapsService.js`
- Tests : `backend/scripts/test-geocoding-*.js`

---

**Date de création** : 26 novembre 2025
**Auteur** : Yannick Murat + Claude Code
**Version** : 1.0
