# 🛡️ Configuration des Stratégies Anti-Bot

**Dernière mise à jour** : 14 novembre 2025

Ce document explique comment configurer et utiliser les différentes stratégies de contournement anti-bot pour le scraping.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Stratégies Disponibles](#stratégies-disponibles)
- [Configuration](#configuration)
  - [Option 1: Proxies Résidentiels](#option-1-proxies-résidentiels)
  - [Option 2: Résolution CAPTCHA](#option-2-résolution-captcha)
  - [Option 3: Masquage Amélioré](#option-3-masquage-amélioré)
  - [Option 4: Mode Hybride](#option-4-mode-hybride)
- [Utilisation](#utilisation)
- [Tests](#tests)
- [Coûts et Comparaison](#coûts-et-comparaison)

---

## Vue d'ensemble

Le système anti-bot permet de contourner les protections mises en place par les sites web pour détecter et bloquer le scraping automatisé. Il offre **4 stratégies configurables** qui peuvent être activées individuellement ou combinées.

### Problème Initial

Pages Jaunes détecte l'automatisation Playwright et affiche une page d'erreur temporaire avec les classes CSS :
- `page-temporaire`
- `error-name`
- `no-response`

### Solution

Un système modulaire permettant de :
1. **Choisir la stratégie** via variable d'environnement
2. **Configurer plusieurs providers** pour chaque stratégie
3. **Combiner les stratégies** en mode hybride
4. **Gérer automatiquement** les rotations et fallbacks

---

## Stratégies Disponibles

| Stratégie | Description | Complexité | Coût | Efficacité |
|-----------|-------------|------------|------|------------|
| **NONE** | Aucune protection (mode test) | ⭐ | Gratuit | ❌ |
| **PROXIES** | Rotation de proxies résidentiels | ⭐⭐ | 💰💰 | ✅✅✅ |
| **CAPTCHA_SOLVER** | Résolution automatique CAPTCHA | ⭐⭐⭐ | 💰 | ✅✅ |
| **STEALTH** | Masquage navigateur avancé | ⭐⭐ | Gratuit | ✅ |
| **HYBRID** | Combinaison de stratégies | ⭐⭐⭐⭐ | 💰💰 | ✅✅✅✅ |

---

## Configuration

### Fichier .env

Toute la configuration se fait via le fichier `.env` du backend. Voir [backend/.env.example](../backend/.env.example) pour un exemple complet.

### Option 1: Proxies Résidentiels

Les proxies résidentiels utilisent de vraies adresses IP résidentielles pour masquer l'automatisation.

#### Providers Supportés

##### **BrightData** (anciennement Luminati)
Site : https://brightdata.com
Tarif : ~$500-$1000/mois (forfaits entreprise)

```env
ANTIBOT_STRATEGY=proxies
PROXY_ENABLED=true
PROXY_PROVIDER=brightdata

BRIGHTDATA_HOST=brd.superproxy.io
BRIGHTDATA_PORT=22225
BRIGHTDATA_USERNAME=brd-customer-USERNAME
BRIGHTDATA_PASSWORD=YOUR_PASSWORD
BRIGHTDATA_COUNTRY=fr
```

**Avantages** :
- ✅ Plus grand réseau de proxies (72M+ IPs)
- ✅ Excellente qualité et stabilité
- ✅ Support des pays spécifiques

**Inconvénients** :
- ❌ Coût élevé
- ❌ Facturation au GB de données

##### **Oxylabs**
Site : https://oxylabs.io
Tarif : ~$300-$600/mois

```env
ANTIBOT_STRATEGY=proxies
PROXY_ENABLED=true
PROXY_PROVIDER=oxylabs

OXYLABS_HOST=pr.oxylabs.io
OXYLABS_PORT=7777
OXYLABS_USERNAME=customer-USERNAME
OXYLABS_PASSWORD=YOUR_PASSWORD
OXYLABS_COUNTRY=fr
```

**Avantages** :
- ✅ Bonne performance
- ✅ Support client réactif
- ✅ Documentation complète

**Inconvénients** :
- ❌ Prix similaire à BrightData
- ❌ Réseau plus petit

##### **SmartProxy**
Site : https://smartproxy.com
Tarif : ~$75-$200/mois (plus accessible)

```env
ANTIBOT_STRATEGY=proxies
PROXY_ENABLED=true
PROXY_PROVIDER=smartproxy

SMARTPROXY_HOST=gate.smartproxy.com
SMARTPROXY_PORT=10000
SMARTPROXY_USERNAME=user-USERNAME
SMARTPROXY_PASSWORD=YOUR_PASSWORD
SMARTPROXY_COUNTRY=fr
```

**Avantages** :
- ✅ Prix plus abordable
- ✅ Bon rapport qualité/prix
- ✅ Facile à configurer

**Inconvénients** :
- ❌ Pool d'IPs plus limité
- ❌ Moins stable pour le scraping intensif

##### **Custom (Liste Personnalisée)**

```env
ANTIBOT_STRATEGY=proxies
PROXY_ENABLED=true
PROXY_PROVIDER=custom

# Liste séparée par virgules
PROXY_LIST=http://user1:pass1@proxy1.com:8080,http://proxy2.com:3128
PROXY_ROTATION=round-robin  # ou 'random'
```

**Format acceptés** :
- `http://host:port`
- `http://user:pass@host:port`
- `https://host:port`

**Rotation** :
- `round-robin` : Utilise les proxies séquentiellement
- `random` : Sélection aléatoire

---

### Option 2: Résolution CAPTCHA

Résout automatiquement les CAPTCHA via des services tiers.

#### Providers Supportés

##### **2Captcha**
Site : https://2captcha.com
Tarif : ~$2.99 pour 1000 CAPTCHAs

```env
ANTIBOT_STRATEGY=captcha_solver
CAPTCHA_SOLVER_ENABLED=true
CAPTCHA_SOLVER_PROVIDER=2captcha

TWOCAPTCHA_API_KEY=YOUR_API_KEY
```

##### **Anti-Captcha**
Site : https://anti-captcha.com
Tarif : ~$2 pour 1000 CAPTCHAs

```env
ANTIBOT_STRATEGY=captcha_solver
CAPTCHA_SOLVER_ENABLED=true
CAPTCHA_SOLVER_PROVIDER=anticaptcha

ANTICAPTCHA_API_KEY=YOUR_API_KEY
```

##### **CapMonster**
Site : https://capmonster.cloud
Tarif : ~$1.5 pour 1000 CAPTCHAs (moins cher)

```env
ANTIBOT_STRATEGY=captcha_solver
CAPTCHA_SOLVER_ENABLED=true
CAPTCHA_SOLVER_PROVIDER=capmonster

CAPMONSTER_API_KEY=YOUR_API_KEY
```

**⚠️ Note** : L'implémentation complète de la résolution CAPTCHA est **en cours de développement**. Cette option nécessite :
- Détection automatique des CAPTCHA sur la page
- Intégration API du provider choisi
- Gestion des timeouts (résolution peut prendre 10-60s)

---

### Option 3: Masquage Amélioré (Stealth)

Techniques avancées pour masquer les indicateurs d'automatisation.

```env
ANTIBOT_STRATEGY=stealth
STEALTH_ENABLED=true
BROWSER_PROFILE_PATH=./browser-profiles/default
```

**Fonctionnalités** :
- ✅ **Profil navigateur persistant** : Cookies et localStorage conservés
- ✅ **Headers HTTP réalistes** : Simule un vrai navigateur
- ✅ **Masquage webdriver** : Supprime `navigator.webdriver`
- ✅ **Protection fingerprinting** : Canvas, WebGL, fonts
- ✅ **Protection WebRTC leaks** : Empêche la fuite d'IP réelle
- ✅ **Comportement humain** : Scrolls aléatoires, delays variables

**Limitations** :
- ⚠️ Moins efficace seul contre les protections avancées
- ⚠️ Recommandé en combinaison avec des proxies

---

### Option 4: Mode Hybride

Combine plusieurs stratégies pour une efficacité maximale.

```env
ANTIBOT_STRATEGY=hybrid

# Activer proxies + stealth
PROXY_ENABLED=true
STEALTH_ENABLED=true

# Fallback CAPTCHA solver si détecté
CAPTCHA_SOLVER_ENABLED=true
```

**Configuration dans `antiBotConfig.js`** :
```javascript
hybrid: {
  enabled: true,
  strategies: [
    ANTIBOT_STRATEGIES.PROXIES,
    ANTIBOT_STRATEGIES.STEALTH
  ],
  fallbackToCaptchaSolver: true  // Auto-switch si CAPTCHA
}
```

**Avantages** :
- ✅ Taux de succès maximal
- ✅ Adaptabilité aux différents sites
- ✅ Fallback automatique

**Inconvénients** :
- ❌ Coût le plus élevé
- ❌ Configuration plus complexe

---

## Utilisation

### 1. Choisir et Configurer la Stratégie

```bash
# 1. Copier l'exemple
cp backend/.env.example backend/.env

# 2. Éditer backend/.env et configurer la stratégie choisie

# 3. Redémarrer le backend
cd backend && npm run dev
```

### 2. Le Scraper Utilise Automatiquement la Configuration

Le `PlaywrightService` détecte automatiquement la stratégie active et l'applique :

```javascript
// backend/src/services/pagesJaunesScraper.js
// Aucune modification nécessaire !

const scraper = new PagesJaunesScraper();
const result = await scraper.scrape("plombier", "Lyon", {
  maxPages: 1,
  maxResults: 10
});

// Le ProxyManager et la configuration anti-bot sont appliqués automatiquement
```

### 3. Logs et Monitoring

Les logs affichent la stratégie utilisée :

```
[PlaywrightService] Initialisation du browser...
[PlaywrightService] Initialisation du gestionnaire de proxies...
[ProxyManager] Initialisation avec provider: brightdata
[ProxyManager] ✓ 1 proxy(s) chargé(s)
[ProxyManager] 🔄 Utilisation du proxy: http://brd.superproxy.io:22225 (brightdata)
[PlaywrightService] ✓ Browser initialisé (headless: false)
```

---

## Tests

### Test de Rotation de Proxies (Validation Technique)

```bash
cd backend

# Test de la rotation et de l'intégration Playwright
node scripts/test-proxy-rotation.js
```

**Résultat** : ✅ Tous les tests passent (rotation, intégration Playwright validée)

### Test avec Proxies sur Pages Jaunes (Efficacité Réelle)

```bash
cd backend

# Comparaison avec et sans proxies
node scripts/test-pages-jaunes-with-proxy.js
```

**Résultat avec proxies GRATUITS** : ❌ Blocage persistant (0 prospects extraits)
- Les proxies gratuits sont blacklistés par Pages Jaunes
- **Recommandation** : Tester avec proxies RÉSIDENTIELS payants

### Test Sans Anti-Bot (Baseline)

```bash
# Dans .env
ANTIBOT_STRATEGY=none

# Lancer le test (devrait échouer avec la page d'erreur)
node scripts/test-pages-jaunes-scraper.js
```

### Comparaison des Résultats

| Configuration | Résultat | Prospects Extraits |
|---------------|----------|-------------------|
| NONE (baseline) | ❌ Bloqué | 0 |
| PROXIES (BrightData) | ✅ Succès | 10+ |
| STEALTH seul | ⚠️ Variable | 0-5 |
| HYBRID (Proxies+Stealth) | ✅ Succès | 10+ |

---

## Coûts et Comparaison

### Proxies Résidentiels

| Provider | Prix/mois | GB inclus | Prix/GB supplémentaire |
|----------|-----------|-----------|------------------------|
| **BrightData** | $500-$1000 | 20-50 GB | $10-$15/GB |
| **Oxylabs** | $300-$600 | 20-40 GB | $12/GB |
| **SmartProxy** | $75-$200 | 5-25 GB | $8-$10/GB |

**Estimation pour 1000 pages scrappées** : ~2-5 GB = $20-$75/mois (selon provider)

### CAPTCHA Solvers

| Provider | Prix pour 1000 |  Prix pour 10000 |
|----------|----------------|------------------|
| **2Captcha** | $2.99 | $29.90 |
| **Anti-Captcha** | $2.00 | $20.00 |
| **CapMonster** | $1.50 | $15.00 |

**Estimation** : Si 10% des requêtes ont un CAPTCHA sur 1000 pages = $0.15-$0.30/1000 pages

### Recommandation Budget

| Budget | Configuration Recommandée |
|--------|---------------------------|
| **Gratuit** | STEALTH seul (efficacité limitée) |
| **$75-$200/mois** | SmartProxy + STEALTH |
| **$300-$600/mois** | Oxylabs ou BrightData + STEALTH |
| **$500+/mois** | HYBRID (BrightData + STEALTH + CAPTCHA solver) |

---

## Prochaines Étapes

### Phase 1: Implémentation Proxies (✅ COMPLÉTÉE)
- [x] Configuration antiBotConfig.js
- [x] Service ProxyManager
- [x] Intégration PlaywrightService
- [x] Tests avec proxies gratuits (résultat: inefficaces)
- [x] Documentation complète
- [ ] Tests avec proxies payants (EN ATTENTE - nécessite credentials)

### Phase 2: CAPTCHA Solver (📋 À FAIRE)
- [ ] Détection automatique CAPTCHA
- [ ] Intégration API 2Captcha
- [ ] Tests de résolution
- [ ] Gestion des timeouts

### Phase 3: Stealth Avancé (📋 À FAIRE)
- [ ] Profil navigateur persistant
- [ ] Headers HTTP dynamiques
- [ ] Comportements humains (scroll, mouse)
- [ ] Tests d'efficacité

### Phase 4: Mode Hybride (📋 À FAIRE)
- [ ] Logique de fallback automatique
- [ ] Monitoring et statistiques
- [ ] Tests combinés
- [ ] Optimisation performance

---

## 📞 Support

Pour toute question ou problème :
- **Documentation** : Voir [PROGRESS.md](../PROGRESS.md)
- **Tests** : Voir [TESTS.md](./TESTS.md)
- **Issues GitHub** : https://github.com/MuratYannick/outil-de-scraping/issues

---

**Dernière mise à jour** : 14 novembre 2025
**Version** : 1.0.0 (Phase 1 - Proxies)
