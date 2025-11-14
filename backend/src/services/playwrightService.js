import { chromium } from "playwright";
import { getProxyManager } from "./proxyManager.js";
import { getStealthService } from "./stealthService.js";
import { antiBotConfig } from "../config/antiBotConfig.js";

/**
 * Service de gestion de Playwright pour le scraping
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
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.browser = null;
    this.contexts = [];
    this.isInitialized = false;
    this.proxyManager = null;
    this.currentProxy = null;
    this.stealthService = null;
  }

  /**
   * Initialise le browser Playwright
   */
  async initialize() {
    if (this.isInitialized) {
      console.log("[PlaywrightService] Déjà initialisé");
      return;
    }

    try {
      console.log("[PlaywrightService] Initialisation du browser...");

      // Initialiser le gestionnaire de proxies si activé
      if (antiBotConfig.proxies.enabled) {
        console.log("[PlaywrightService] Initialisation du gestionnaire de proxies...");
        this.proxyManager = getProxyManager();
        await this.proxyManager.initialize();
      }

      // Initialiser le service Stealth si activé
      if (antiBotConfig.stealth.enabled) {
        console.log("[PlaywrightService] Initialisation du service Stealth...");
        this.stealthService = getStealthService();
        await this.stealthService.initialize();
      }

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
      console.log(
        `[PlaywrightService] ✓ Browser initialisé (headless: ${this.config.headless})`
      );
    } catch (error) {
      console.error("[PlaywrightService] ❌ Erreur initialisation:", error);
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
      // Configuration de base
      let contextConfig = {
        viewport: this.config.viewport,
        userAgent: this.config.userAgent,
        locale: "fr-FR",
        timezoneId: "Europe/Paris",
        permissions: [],
        extraHTTPHeaders: {
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        },
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
   * @param {number} ms - Millisecondes
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Delay aléatoire (simulation comportement humain)
   * @param {number} min - Minimum ms
   * @param {number} max - Maximum ms
   */
  randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`[PlaywrightService] ⏳ Delay aléatoire: ${delay}ms`);
    return this.delay(delay);
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
    return {
      isInitialized: this.isInitialized,
      activeContexts: this.contexts.length,
      maxConcurrentContexts: this.config.maxConcurrentContexts,
      headless: this.config.headless,
    };
  }
}

// Instance singleton
let playwrightServiceInstance = null;

/**
 * Récupère l'instance singleton du service
 */
export function getPlaywrightService(config = {}) {
  if (!playwrightServiceInstance) {
    playwrightServiceInstance = new PlaywrightService(config);
  }
  return playwrightServiceInstance;
}

/**
 * Réinitialise l'instance (utile pour les tests)
 */
export function resetPlaywrightService() {
  if (playwrightServiceInstance) {
    playwrightServiceInstance.close().catch(console.error);
    playwrightServiceInstance = null;
  }
}

export default PlaywrightService;
