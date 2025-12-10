import { chromium } from "playwright";
import { getProxyManager } from "./proxyManager.js";
import { getStealthService } from "./stealthService.js";
import { getSessionManager } from "./sessionManager.js";
import { getRateLimiter, RATE_LIMIT_PATTERNS } from "./rateLimiter.js";
import { getHumanBehavior } from "./humanBehavior.js";
import { delay, randomDelay } from "../utils/timingUtils.js";
import {
  SCRAPER_IDS,
  ANTIBOT_STRATEGIES,
  getScraperConfig,
  enableActiveStrategy,
  enableHybridMode,
  isStrategyActive
} from "../config/antiBotConfig.js";

/**
 * Service de gestion de Playwright pour le scraping PAR SCRAPER
 * Gère le pool de browser contexts, retry, logging et configuration
 */

// Configuration par défaut
const DEFAULT_CONFIG = {
  headless: process.env.PLAYWRIGHT_HEADLESS === "true",
  timeout: parseInt(process.env.REQUEST_TIMEOUT || "30000", 10),
  maxRetries: 3,
  retryDelay: 2000,
  maxConcurrentContexts: 3,
  viewport: {
    width: 1920,
    height: 1080,
  },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

class PlaywrightService {
  constructor(scraperId = SCRAPER_IDS.PAGES_JAUNES, config = {}) {
    this.scraperId = scraperId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.browser = null;
    this.contexts = [];
    this.isInitialized = false;
    this.proxyManager = null;
    this.currentProxy = null;
    this.stealthService = null;
    this.sessionManager = null;
    this.rateLimiter = null;
    this.humanBehavior = null;
  }

  /**
   * Initialise le browser Playwright avec la config du scraper spécifique
   */
  async initialize() {
    if (this.isInitialized) {
      console.log(`[PlaywrightService:${this.scraperId}] Déjà initialisé`);
      return;
    }

    try {
      // Récupérer la configuration du scraper spécifique
      const scraperConfig = getScraperConfig(this.scraperId);

      console.log(`[PlaywrightService:${this.scraperId}] Initialisation du browser...`);
      console.log(`[PlaywrightService:${this.scraperId}] Stratégie anti-bot: ${scraperConfig.activeStrategy}`);

      // Activer la stratégie correspondante (stealth, proxies, captcha, etc.)
      enableActiveStrategy(this.scraperId);

      // Activer le mode HYBRID si nécessaire (active automatiquement les sous-stratégies)
      const isHybrid = enableHybridMode(this.scraperId);
      if (isHybrid) {
        console.log(`[PlaywrightService:${this.scraperId}] ⚡ Mode HYBRID activé - Combinaison de plusieurs stratégies`);
      }

      // Initialiser le gestionnaire de proxies si activé (direct ou via HYBRID)
      if (isStrategyActive(this.scraperId, ANTIBOT_STRATEGIES.PROXIES) && scraperConfig.proxies.enabled) {
        console.log(`[PlaywrightService:${this.scraperId}] 🔄 Initialisation du gestionnaire de proxies...`);
        this.proxyManager = getProxyManager();
        await this.proxyManager.initialize();
        console.log(`[PlaywrightService:${this.scraperId}] ✓ Proxies prêts`);
      }

      // Initialiser le service Stealth si activé (direct ou via HYBRID)
      if (isStrategyActive(this.scraperId, ANTIBOT_STRATEGIES.STEALTH) && scraperConfig.stealth.enabled) {
        console.log(`[PlaywrightService:${this.scraperId}] 🥷 Initialisation du service Stealth...`);
        this.stealthService = getStealthService();
        await this.stealthService.initialize(this.scraperId);
        console.log(`[PlaywrightService:${this.scraperId}] ✓ Stealth mode prêt`);
      }

      // Initialiser le SessionManager (toujours actif)
      console.log(`[PlaywrightService:${this.scraperId}] 💾 Initialisation du SessionManager...`);
      this.sessionManager = getSessionManager();
      await this.sessionManager.initialize();
      console.log(`[PlaywrightService:${this.scraperId}] ✓ SessionManager prêt`);

      // Initialiser le RateLimiter avec pattern adapté
      const rateLimitPattern = isHybrid ? RATE_LIMIT_PATTERNS.HUMAN : RATE_LIMIT_PATTERNS.NORMAL;
      console.log(`[PlaywrightService:${this.scraperId}] ⏱️ Initialisation du RateLimiter (${rateLimitPattern})...`);
      this.rateLimiter = getRateLimiter(rateLimitPattern);
      console.log(`[PlaywrightService:${this.scraperId}] ✓ RateLimiter prêt`);

      // Initialiser le HumanBehavior (toujours actif)
      console.log(`[PlaywrightService:${this.scraperId}] 🤖 Initialisation du HumanBehavior...`);
      this.humanBehavior = getHumanBehavior();
      console.log(`[PlaywrightService:${this.scraperId}] ✓ HumanBehavior prêt`);

      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
        ],
      });

      this.isInitialized = true;

      // Afficher le résumé des stratégies actives
      const activeStrategies = [];
      if (this.stealthService) activeStrategies.push('Stealth');
      if (this.proxyManager) activeStrategies.push('Proxies');

      console.log(
        `[PlaywrightService:${this.scraperId}] ✓ Browser initialisé (headless: ${this.config.headless})`
      );
      if (activeStrategies.length > 0) {
        console.log(
          `[PlaywrightService:${this.scraperId}] ✓ Stratégies actives: ${activeStrategies.join(' + ')}`
        );
      }
    } catch (error) {
      console.error(`[PlaywrightService:${this.scraperId}] ❌ Erreur initialisation:`, error);
      throw new Error(`Impossible d'initialiser Playwright: ${error.message}`);
    }
  }

  /**
   * Crée un nouveau browser context avec la configuration anti-détection
   * @param {Object} options - Options additionnelles pour le context
   */
  async createContext(options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.contexts.length >= this.config.maxConcurrentContexts) {
      console.warn(
        `[PlaywrightService] ⚠️ Maximum de contexts atteint (${this.config.maxConcurrentContexts})`
      );
      // Fermer le plus ancien context
      const oldestContext = this.contexts.shift();
      await oldestContext.close();
    }

    try {
      // Utiliser HumanBehavior pour User-Agent cohérent
      let userAgent = this.config.userAgent;
      let viewport = this.config.viewport;
      let extraHTTPHeaders = {
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      };

      if (this.humanBehavior) {
        const ua = this.humanBehavior.selectUserAgent();
        userAgent = ua.userAgent;
        viewport = this.humanBehavior.getConsistentViewport();
        extraHTTPHeaders = this.humanBehavior.getConsistentHeaders();
        console.log("[PlaywrightService] ✓ User-Agent cohérent généré");
      }

      // Configuration de base
      let contextConfig = {
        viewport,
        userAgent,
        locale: "fr-FR",
        timezoneId: "Europe/Paris",
        permissions: [],
        extraHTTPHeaders,
        // Désactiver les indicateurs d'automatisation
        javaScriptEnabled: true,
        ...options
      };

      // Enrichir avec Stealth si activé
      if (this.stealthService) {
        contextConfig = this.stealthService.enrichContextOptions(contextConfig);
        console.log("[PlaywrightService] ✓ Configuration Stealth appliquée");
      }

      // Ajouter le proxy si disponible
      if (this.proxyManager) {
        this.currentProxy = this.proxyManager.getNextProxy();
        if (this.currentProxy) {
          contextConfig.proxy = {
            server: this.currentProxy.server
          };

          // Ajouter username/password seulement s'ils existent
          if (this.currentProxy.username) {
            contextConfig.proxy.username = this.currentProxy.username;
          }
          if (this.currentProxy.password) {
            contextConfig.proxy.password = this.currentProxy.password;
          }
        }
      }

      const context = await this.browser.newContext(contextConfig);

      // Appliquer le masquage Stealth si activé
      if (this.stealthService) {
        await this.stealthService.applyStealthToContext(context);
      } else {
        // Masquage basique si Stealth non activé
        await context.addInitScript(() => {
          Object.defineProperty(navigator, "webdriver", {
            get: () => undefined,
          });

          // Masquer Playwright/Chromium
          Object.defineProperty(navigator, "plugins", {
            get: () => [1, 2, 3, 4, 5],
          });

          Object.defineProperty(navigator, "languages", {
            get: () => ["fr-FR", "fr", "en-US", "en"],
          });
        });
      }

      this.contexts.push(context);
      console.log(
        `[PlaywrightService] ✓ Context créé (total: ${this.contexts.length})`
      );

      return context;
    } catch (error) {
      console.error("[PlaywrightService] ❌ Erreur création context:", error);
      throw new Error(`Impossible de créer un context: ${error.message}`);
    }
  }

  /**
   * Exécute une fonction avec retry automatique
   * @param {Function} fn - Fonction à exécuter
   * @param {Object} options - Options de retry
   */
  async withRetry(fn, options = {}) {
    const maxRetries = options.maxRetries || this.config.maxRetries;
    const retryDelay = options.retryDelay || this.config.retryDelay;
    const operationName = options.name || "opération";

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[PlaywrightService] ${operationName} - tentative ${attempt}/${maxRetries}`
        );
        const result = await fn();
        if (attempt > 1) {
          console.log(
            `[PlaywrightService] ✓ ${operationName} réussie après ${attempt} tentative(s)`
          );
        }
        return result;
      } catch (error) {
        lastError = error;
        console.error(
          `[PlaywrightService] ❌ ${operationName} - tentative ${attempt} échouée:`,
          error.message
        );

        if (attempt < maxRetries) {
          console.log(
            `[PlaywrightService] ⏳ Attente de ${retryDelay}ms avant nouvelle tentative...`
          );
          await this.delay(retryDelay);
        }
      }
    }

    console.error(
      `[PlaywrightService] ❌ ${operationName} échouée après ${maxRetries} tentatives`
    );
    throw lastError;
  }

  /**
   * Navigue vers une URL avec timeout et retry
   * @param {Page} page - Page Playwright
   * @param {string} url - URL cible
   * @param {Object} options - Options de navigation
   */
  async navigateToPage(page, url, options = {}) {
    const timeout = options.timeout || this.config.timeout;
    const waitUntil = options.waitUntil || "networkidle";

    return this.withRetry(
      async () => {
        await page.goto(url, {
          timeout,
          waitUntil,
        });

        // Attendre que le DOM soit stable
        await page.waitForLoadState("domcontentloaded");

        console.log(`[PlaywrightService] ✓ Navigation vers ${url} réussie`);
        return page;
      },
      { name: `Navigation vers ${url}` }
    );
  }

  /**
   * Delay helper
   * @deprecated Utiliser delay() de utils/timingUtils.js
   * @param {number} ms - Millisecondes
   * @returns {Promise<void>}
   */
  delay(ms) {
    return delay(ms);
  }

  /**
   * Delay aléatoire (simulation comportement humain)
   * @deprecated Utiliser randomDelay() de utils/timingUtils.js
   * @param {number} min - Minimum ms
   * @param {number} max - Maximum ms
   * @returns {Promise<number>} Délai attendu en ms
   */
  async randomDelay(min = 1000, max = 3000) {
    return await randomDelay(min, max, true);
  }

  /**
   * Attend avec rate limiting (utilise RateLimiter pour patterns humains)
   * @returns {Promise<number>} Délai attendu
   */
  async waitWithRateLimit() {
    if (!this.rateLimiter) {
      // Fallback: délai aléatoire simple
      return this.randomDelay(2000, 5000);
    }

    return await this.rateLimiter.wait();
  }

  /**
   * Warm-up d'une session avant de commencer le scraping
   * @param {Page} page - Page Playwright
   * @param {string} baseUrl - URL de base (ex: "https://www.google.com")
   * @param {Object} options - Options de warm-up
   */
  async warmupSession(page, baseUrl, options = {}) {
    if (!this.sessionManager) {
      console.log('[PlaywrightService] ⚠️ SessionManager non initialisé, skip warm-up');
      return false;
    }

    console.log(`[PlaywrightService] 🔥 Warm-up session: ${baseUrl}`);

    return await this.sessionManager.warmupSession(page, baseUrl, options);
  }

  /**
   * Sauvegarde les cookies d'un context
   * @param {BrowserContext} context - Context Playwright
   * @param {string} domain - Domaine cible
   */
  async saveCookies(context, domain) {
    if (!this.sessionManager) {
      console.log('[PlaywrightService] ⚠️ SessionManager non initialisé, cookies non sauvegardés');
      return null;
    }

    const sessionId = this.sessionManager.generateSessionId(domain);
    await this.sessionManager.saveCookies(context, sessionId);

    return sessionId;
  }

  /**
   * Charge les cookies dans un context
   * @param {BrowserContext} context - Context Playwright
   * @param {string} sessionId - ID de session
   */
  async loadCookies(context, sessionId) {
    if (!this.sessionManager) {
      console.log('[PlaywrightService] ⚠️ SessionManager non initialisé, cookies non chargés');
      return false;
    }

    return await this.sessionManager.loadCookies(context, sessionId);
  }

  /**
   * ========================================
   * MÉTHODES HUMANIZATION (via HumanBehavior)
   * ========================================
   */

  /**
   * Déplace la souris de manière naturelle avec courbe de Bézier
   * @param {Page} page - Page Playwright
   * @param {Object} from - Point de départ {x, y}
   * @param {Object} to - Point d'arrivée {x, y}
   * @param {Object} options - Options de mouvement
   */
  async moveMouseNaturally(page, from, to, options = {}) {
    if (!this.humanBehavior) {
      console.log('[PlaywrightService] ⚠️ HumanBehavior non disponible, skip mouse movement');
      return false;
    }

    return await this.humanBehavior.moveMouseNaturally(page, from, to, options);
  }

  /**
   * Survol d'un élément avant de cliquer (comportement naturel)
   * @param {Page} page - Page Playwright
   * @param {ElementHandle|string} element - Element ou sélecteur
   * @param {Object} options - Options
   */
  async hoverBeforeClick(page, element, options = {}) {
    if (!this.humanBehavior) {
      console.log('[PlaywrightService] ⚠️ HumanBehavior non disponible, skip hover');
      return false;
    }

    return await this.humanBehavior.hoverBeforeClick(page, element, options);
  }

  /**
   * Scroll progressif avec accélération/décélération
   * @param {Page} page - Page Playwright
   * @param {number} distance - Distance à scroller (px)
   * @param {Object} options - Options de scroll
   */
  async scrollSmoothly(page, distance, options = {}) {
    if (!this.humanBehavior) {
      console.log('[PlaywrightService] ⚠️ HumanBehavior non disponible, fallback scroll simple');
      await page.evaluate((dist) => window.scrollBy(0, dist), distance);
      return false;
    }

    return await this.humanBehavior.scrollSmoothly(page, distance, options);
  }

  /**
   * Scroll jusqu'à un élément de manière progressive
   * @param {Page} page - Page Playwright
   * @param {string} selector - Sélecteur de l'élément
   * @param {Object} options - Options
   */
  async scrollToElement(page, selector, options = {}) {
    if (!this.humanBehavior) {
      console.log('[PlaywrightService] ⚠️ HumanBehavior non disponible, fallback scrollIntoView');
      await page.evaluate((sel) => {
        document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' });
      }, selector);
      return false;
    }

    return await this.humanBehavior.scrollToElement(page, selector, options);
  }

  /**
   * Frappe texte de manière humaine avec erreurs occasionnelles
   * @param {Page} page - Page Playwright
   * @param {string} selector - Sélecteur du champ
   * @param {string} text - Texte à taper
   * @param {Object} options - Options de frappe
   */
  async typeHumanLike(page, selector, text, options = {}) {
    if (!this.humanBehavior) {
      console.log('[PlaywrightService] ⚠️ HumanBehavior non disponible, fallback type simple');
      await page.type(selector, text, { delay: 100 });
      return false;
    }

    return await this.humanBehavior.typeHumanLike(page, selector, text, options);
  }

  /**
   * Ferme un context spécifique
   * @param {BrowserContext} context - Context à fermer
   */
  async closeContext(context) {
    try {
      const index = this.contexts.indexOf(context);
      if (index > -1) {
        this.contexts.splice(index, 1);
      }
      await context.close();
      console.log(
        `[PlaywrightService] ✓ Context fermé (restants: ${this.contexts.length})`
      );
    } catch (error) {
      console.error(
        "[PlaywrightService] ❌ Erreur fermeture context:",
        error
      );
    }
  }

  /**
   * Ferme tous les contexts et le browser
   */
  async close() {
    console.log("[PlaywrightService] Fermeture du service...");

    try {
      // Fermer tous les contexts
      for (const context of this.contexts) {
        await context.close();
      }
      this.contexts = [];

      // Fermer le browser
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.isInitialized = false;
      console.log("[PlaywrightService] ✓ Service fermé");
    } catch (error) {
      console.error("[PlaywrightService] ❌ Erreur lors de la fermeture:", error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques du service
   */
  getStats() {
    const stats = {
      isInitialized: this.isInitialized,
      activeContexts: this.contexts.length,
      maxConcurrentContexts: this.config.maxConcurrentContexts,
      headless: this.config.headless,
      activeStrategies: {
        stealth: !!this.stealthService,
        proxies: !!this.proxyManager,
        sessionManager: !!this.sessionManager,
        rateLimiter: !!this.rateLimiter,
        humanBehavior: !!this.humanBehavior
      }
    };

    // Ajouter stats RateLimiter si disponible
    if (this.rateLimiter) {
      stats.rateLimiter = this.rateLimiter.getStats();
    }

    // Ajouter stats SessionManager si disponible
    if (this.sessionManager) {
      stats.sessionManager = this.sessionManager.getStats();
    }

    return stats;
  }
}

// Instance singleton
// Instances par scraper (une instance par scraperId)
const playwrightServiceInstances = {};

/**
 * Récupère l'instance du service pour un scraper spécifique
 * @param {string} scraperId - ID du scraper (SCRAPER_IDS.*)
 * @param {Object} config - Configuration additionnelle
 */
export function getPlaywrightService(scraperId = SCRAPER_IDS.PAGES_JAUNES, config = {}) {
  if (!playwrightServiceInstances[scraperId]) {
    playwrightServiceInstances[scraperId] = new PlaywrightService(scraperId, config);
  }
  return playwrightServiceInstances[scraperId];
}

/**
 * Réinitialise l'instance d'un scraper (utile pour les tests)
 * @param {string} scraperId - ID du scraper à réinitialiser (ou undefined pour tous)
 */
export function resetPlaywrightService(scraperId = null) {
  if (scraperId) {
    // Réinitialiser un scraper spécifique
    if (playwrightServiceInstances[scraperId]) {
      playwrightServiceInstances[scraperId].close().catch(console.error);
      delete playwrightServiceInstances[scraperId];
    }
  } else {
    // Réinitialiser tous les scrapers
    for (const id in playwrightServiceInstances) {
      playwrightServiceInstances[id].close().catch(console.error);
    }
    Object.keys(playwrightServiceInstances).forEach(key => {
      delete playwrightServiceInstances[key];
    });
  }
}

export default PlaywrightService;
