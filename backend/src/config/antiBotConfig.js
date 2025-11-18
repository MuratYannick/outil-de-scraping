/**
 * Configuration des stratégies anti-bot pour le scraping
 * Permet de configurer différentes méthodes de contournement
 */

/**
 * Types de stratégies anti-bot disponibles
 */
export const ANTIBOT_STRATEGIES = {
  NONE: 'none',                    // Aucune protection (mode test)
  PROXIES: 'proxies',              // Rotation de proxies résidentiels
  CAPTCHA_SOLVER: 'captcha_solver', // Résolution automatique de CAPTCHA
  STEALTH: 'stealth',              // Masquage amélioré (profil navigateur, headers)
  HYBRID: 'hybrid'                 // Combinaison de plusieurs stratégies
};

/**
 * Configuration globale des stratégies anti-bot
 */
export const antiBotConfig = {
  // Stratégie active (peut être changée via panneau de configuration)
  activeStrategy: process.env.ANTIBOT_STRATEGY || ANTIBOT_STRATEGIES.NONE,

  // Configuration des proxies résidentiels (Option 1)
  proxies: {
    enabled: process.env.PROXY_ENABLED === 'true',
    provider: process.env.PROXY_PROVIDER || null, // 'brightdata', 'oxylabs', 'smartproxy', 'custom'

    // Configuration BrightData (anciennement Luminati)
    brightdata: {
      host: process.env.BRIGHTDATA_HOST || null,
      port: parseInt(process.env.BRIGHTDATA_PORT || '22225', 10),
      username: process.env.BRIGHTDATA_USERNAME || null,
      password: process.env.BRIGHTDATA_PASSWORD || null,
      country: process.env.BRIGHTDATA_COUNTRY || 'fr', // Pays des IPs résidentielles
      session_id: Math.random().toString(36).substring(7) // Session unique
    },

    // Configuration Oxylabs
    oxylabs: {
      host: process.env.OXYLABS_HOST || null,
      port: parseInt(process.env.OXYLABS_PORT || '7777', 10),
      username: process.env.OXYLABS_USERNAME || null,
      password: process.env.OXYLABS_PASSWORD || null,
      country: process.env.OXYLABS_COUNTRY || 'fr'
    },

    // Configuration SmartProxy
    smartproxy: {
      host: process.env.SMARTPROXY_HOST || null,
      port: parseInt(process.env.SMARTPROXY_PORT || '10000', 10),
      username: process.env.SMARTPROXY_USERNAME || null,
      password: process.env.SMARTPROXY_PASSWORD || null,
      country: process.env.SMARTPROXY_COUNTRY || 'fr'
    },

    // Configuration personnalisée (liste de proxies)
    custom: {
      list: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : [],
      // Format: "http://user:pass@host:port" ou "http://host:port"
      rotation: process.env.PROXY_ROTATION || 'round-robin' // 'round-robin', 'random'
    },

    // Options générales
    rotateOnError: true,        // Changer de proxy en cas d'erreur
    maxRetries: 3,               // Nombre de tentatives avant d'abandonner
    timeout: 30000,              // Timeout des requêtes avec proxy (ms)
    testBeforeUse: false         // Tester le proxy avant utilisation
  },

  // Configuration résolution CAPTCHA (Option 2)
  captchaSolver: {
    enabled: process.env.CAPTCHA_SOLVER_ENABLED === 'true',
    provider: process.env.CAPTCHA_SOLVER_PROVIDER || null, // '2captcha', 'anticaptcha', 'capmonster'

    // Configuration 2Captcha
    '2captcha': {
      apiKey: process.env.TWOCAPTCHA_API_KEY || null,
      timeout: 120000, // Timeout pour résolution (ms)
      pollingInterval: 5000 // Intervalle de vérification (ms)
    },

    // Configuration Anti-Captcha
    anticaptcha: {
      apiKey: process.env.ANTICAPTCHA_API_KEY || null,
      timeout: 120000,
      pollingInterval: 5000
    },

    // Configuration CapMonster
    capmonster: {
      apiKey: process.env.CAPMONSTER_API_KEY || null,
      timeout: 120000,
      pollingInterval: 5000
    },

    // Options générales
    autoDetect: true,           // Détection automatique des CAPTCHA
    maxRetries: 3,              // Tentatives de résolution
    logResults: true            // Logger les résultats (succès/échec)
  },

  // Configuration masquage amélioré (Option 3)
  stealth: {
    enabled: process.env.STEALTH_ENABLED === 'true',

    // Profil de navigateur persistant
    persistentProfile: {
      enabled: true,
      path: process.env.BROWSER_PROFILE_PATH || './browser-profiles/default'
    },

    // En-têtes HTTP réalistes
    realisticHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    },

    // Patterns de comportement humain
    humanBehavior: {
      enabled: true,
      randomScrolling: true,      // Scroll aléatoire
      randomMouseMovement: false, // Mouvements de souris (coûteux en perf)
      randomDelays: true,         // Delays aléatoires
      minDelay: 1000,
      maxDelay: 3000
    },

    // Plugins stealth
    stealthPlugin: {
      enabled: true,
      // playwright-extra et ses plugins
      evasions: [
        'chrome.app',
        'chrome.csi',
        'chrome.loadTimes',
        'chrome.runtime',
        'iframe.contentWindow',
        'media.codecs',
        'navigator.hardwareConcurrency',
        'navigator.languages',
        'navigator.permissions',
        'navigator.plugins',
        'navigator.webdriver',
        'sourceurl',
        'webgl.vendor',
        'window.outerdimensions'
      ]
    },

    // Canvas fingerprinting protection
    canvasFingerprint: {
      enabled: true,
      randomize: true
    },

    // WebRTC leak protection
    webrtc: {
      enabled: true,
      blockLeaks: true
    }
  },

  // Configuration hybride (combine plusieurs stratégies)
  hybrid: {
    enabled: process.env.ANTIBOT_STRATEGY === 'hybrid',
    strategies: [
      ANTIBOT_STRATEGIES.STEALTH,    // Toujours activer Stealth en premier
      ANTIBOT_STRATEGIES.PROXIES     // Puis les proxies si disponibles
    ],
    // Si un CAPTCHA est détecté, passer automatiquement au solver
    fallbackToCaptchaSolver: true,
    // Active automatiquement les sous-stratégies
    autoEnableSubStrategies: true
  },

  // Logging et monitoring
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
    logProxyChanges: true,
    logCaptchaDetection: true,
    logStealthEvents: false // Peut être verbeux
  }
};

