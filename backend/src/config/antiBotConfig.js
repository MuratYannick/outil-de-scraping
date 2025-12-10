/**
 * Configuration des stratégies anti-bot pour le scraping
 * Support de configuration PAR SCRAPER
 */

import dotenv from 'dotenv';
dotenv.config();

/**
 * Types de stratégies anti-bot disponibles
 */
export const ANTIBOT_STRATEGIES = {
  NONE: 'none',                    // Aucune protection (mode test)
  PROXIES: 'proxies',              // Rotation de proxies résidentiels
  CAPTCHA_SOLVER: 'captcha_solver', // Résolution automatique de CAPTCHA
  STEALTH: 'stealth',              // Masquage amélioré (profil navigateur, headers)
  HYBRID: 'hybrid',                // Combinaison de plusieurs stratégies
  CUSTOM: 'custom'                 // Configuration personnalisée (automatique)
};

/**
 * Identifiants des scrapers disponibles
 */
export const SCRAPER_IDS = {
  PAGES_JAUNES: 'pagesJaunes',
  GOOGLE_MAPS: 'googleMaps',
  LINKEDIN: 'linkedin'
};

/**
 * Crée une configuration anti-bot par défaut pour un scraper
 * @param {string} defaultStrategy - Stratégie par défaut
 * @returns {Object} Configuration par défaut
 */
function createDefaultScraperConfig(defaultStrategy = ANTIBOT_STRATEGIES.NONE) {
  return {
    activeStrategy: defaultStrategy,

    // Configuration des proxies résidentiels (Option 1)
    proxies: {
      enabled: false,
      provider: null, // 'brightdata', 'oxylabs', 'smartproxy', 'custom'
      customList: [], // Liste de proxies pour provider 'custom'
      rotation: 'round-robin', // 'round-robin', 'random'
      rotateOnError: true,
      maxRetries: 3,
      timeout: 30000,
      testBeforeUse: false
    },

    // Configuration résolution CAPTCHA (Option 2)
    captchaSolver: {
      enabled: false,
      provider: null, // '2captcha', 'anticaptcha', 'capmonster'
      apiKey: null,
      autoDetect: true,
      maxRetries: 3,
      logResults: true
    },

    // Configuration masquage amélioré (Option 3)
    stealth: {
      enabled: false,
      persistentProfile: {
        enabled: true,
        path: './browser-profiles/default'
      },
      humanBehavior: {
        enabled: true,
        randomScrolling: true,
        randomMouseMovement: false,
        randomDelays: true,
        minDelay: 1000,
        maxDelay: 3000
      },
      stealthPlugin: {
        enabled: true,
        evasions: [
          'chrome.app', 'chrome.csi', 'chrome.loadTimes', 'chrome.runtime',
          'iframe.contentWindow', 'media.codecs', 'navigator.hardwareConcurrency',
          'navigator.languages', 'navigator.permissions', 'navigator.plugins',
          'navigator.webdriver', 'sourceurl', 'webgl.vendor', 'window.outerdimensions'
        ]
      },
      canvasFingerprint: {
        enabled: true,
        randomize: true
      },
      webrtc: {
        enabled: true,
        blockLeaks: true
      }
    },

    // Configuration hybride (combine plusieurs stratégies)
    hybrid: {
      enabled: false,
      strategies: [
        ANTIBOT_STRATEGIES.STEALTH,
        ANTIBOT_STRATEGIES.PROXIES
      ],
      fallbackToCaptchaSolver: true,
      autoEnableSubStrategies: true
    }
  };
}

/**
 * Configuration globale des stratégies anti-bot PAR SCRAPER
 */
