# 🤖 Guide du CAPTCHA Solver

**Dernière mise à jour** : 14 novembre 2025

Ce document explique comment configurer et utiliser le système de résolution automatique de CAPTCHA pour le scraping.

---

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Providers Supportés](#providers-supportés)
- [Configuration](#configuration)
- [Types de CAPTCHA Supportés](#types-de-captcha-supportés)
- [Utilisation](#utilisation)
- [Tests](#tests)
- [Coûts](#coûts)
- [Limitations](#limitations)

---

## Vue d'ensemble

Le système de résolution automatique de CAPTCHA permet de contourner les protections CAPTCHA lors du scraping. Il détecte automatiquement les CAPTCHA sur les pages web et les résout via des services tiers.

### Architecture

```
┌─────────────┐
│   Page Web  │
│  + CAPTCHA  │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ CaptchaSolverService │
│  - Détection auto    │
│  - Extraction siteKey│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Service Provider    │
│  (2Captcha, etc.)    │
│  - Résolution        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Injection Solution  │
│  dans la page        │
└──────────────────────┘
```

### Fonctionnalités

- ✅ **Détection automatique** : Identifie les CAPTCHA sur la page
- ✅ **Support multi-providers** : 2Captcha, Anti-Captcha, CapMonster
- ✅ **Types multiples** : reCAPTCHA v2/v3, hCaptcha, Image CAPTCHA
- ✅ **Injection automatique** : Injecte la solution dans la page
- ✅ **Retry et timeout** : Gestion robuste des échecs

---

## Providers Supportés

### 1. 2Captcha (Recommandé)

**Site** : https://2captcha.com
**Tarif** : ~$2.99 pour 1000 CAPTCHA

**Avantages** :
- ✅ Prix compétitif
- ✅ API simple et bien documentée
- ✅ Support de tous les types de CAPTCHA
- ✅ Temps de résolution rapide (10-40s)
- ✅ Extensions et plugins disponibles

**Inconvénients** :
- ⚠️ Qualité variable selon le type de CAPTCHA
- ⚠️ Peut être lent aux heures de pointe

**Configuration** :
```env
CAPTCHA_SOLVER_ENABLED=true
CAPTCHA_SOLVER_PROVIDER=2captcha
TWOCAPTCHA_API_KEY=votre_api_key_ici
```

### 2. Anti-Captcha

**Site** : https://anti-captcha.com
**Tarif** : ~$2.00 pour 1000 CAPTCHA

**Avantages** :
- ✅ Légèrement moins cher que 2Captcha
- ✅ Bonne qualité de résolution
- ✅ API RESTful moderne
- ✅ Dashboard clair

**Inconvénients** :
- ⚠️ Documentation moins complète
- ⚠️ Support client moins réactif

**Configuration** :
```env
CAPTCHA_SOLVER_ENABLED=true
CAPTCHA_SOLVER_PROVIDER=anticaptcha
ANTICAPTCHA_API_KEY=votre_api_key_ici
```

### 3. CapMonster

**Site** : https://capmonster.cloud
**Tarif** : ~$1.50 pour 1000 CAPTCHA (Le moins cher)

**Avantages** :
- ✅ Prix le plus bas
- ✅ Résolution rapide
- ✅ API compatible avec 2Captcha

**Inconvénients** :
- ⚠️ Service plus récent (moins établi)
- ⚠️ Moins de types de CAPTCHA supportés

**Configuration** :
```env
CAPTCHA_SOLVER_ENABLED=true
CAPTCHA_SOLVER_PROVIDER=capmonster
CAPMONSTER_API_KEY=votre_api_key_ici
```

---

## Configuration

### Fichier `.env`

```env
# ========================================
# CAPTCHA SOLVER CONFIGURATION
# ========================================

# Activer le CAPTCHA solver
CAPTCHA_SOLVER_ENABLED=true

# Provider: 2captcha | anticaptcha | capmonster
CAPTCHA_SOLVER_PROVIDER=2captcha

# API Keys (configurer celle du provider choisi)
TWOCAPTCHA_API_KEY=votre_api_key
ANTICAPTCHA_API_KEY=
CAPMONSTER_API_KEY=
```

### Options Avancées

Dans `backend/src/config/antiBotConfig.js`, vous pouvez configurer :

```javascript
captchaSolver: {
  enabled: true,
  provider: '2captcha',

  // Configuration 2Captcha
  '2captcha': {
    apiKey: process.env.TWOCAPTCHA_API_KEY,
    timeout: 120000,        // Timeout résolution (ms)
    pollingInterval: 5000   // Intervalle vérification (ms)
  },

  // Options générales
  autoDetect: true,         // Détection automatique
  maxRetries: 3,            // Tentatives de résolution
  logResults: true          // Logger les résultats
}
```

---

## Types de CAPTCHA Supportés

### 1. reCAPTCHA v2

**Description** : Le CAPTCHA classique "Je ne suis pas un robot" de Google

**Détection** :
- Recherche d'iframe `recaptcha/api2`
- Extraction automatique de la `siteKey`

**Résolution** :
- Temps moyen : 10-40 secondes
- Coût : ~$2.99/1000 avec 2Captcha

**Exemple de code** :
```javascript
const captchaInfo = await solverService.detectCaptcha(page);
// { type: 'recaptcha_v2', siteKey: '6Le...', pageUrl: 'https://...' }

const solution = await solverService.solveCaptcha(captchaInfo);
await solverService.injectSolution(page, solution, 'recaptcha_v2');
```

### 2. reCAPTCHA v3

**Description** : reCAPTCHA invisible avec score de confiance

**Détection** :
- Recherche de script `recaptcha/api.js`
- Extraction de la `siteKey` dans le code JavaScript

**Résolution** :
- Temps moyen : 15-50 secondes
- Coût : ~$2.99/1000
- Score minimum : 0.3 (configurable)

### 3. hCaptcha

**Description** : Alternative à reCAPTCHA

**Détection** :
- Recherche d'iframe `hcaptcha.com`
- Extraction de l'attribut `data-sitekey`

**Résolution** :
- Temps moyen : 10-40 secondes
- Coût : ~$2.99/1000

### 4. Image CAPTCHA

**Description** : CAPTCHA basé sur des images (texte distordu, etc.)

**Détection** :
- Recherche d'images avec `alt="captcha"` ou `src` contenant "captcha"

**Résolution** :
- Temps moyen : 5-20 secondes
- Coût : ~$0.50/1000 (moins cher)

---

## Utilisation

### Utilisation Basique

```javascript
import { getCaptchaSolverService } from './services/captchaSolverService.js';

const solverService = getCaptchaSolverService();
await solverService.initialize();

// Détecter un CAPTCHA
const captchaInfo = await solverService.detectCaptcha(page);

if (captchaInfo) {
  console.log('CAPTCHA détecté:', captchaInfo.type);

  // Résoudre le CAPTCHA
  const solution = await solverService.solveCaptcha(captchaInfo);

  // Injecter la solution
  await solverService.injectSolution(page, solution, captchaInfo.type);

  // Continuer le scraping
  await page.click('button[type="submit"]');
}
```

### Intégration avec le Scraper Pages Jaunes

```javascript
// Dans pagesJaunesScraper.js

async scrapePage(page, quoiqui, ou, pageNum) {
  const url = this._buildSearchUrl(quoiqui, ou, pageNum);
  await this.playwrightService.navigateToPage(page, url);

  // Vérifier si un CAPTCHA est présent
  if (antiBotConfig.captchaSolver.enabled) {
    const solverService = getCaptchaSolverService();
    const captchaInfo = await solverService.detectCaptcha(page);

    if (captchaInfo) {
      console.log('[Scraper] CAPTCHA détecté, résolution en cours...');
      const solution = await solverService.solveCaptcha(captchaInfo);
      await solverService.injectSolution(page, solution, captchaInfo.type);
      console.log('[Scraper] CAPTCHA résolu, continuation du scraping');
    }
  }

  // Extraire les prospects
  const prospects = await this._extractProspects(page);
  return prospects;
}
```

### Mode HYBRID (Proxies + CAPTCHA Solver)

```env
ANTIBOT_STRATEGY=hybrid

# Proxies résidentiels
PROXY_ENABLED=true
PROXY_PROVIDER=smartproxy
SMARTPROXY_USERNAME=...
SMARTPROXY_PASSWORD=...

# CAPTCHA Solver en fallback
CAPTCHA_SOLVER_ENABLED=true
CAPTCHA_SOLVER_PROVIDER=2captcha
TWOCAPTCHA_API_KEY=...
```

---

## Tests

### Test du Service CAPTCHA Solver

```bash
cd backend

# Test de détection et résolution
node scripts/test-captcha-solver.js
```

**Tests effectués** :
1. ✅ Configuration et initialisation
2. ✅ Détection de CAPTCHA sur page de test
3. ✅ Résolution du CAPTCHA (si API key configurée)
4. ✅ Statistiques du service

**Résultats attendus** :
```
📋 TEST 1: Configuration et initialisation
✅ Test 1 PASSÉ: Service initialisé

📋 TEST 2: Détection de CAPTCHA
✅ CAPTCHA Détecté:
   - Type: recaptcha_v2
   - Site Key: 6Le...

📋 TEST 3: Résolution du CAPTCHA
✅ CAPTCHA RÉSOLU!
   - Solution: 03AGdBq25...
```

### Test sur Pages Jaunes

Une fois configuré, tester sur Pages Jaunes :

```bash
# Activer CAPTCHA solver dans .env
# CAPTCHA_SOLVER_ENABLED=true

node scripts/test-pages-jaunes-scraper.js
```

---

## Coûts

### Comparaison des Providers

| Provider | Prix/1000 | Prix/10000 | Temps Moyen | Qualité |
|----------|-----------|------------|-------------|---------|
| **2Captcha** | $2.99 | $29.90 | 10-40s | ⭐⭐⭐⭐ |
| **Anti-Captcha** | $2.00 | $20.00 | 10-40s | ⭐⭐⭐⭐ |
| **CapMonster** | $1.50 | $15.00 | 10-40s | ⭐⭐⭐ |

### Estimation Pour Scraping Pages Jaunes

**Scénario** : Scraping de 1000 pages

- **Hypothèse** : 10% des pages ont un CAPTCHA = 100 CAPTCHA
- **Coût avec 2Captcha** : $0.30 (100 × $0.00299)
- **Coût avec CapMonster** : $0.15 (100 × $0.0015)

**Conclusion** : Le CAPTCHA solver est **très abordable** comparé aux proxies résidentiels.

### Budget Mensuel Recommandé

| Volume Scraping | CAPTCHA/mois | Coût (2Captcha) | Coût (CapMonster) |
|----------------|--------------|-----------------|-------------------|
| **Faible** (1000 pages) | 100 | $0.30 | $0.15 |
| **Moyen** (10000 pages) | 1000 | $3.00 | $1.50 |
| **Élevé** (100000 pages) | 10000 | $30.00 | $15.00 |

---

## Limitations

### Limitations Techniques

1. **Temps de résolution** :
   - ⏱️ 10-60 secondes par CAPTCHA
   - ⚠️ Ralentit le scraping

2. **Taux de succès** :
   - ✅ reCAPTCHA v2 : ~95%
   - ✅ reCAPTCHA v3 : ~90%
   - ⚠️ hCaptcha : ~85%

3. **Détection limitée** :
   - ❌ Ne détecte pas tous les types de CAPTCHA
   - ❌ CAPTCHA personnalisés non supportés

### Limitations des Providers

1. **API Rate Limits** :
   - 2Captcha : 20-50 requêtes/seconde
   - Anti-Captcha : 30 requêtes/seconde

2. **Disponibilité** :
   - ⚠️ Peut être lent aux heures de pointe
   - ⚠️ Dépend de workers humains pour certains types

3. **Coût** :
   - 💰 Coût récurrent par résolution
   - 💰 Nécessite des crédits prépayés

---

## Comparaison : CAPTCHA Solver vs Proxies

| Critère | CAPTCHA Solver | Proxies Résidentiels |
|---------|----------------|----------------------|
| **Coût** | ✅ $0.15-$3/1000 pages | ❌ $75-$200/mois |
| **Efficacité** | ⚠️ 85-95% | ✅ 95-99% |
| **Vitesse** | ❌ +10-60s/page | ✅ Pas de ralentissement |
| **Configuration** | ✅ Simple | ⚠️ Moyenne |
| **Maintenance** | ✅ Aucune | ⚠️ Rotation à gérer |

### Recommandation

**Utilisez le CAPTCHA Solver si** :
- ✅ Budget limité ($0-$10/mois)
- ✅ Pages Jaunes affiche principalement des CAPTCHA
- ✅ Volume de scraping faible à moyen

**Utilisez les Proxies si** :
- ✅ Budget plus élevé ($75-$200/mois)
- ✅ Pages Jaunes bloque par IP (pas de CAPTCHA)
- ✅ Volume de scraping élevé

**Utilisez le Mode HYBRID si** :
- ✅ Maximum d'efficacité souhaité (99%+)
- ✅ Budget confortable ($75-$220/mois)
- ✅ Blocage par IP + CAPTCHA

---

## Dépannage

### Erreur: "API Key manquante"

**Solution** :
```env
# Vérifier que l'API key est bien configurée
TWOCAPTCHA_API_KEY=votre_api_key
```

### Erreur: "Timeout: CAPTCHA non résolu"

**Causes possibles** :
1. Service provider surchargé
2. CAPTCHA trop complexe
3. Timeout trop court

**Solutions** :
```javascript
// Augmenter le timeout dans antiBotConfig.js
'2captcha': {
  timeout: 180000,  // 3 minutes au lieu de 2
}
```

### Erreur: "Crédit insuffisant"

**Solution** :
- Recharger votre compte provider
- Vérifier le solde sur le dashboard

### CAPTCHA Non Détecté

**Causes possibles** :
1. Type de CAPTCHA non supporté
2. CAPTCHA chargé dynamiquement

**Solutions** :
```javascript
// Attendre le chargement complet
await page.waitForTimeout(2000);
const captchaInfo = await solverService.detectCaptcha(page);
```

---

## Prochaines Étapes

### Phase 2: CAPTCHA Solver (✅ COMPLÉTÉE)
- [x] Service CaptchaSolverService
- [x] Support 2Captcha, Anti-Captcha, CapMonster
- [x] Détection automatique (reCAPTCHA v2/v3, hCaptcha, Image)
- [x] Script de test
- [x] Documentation complète

### Intégration avec Pages Jaunes (📋 À FAIRE)
- [ ] Intégrer la détection CAPTCHA dans pagesJaunesScraper.js
- [ ] Tester sur Pages Jaunes réel
- [ ] Mesurer le taux de succès
- [ ] Combiner avec proxies en mode HYBRID

---

**Dernière mise à jour** : 14 novembre 2025
**Version** : 1.0.0 (Phase 2 - CAPTCHA Solver implémenté)