/**
 * Récupère la configuration de la stratégie active
 * @returns {Object} Configuration de la stratégie
 */
export function getActiveStrategyConfig() {
  const strategy = antiBotConfig.activeStrategy;

  switch (strategy) {
    case ANTIBOT_STRATEGIES.PROXIES:
      return {
        type: strategy,
        config: antiBotConfig.proxies
      };

    case ANTIBOT_STRATEGIES.CAPTCHA_SOLVER:
      return {
        type: strategy,
        config: antiBotConfig.captchaSolver
      };

    case ANTIBOT_STRATEGIES.STEALTH:
      return {
        type: strategy,
        config: antiBotConfig.stealth
      };

    case ANTIBOT_STRATEGIES.HYBRID:
      return {
        type: strategy,
        config: antiBotConfig.hybrid
      };

    case ANTIBOT_STRATEGIES.NONE:
    default:
      return {
        type: ANTIBOT_STRATEGIES.NONE,
        config: {}
      };
  }
}

/**
 * Valide la configuration d'une stratégie
 * @param {string} strategy - Type de stratégie
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateStrategyConfig(strategy) {
  const errors = [];

  switch (strategy) {
    case ANTIBOT_STRATEGIES.PROXIES:
      if (!antiBotConfig.proxies.enabled) {
        errors.push('Proxies strategy selected but not enabled');
      }
      if (!antiBotConfig.proxies.provider) {
        errors.push('No proxy provider configured');
      }
      break;

    case ANTIBOT_STRATEGIES.CAPTCHA_SOLVER:
      if (!antiBotConfig.captchaSolver.enabled) {
        errors.push('CAPTCHA solver strategy selected but not enabled');
      }
      if (!antiBotConfig.captchaSolver.provider) {
        errors.push('No CAPTCHA solver provider configured');
      }
      break;

    case ANTIBOT_STRATEGIES.STEALTH:
      if (!antiBotConfig.stealth.enabled) {
        errors.push('Stealth strategy selected but not enabled');
      }
      break;

    case ANTIBOT_STRATEGIES.HYBRID:
      if (!antiBotConfig.hybrid.enabled) {
        errors.push('Hybrid strategy selected but not enabled');
      }
      if (antiBotConfig.hybrid.strategies.length === 0) {
        errors.push('Hybrid strategy has no sub-strategies configured');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Active automatiquement les sous-stratégies si le mode HYBRID est actif
 * @returns {boolean} True si le mode HYBRID est actif
 */
export function enableHybridMode() {
  const isHybrid = antiBotConfig.activeStrategy === ANTIBOT_STRATEGIES.HYBRID;

  if (isHybrid && antiBotConfig.hybrid.autoEnableSubStrategies) {
    // Activer Stealth (toujours gratuit)
    if (antiBotConfig.hybrid.strategies.includes(ANTIBOT_STRATEGIES.STEALTH)) {
      antiBotConfig.stealth.enabled = true;
      console.log('[AntiBotConfig] ✓ Stealth mode activé (HYBRID)');
    }

    // Activer Proxies si configurés
    if (antiBotConfig.hybrid.strategies.includes(ANTIBOT_STRATEGIES.PROXIES) &&
        antiBotConfig.proxies.provider) {
      antiBotConfig.proxies.enabled = true;
      console.log('[AntiBotConfig] ✓ Proxies activés (HYBRID)');
    }

    // Activer CAPTCHA solver si configuré et demandé en fallback
    if (antiBotConfig.hybrid.fallbackToCaptchaSolver &&
        antiBotConfig.captchaSolver.provider) {
      antiBotConfig.captchaSolver.enabled = true;
      console.log('[AntiBotConfig] ✓ CAPTCHA Solver activé en fallback (HYBRID)');
    }

    console.log('[AntiBotConfig] ✓ Mode HYBRID complètement activé');
    return true;
  }

  return false;
}

/**
 * Vérifie si une stratégie spécifique est active (mode direct ou HYBRID)
 * @param {string} strategy - Type de stratégie à vérifier
 * @returns {boolean} True si la stratégie est active
 */
export function isStrategyActive(strategy) {
  // Si la stratégie est directement sélectionnée
  if (antiBotConfig.activeStrategy === strategy) {
    return true;
  }

  // Si on est en mode HYBRID, vérifier si la stratégie est dans la liste
  if (antiBotConfig.activeStrategy === ANTIBOT_STRATEGIES.HYBRID) {
    return antiBotConfig.hybrid.strategies.includes(strategy);
  }

  return false;
}

export default antiBotConfig;
