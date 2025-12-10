# 🛡️ Configuration des Stratégies Anti-Bot

**Dernière mise à jour** : 21 novembre 2025

Ce document explique comment configurer et utiliser les différentes stratégies de contournement anti-bot pour le scraping.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Configuration par Scraper](#configuration-par-scraper)
- [Interface Utilisateur](#interface-utilisateur)
- [Stratégies Disponibles](#stratégies-disponibles)
- [Configuration](#configuration)
  - [Option 1: Proxies Résidentiels](#option-1-proxies-résidentiels)
  - [Option 2: Résolution CAPTCHA](#option-2-résolution-captcha)
  - [Option 3: Masquage Amélioré](#option-3-masquage-amélioré)
  - [Option 4: Mode Hybride](#option-4-mode-hybride)
  - [Option 5: Mode Custom](#option-5-mode-custom)
- [Utilisation](#utilisation)
- [Tests](#tests)
- [Coûts et Comparaison](#coûts-et-comparaison)

---

## Vue d'ensemble

Le système anti-bot permet de contourner les protections mises en place par les sites web pour détecter et bloquer le scraping automatisé. Il offre **3 stratégies configurables** qui peuvent être activées individuellement ou combinées.

### Problème Initial

Pages Jaunes détecte l'automatisation Playwright et affiche une page d'erreur temporaire avec les classes CSS :
- `page-temporaire`
- `error-name`
- `no-response`

### Solution

Un système modulaire permettant de :
1. **Choisir la stratégie** via variable d'environnement ou interface web
2. **Configurer plusieurs providers** pour chaque stratégie
3. **Combiner les stratégies** en mode hybride
4. **Gérer automatiquement** les rotations et fallbacks
5. **Configuration indépendante par scraper** (nouveau)
6. **Interface utilisateur intuitive** avec synchronisation bidirectionnelle (nouveau)

---

## Configuration par Scraper

**Depuis le Jour 20** (21 novembre 2025), chaque scraper peut avoir sa propre configuration anti-bot indépendante.

### Architecture

```
antiBotConfig.scrapers = {
  pagesJaunes: {
    activeStrategy: 'hybrid',
    proxies: { enabled: true, ... },
    captcha: { enabled: true, ... },
    stealth: { enabled: true, ... }
  },
  googleMaps: {
    activeStrategy: 'none',
    proxies: { enabled: false, ... },
    captcha: { enabled: false, ... },
    stealth: { enabled: false, ... }
  },
  linkedin: {
    activeStrategy: 'stealth',
    proxies: { enabled: false, ... },
    captcha: { enabled: false, ... },
    stealth: { enabled: true, ... }
  }
}
```

### Avantages

- ✅ **Indépendance** : Pages Jaunes peut être en mode HYBRID pendant que Google Maps est en NONE
- ✅ **Flexibilité** : Adapter la configuration à la difficulté de chaque site
- ✅ **Isolation** : Chaque scraper a sa propre instance de PlaywrightService
- ✅ **Scalabilité** : Facile d'ajouter de nouveaux scrapers

### Scrapers Supportés

| Scraper ID | Nom | Difficulté | Config Recommandée |
|------------|-----|------------|-------------------|
| `pagesJaunes` | Pages Jaunes | ⭐⭐⭐⭐ | HYBRID ou CAPTCHA+Stealth |
| `googleMaps` | Google Maps | ⭐⭐⭐ | STEALTH ou API Places |
| `linkedin` | LinkedIn | ⭐⭐⭐⭐⭐ | STEALTH (mode public limité) |

---

## Interface Utilisateur

L'onglet **"Config Anti-Bot"** offre une interface complète pour gérer les stratégies anti-bot.

### Structure de l'Interface

```
┌─────────────────────────────────────────────────────────────┐
│  Config Anti-Bot         [Menu Scraper: Pages Jaunes ▼]     │
├─────────────────────────────────────────────────────────────┤
│  [📊 Vue d'ensemble] [🌐 Proxies] [🔐 CAPTCHA] [🥷 Stealth] [🧪 Tests] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Contenu de l'onglet actif                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Onglets Disponibles

#### 1. 📊 **Vue d'Ensemble**

Sélection rapide de la stratégie avec 6 options :

| Stratégie | Badge | Description | Cliquable |
|-----------|-------|-------------|-----------|
| **Aucune Protection** | - | Aucune stratégie active | ✅ Oui |
| **Stealth Seul** | - | Masquage Playwright uniquement | ✅ Oui |
| **CAPTCHA + Stealth** | ⭐ Recommandé | Résolution CAPTCHA + masquage | ✅ Oui |
| **Proxies + Stealth** | - | Rotation IP + masquage | ✅ Oui |
| **Mode HYBRID** | - | Toutes les stratégies combinées | ✅ Oui |
| **Configuration Personnalisée** | 🔄 Automatique | Combinaison personnalisée | ❌ Non (auto) |

**Synchronisation Bidirectionnelle** :
- Sélectionner une stratégie met à jour automatiquement les toggles dans les onglets individuels
- Modifier les toggles individuels met à jour automatiquement la stratégie sélectionnée

**Mode Custom** :
- S'active automatiquement pour toute combinaison non-standard (ex: Proxies seuls, CAPTCHA sans Stealth)
- Bordure et fond violet quand actif
- Badge "🔄 Automatique" pour indiquer l'activation automatique
- Non cliquable (activation uniquement via les toggles individuels)

#### 2. 🌐 **Proxies**

Configuration détaillée des proxies résidentiels :
- Toggle **Activé/Désactivé**
- Sélection du provider (BrightData, Oxylabs, SmartProxy, Custom)
- Liste de proxies personnalisée (pour provider Custom)
- Mode de rotation (Round-robin, Aléatoire)

#### 3. 🔐 **CAPTCHA**

Configuration du CAPTCHA solver :
- Toggle **Activé/Désactivé**
- Sélection du provider (2Captcha, Anti-Captcha, CapMonster)
- Clé API
- Message d'avertissement si Stealth est désactivé

#### 4. 🥷 **Stealth**

Configuration du masquage avancé :
- Toggle **Activé/Désactivé**
- Chemin du profil navigateur
- Checkbox comportements humains (scroll, delays, mouvements souris)
- Liste des fonctionnalités Stealth (14 indicateurs masqués)
- Avertissement : insuffisant seul contre Pages Jaunes

#### 5. 🧪 **Tests**

Interface de test avec :
- **Menu Scraper à tester** (Pages Jaunes, Google Maps, LinkedIn)
- **Configuration Actuelle** : affiche la config du scraper sélectionné dans le menu
- **Bouton de test** : lance un test réel avec la config actuelle
- **Résultats** : affiche succès/échec, nombre de prospects extraits, message détaillé

**Note** : Le menu Scraper du header est **masqué** dans cet onglet (évite la confusion).

### Fonctionnalités UX Avancées

#### Synchronisation Bidirectionnelle

```
Vue d'ensemble ←→ Onglets individuels
     ↓                    ↓
Stratégie sélectionnée   Toggles activés
```

**Exemple** :
1. Tu sélectionnes "Proxies + Stealth" dans Vue d'ensemble
2. Les toggles se mettent à jour : Proxies ✅, CAPTCHA ❌, Stealth ✅
3. Tu vas dans l'onglet Proxies et désactives le toggle
4. La stratégie dans Vue d'ensemble passe automatiquement en "Stealth Seul"

#### Rechargement Automatique

- **Au changement de scraper** : Recharge la config du scraper sélectionné
- **À l'entrée dans l'onglet Test** : Recharge la config du scraper de test
- **Après sauvegarde** : La config affichée est immédiatement à jour

---

## Stratégies Disponibles

| Stratégie | Description | Complexité | Coût | Efficacité Pages Jaunes | Efficacité Google Maps |
|-----------|-------------|------------|------|------------------------|------------------------|
| **NONE** | Aucune protection (mode test) | ⭐ | Gratuit | ❌ Bloqué | ❌ Bloqué |
| **PROXIES** | Rotation de proxies résidentiels | ⭐⭐ | 💰💰 ($75-$1000/mois) | ✅✅✅ À tester | ✅✅✅ À tester |
| **CAPTCHA_SOLVER** | Résolution automatique CAPTCHA + Stealth | ⭐⭐⭐ | 💰 ($0.15-$3/1000p) | ✅✅ À tester | ✅✅ À tester |
| **STEALTH** | Masquage navigateur avancé | ⭐⭐ | Gratuit | ✅✅✅ **100% succès** | ✅✅ **88% succès** |
| **HYBRID** | Proxies + Stealth + CAPTCHA | ⭐⭐⭐⭐ | 💰💰 | ✅✅✅✅ Maximum | ✅✅✅✅ Maximum |
| **CUSTOM** | Configuration personnalisée (automatique) | Variable | Variable | Variable | Variable |

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

**Résultats Validés (Tests du 10/12/2025)** :
- ✅ **Pages Jaunes** : **100% de succès** (50/50 prospects récupérés)
- ✅ **Google Maps** : **88% de succès** (44/50 prospects récupérés)
- ⚠️ **Important** : Désactiver le VPN (détecté par Cloudflare)

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

### Option 5: Mode Custom

**Nouveau depuis le Jour 20bis** (21 novembre 2025)

Le mode Custom s'active **automatiquement** lorsque vous créez une combinaison de stratégies qui ne correspond à aucune configuration prédéfinie.

#### Activation Automatique

Le mode Custom est détecté pour toute combinaison non-standard :

```javascript
// Exemples de configurations Custom :
{ proxies: true,  captcha: false, stealth: false }  // Proxies seuls
{ proxies: false, captcha: true,  stealth: false }  // CAPTCHA seul
{ proxies: true,  captcha: true,  stealth: false }  // Proxies + CAPTCHA sans Stealth
{ proxies: false, captcha: false, stealth: false }  // → Devient 'none' (pas custom)
```

#### Interface Utilisateur

Dans l'onglet "Config Anti-Bot" → "Vue d'ensemble" :

```
┌──────────────────────────────────────────────────┐
│  ⚙️ Configuration Personnalisée    [🔄 Automatique] │
│                                                    │
│  💰 Coût: Variable                                 │
│  📊 Efficacité: Variable                           │
└──────────────────────────────────────────────────┘
```

**Caractéristiques** :
- **Badge "🔄 Automatique"** : Indique que le mode s'est activé automatiquement
- **Bordure violette** : Style visuel distinct quand actif
- **Non cliquable** : La carte ne peut pas être sélectionnée directement
- **Activation uniquement via toggles** : Modifier les toggles dans les onglets Proxies, CAPTCHA ou Stealth

#### Comment Créer une Configuration Custom

1. Va dans l'onglet "Proxies" et active le toggle
2. Va dans l'onglet "Stealth" et **désactive** le toggle
3. Retourne dans "Vue d'ensemble" → Mode "Custom" est actif ⚙️
4. Sauvegarde la configuration

#### Désactiver le Mode Custom

Pour sortir du mode Custom, sélectionne n'importe quelle stratégie prédéfinie dans la Vue d'ensemble :
- Aucune Protection
- Stealth Seul
- CAPTCHA + Stealth
- Proxies + Stealth
- Mode HYBRID

**⚠️ Note** : Les configurations Custom ne sont pas recommandées car certaines combinaisons peuvent être inefficaces (ex: CAPTCHA seul sans Stealth).

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

### Comparaison des Résultats (Tests du 10/12/2025)

| Configuration | Pages Jaunes | Google Maps | Notes |
|---------------|--------------|-------------|-------|
| NONE (baseline) | ❌ 0/50 | ❌ 0/50 | Bloqué immédiatement |
| STEALTH seul | ✅ **50/50 (100%)** | ✅ **44/50 (88%)** | **VPN désactivé requis** |
| PROXIES (payants) | À tester | À tester | Nécessite credentials |
| HYBRID (Proxies+Stealth) | À tester | À tester | Efficacité maximale attendue |

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

| Budget | Configuration Recommandée | Efficacité |
|--------|---------------------------|------------|
| **Gratuit** | STEALTH seul (sans VPN) | ✅ **Pages Jaunes: 100%**, Google Maps: 88% |
| **$75-$200/mois** | SmartProxy + STEALTH | Amélioration Google Maps attendue |
| **$300-$600/mois** | Oxylabs ou BrightData + STEALTH | Efficacité maximale |
| **$500+/mois** | HYBRID (BrightData + STEALTH + CAPTCHA solver) | Redondance complète |

**✅ Recommandation MVP** : Le mode **STEALTH seul est suffisant** pour Pages Jaunes (100%) et Google Maps (88%) sans coût supplémentaire.

---

## Prochaines Étapes

### Phase 1: Implémentation Proxies (✅ COMPLÉTÉE)
- [x] Configuration antiBotConfig.js
- [x] Service ProxyManager
- [x] Intégration PlaywrightService
- [x] Tests avec proxies gratuits (résultat: inefficaces)
- [x] Documentation complète
- [ ] Tests avec proxies payants (EN ATTENTE - nécessite credentials)

### Phase 2: CAPTCHA Solver (✅ COMPLÉTÉE)
- [x] Service CaptchaSolverService avec support multi-providers
- [x] Détection automatique CAPTCHA (reCAPTCHA v2/v3, hCaptcha, Image)
- [x] Intégration API 2Captcha, Anti-Captcha, CapMonster
- [x] Tests de résolution avec script dédié
- [x] Gestion des timeouts et retry
- [x] Documentation complète (CAPTCHA_SOLVER.md)
- [ ] Intégration dans pagesJaunesScraper.js (À FAIRE)

### Phase 3: Stealth Avancé (✅ COMPLÉTÉE)
- [x] Service StealthService avec masquage avancé (14 indicateurs)
- [x] Profil navigateur persistant (cookies, localStorage)
- [x] Headers HTTP dynamiques et réalistes (sec-ch-ua, etc.)
- [x] Comportements humains (scroll aléatoire, delays, mouvements souris)
- [x] User-Agents et viewports aléatoires
- [x] Canvas et WebGL fingerprinting masqués
- [x] Intégration dans PlaywrightService
- [x] Tests d'efficacité (93% des détections masquées)

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