export const antiBotConfig = {
  // Configuration par scraper
  scrapers: {
    // Pages Jaunes - Protection maximale recommandée
    [SCRAPER_IDS.PAGES_JAUNES]: createDefaultScraperConfig(
      process.env.ANTIBOT_STRATEGY_PAGES_JAUNES || ANTIBOT_STRATEGIES.NONE
    ),

    // Google Maps - Protection modérée (API disponible en alternative)
    [SCRAPER_IDS.GOOGLE_MAPS]: createDefaultScraperConfig(
      process.env.ANTIBOT_STRATEGY_GOOGLE_MAPS || ANTIBOT_STRATEGIES.NONE
    ),

    // LinkedIn - Protection maximale + rate limiting agressif
    [SCRAPER_IDS.LINKEDIN]: createDefaultScraperConfig(
      process.env.ANTIBOT_STRATEGY_LINKEDIN || ANTIBOT_STRATEGIES.NONE
    )
  },

  // Configuration partagée des providers de proxies
  sharedProviders: {
    proxies: {
      // Configuration BrightData (anciennement Luminati)
      brightdata: {
        host: process.env.BRIGHTDATA_HOST || null,
        port: parseInt(process.env.BRIGHTDATA_PORT || '22225', 10),
        username: process.env.BRIGHTDATA_USERNAME || null,
        password: process.env.BRIGHTDATA_PASSWORD || null,
        country: process.env.BRIGHTDATA_COUNTRY || 'fr',
        session_id: Math.random().toString(36).substring(7)
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
      }
    },

    // Configuration partagée des providers CAPTCHA
    captchaSolver: {
      // Configuration 2Captcha
      '2captcha': {
        apiKey: process.env.TWOCAPTCHA_API_KEY || null,
        timeout: 120000,
        pollingInterval: 5000
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
      }
    },

    // En-têtes HTTP réalistes partagés
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
    }
  },

  // Logging et monitoring global
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
    logProxyChanges: true,
    logCaptchaDetection: true,
    logStealthEvents: false
  }
};

/**
 * Récupère la configuration d'un scraper spécifique
 * @param {string} scraperId - ID du scraper (SCRAPER_IDS.*)
 * @returns {Object} Configuration du scraper
 */
export function getScraperConfig(scraperId) {
  if (!antiBotConfig.scrapers[scraperId]) {
    console.warn(`[AntiBotConfig] Scraper inconnu: ${scraperId}, utilisation de pagesJaunes par défaut`);
    return antiBotConfig.scrapers[SCRAPER_IDS.PAGES_JAUNES];
  }
  return antiBotConfig.scrapers[scraperId];
}

/**
 * Met à jour la configuration d'un scraper spécifique
 * @param {string} scraperId - ID du scraper
 * @param {Object} config - Nouvelle configuration (partielle)
 */
export function updateScraperConfig(scraperId, config) {
  if (!antiBotConfig.scrapers[scraperId]) {
    throw new Error(`Scraper inconnu: ${scraperId}`);
  }

  // Merge la config existante avec la nouvelle
  antiBotConfig.scrapers[scraperId] = {
    ...antiBotConfig.scrapers[scraperId],
    ...config
  };

  console.log(`[AntiBotConfig] Configuration mise à jour pour ${scraperId}:`, config.activeStrategy);
}

/**
 * Récupère la configuration de la stratégie active d'un scraper
 * @param {string} scraperId - ID du scraper
 * @returns {Object} Configuration de la stratégie
 */
export function getActiveStrategyConfig(scraperId) {
  const scraperConfig = getScraperConfig(scraperId);
  const strategy = scraperConfig.activeStrategy;

  switch (strategy) {
    case ANTIBOT_STRATEGIES.PROXIES:
      return {
        type: strategy,
        config: scraperConfig.proxies
      };

    case ANTIBOT_STRATEGIES.CAPTCHA_SOLVER:
      return {
        type: strategy,
        config: scraperConfig.captchaSolver
      };

    case ANTIBOT_STRATEGIES.STEALTH:
      return {
        type: strategy,
        config: scraperConfig.stealth
      };

    case ANTIBOT_STRATEGIES.HYBRID:
      return {
        type: strategy,
        config: scraperConfig.hybrid
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
 * Valide la configuration d'une stratégie pour un scraper
 * @param {string} scraperId - ID du scraper
 * @param {string} strategy - Type de stratégie (optionnel, utilise activeStrategy si non fourni)
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateStrategyConfig(scraperId, strategy = null) {
  const scraperConfig = getScraperConfig(scraperId);
  const strategyToValidate = strategy || scraperConfig.activeStrategy;
  const errors = [];

  switch (strategyToValidate) {
    case ANTIBOT_STRATEGIES.PROXIES:
      if (!scraperConfig.proxies.enabled) {
        errors.push('Proxies strategy selected but not enabled');
      }
      if (!scraperConfig.proxies.provider) {
        errors.push('No proxy provider configured');
      }
      break;

    case ANTIBOT_STRATEGIES.CAPTCHA_SOLVER:
      if (!scraperConfig.captchaSolver.enabled) {
        errors.push('CAPTCHA solver strategy selected but not enabled');
      }
      if (!scraperConfig.captchaSolver.provider) {
        errors.push('No CAPTCHA solver provider configured');
      }
      break;

    case ANTIBOT_STRATEGIES.STEALTH:
      if (!scraperConfig.stealth.enabled) {
        errors.push('Stealth strategy selected but not enabled');
      }
      break;

    case ANTIBOT_STRATEGIES.HYBRID:
      if (!scraperConfig.hybrid.enabled) {
        errors.push('Hybrid strategy selected but not enabled');
      }
      if (scraperConfig.hybrid.strategies.length === 0) {
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
 * Active automatiquement les sous-stratégies si le mode HYBRID est actif pour un scraper
 * @param {string} scraperId - ID du scraper
 * @returns {boolean} True si le mode HYBRID est actif
 */
export function enableHybridMode(scraperId) {
  const scraperConfig = getScraperConfig(scraperId);
  const isHybrid = scraperConfig.activeStrategy === ANTIBOT_STRATEGIES.HYBRID;

  if (isHybrid && scraperConfig.hybrid.autoEnableSubStrategies) {
    // Activer Stealth (toujours gratuit)
    if (scraperConfig.hybrid.strategies.includes(ANTIBOT_STRATEGIES.STEALTH)) {
      scraperConfig.stealth.enabled = true;
      console.log(`[AntiBotConfig:${scraperId}] ✓ Stealth mode activé (HYBRID)`);
    }

    // Activer Proxies si configurés
    if (scraperConfig.hybrid.strategies.includes(ANTIBOT_STRATEGIES.PROXIES) &&
        scraperConfig.proxies.provider) {
      scraperConfig.proxies.enabled = true;
      console.log(`[AntiBotConfig:${scraperId}] ✓ Proxies activés (HYBRID)`);
    }

    // Activer CAPTCHA solver si configuré et demandé en fallback
    if (scraperConfig.hybrid.fallbackToCaptchaSolver &&
        scraperConfig.captchaSolver.provider) {
      scraperConfig.captchaSolver.enabled = true;
      console.log(`[AntiBotConfig:${scraperId}] ✓ CAPTCHA Solver activé en fallback (HYBRID)`);
    }

    console.log(`[AntiBotConfig:${scraperId}] ✓ Mode HYBRID complètement activé`);
    return true;
  }

  return false;
}

/**
 * Active la stratégie correspondant à activeStrategy
 * @param {string} scraperId - ID du scraper
 */
export function enableActiveStrategy(scraperId) {
  const scraperConfig = getScraperConfig(scraperId);
  const activeStrategy = scraperConfig.activeStrategy;

  console.log(`[AntiBotConfig:${scraperId}] Activation de la stratégie: ${activeStrategy}`);

  switch (activeStrategy) {
    case ANTIBOT_STRATEGIES.STEALTH:
      scraperConfig.stealth.enabled = true;
      console.log(`[AntiBotConfig:${scraperId}] ✓ Stealth mode activé`);
      break;

    case ANTIBOT_STRATEGIES.PROXIES:
      scraperConfig.proxies.enabled = true;
      console.log(`[AntiBotConfig:${scraperId}] ✓ Proxies activés`);
      break;

    case ANTIBOT_STRATEGIES.CAPTCHA_SOLVER:
      scraperConfig.captchaSolver.enabled = true;
      console.log(`[AntiBotConfig:${scraperId}] ✓ CAPTCHA Solver activé`);
      break;

    case ANTIBOT_STRATEGIES.HYBRID:
      // Le mode HYBRID est géré par enableHybridMode()
      break;

    case ANTIBOT_STRATEGIES.NONE:
    default:
      console.log(`[AntiBotConfig:${scraperId}] ⚠️  Aucune stratégie anti-bot active`);
      break;
  }
}

/**
 * Vérifie si une stratégie spécifique est active pour un scraper (mode direct ou HYBRID)
 * @param {string} scraperId - ID du scraper
 * @param {string} strategy - Type de stratégie à vérifier
 * @returns {boolean} True si la stratégie est active
 */
export function isStrategyActive(scraperId, strategy) {
  const scraperConfig = getScraperConfig(scraperId);

  // Si la stratégie est directement sélectionnée
  if (scraperConfig.activeStrategy === strategy) {
    return true;
  }

  // Si on est en mode HYBRID, vérifier si la stratégie est dans la liste
  if (scraperConfig.activeStrategy === ANTIBOT_STRATEGIES.HYBRID) {
    return scraperConfig.hybrid.strategies.includes(strategy);
  }

  return false;
}

/**
 * Récupère la configuration des providers partagés
 * @param {string} type - Type de provider ('proxies' ou 'captchaSolver')
 * @param {string} providerName - Nom du provider (ex: 'brightdata', '2captcha')
 * @returns {Object} Configuration du provider
 */
export function getSharedProviderConfig(type, providerName) {
  return antiBotConfig.sharedProviders[type]?.[providerName] || null;
}

export default antiBotConfig;
