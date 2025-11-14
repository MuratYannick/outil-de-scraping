import fs from 'fs';
import path from 'path';
import { antiBotConfig } from '../config/antiBotConfig.js';

/**
 * Service de masquage avancé (Stealth Mode)
 * Techniques pour masquer les indicateurs d'automatisation
 */

class StealthService {
  constructor() {
    this.config = antiBotConfig.stealth;
    this.initialized = false;
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
  }

  /**
   * Initialise le service Stealth
   */
  async initialize() {
    if (this.initialized) {
      console.log('[StealthService] Déjà initialisé');
      return;
    }

    if (!this.config.enabled) {
      console.log('[StealthService] Service désactivé');
      return;
    }

    // Créer le dossier des profils navigateur si nécessaire
    if (this.config.persistentProfile.enabled) {
      await this._ensureProfileDirectory();
    }

    this.initialized = true;
    console.log('[StealthService] ✓ Service initialisé');
  }

  /**
   * Crée le dossier des profils navigateur
   * @private
   */
  async _ensureProfileDirectory() {
    const profilePath = this.config.persistentProfile.path;

    try {
      if (!fs.existsSync(profilePath)) {
        fs.mkdirSync(profilePath, { recursive: true });
        console.log(`[StealthService] ✓ Dossier profil créé: ${profilePath}`);
      }
    } catch (error) {
      console.error('[StealthService] ❌ Erreur création dossier profil:', error.message);
    }
  }

  /**
   * Applique le masquage stealth à un browser context
   * @param {BrowserContext} context - Context Playwright
   */
  async applyStealthToContext(context) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('[StealthService] Application du masquage stealth...');

    // Script d'initialisation pour masquer l'automatisation
    await context.addInitScript(() => {
      // 1. Masquer navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // 2. Surcharger les propriétés Chrome pour masquer l'automatisation
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };

      // 3. Permissions API - simuler un comportement réel
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // 4. Plugins - simuler des plugins réels
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: { type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format" },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          },
          {
            0: { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format" },
            description: "Portable Document Format",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            length: 1,
            name: "Chrome PDF Viewer"
          },
          {
            0: { type: "application/x-nacl", suffixes: "", description: "Native Client Executable" },
            1: { type: "application/x-pnacl", suffixes: "", description: "Portable Native Client Executable" },
            description: "",
            filename: "internal-nacl-plugin",
            length: 2,
            name: "Native Client"
          }
        ]
      });

      // 5. Languages - langue réaliste
      Object.defineProperty(navigator, 'languages', {
        get: () => ['fr-FR', 'fr', 'en-US', 'en']
      });

      // 6. Platform - OS réaliste
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32'
      });

      // 7. HardwareConcurrency - CPU réaliste
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8
      });

      // 8. DeviceMemory - RAM réaliste
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8
      });

      // 9. Masquer automation
      delete navigator.__proto__.webdriver;

      // 10. Canvas Fingerprinting - ajouter du bruit
      const getImageData = CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData = function(...args) {
        const imageData = getImageData.apply(this, args);
        // Ajouter un très léger bruit pour randomiser le fingerprint
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] += Math.floor(Math.random() * 2);
        }
        return imageData;
      };

      // 11. WebGL Fingerprinting - masquer
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
          return 'Intel Inc.';
        }
        if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, [parameter]);
      };

      // 12. Battery API - masquer
      if (navigator.getBattery) {
        navigator.getBattery = () => {
          return Promise.resolve({
            charging: true,
            chargingTime: 0,
            dischargingTime: Infinity,
            level: 1,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => {}
          });
        };
      }

      // 13. Masquer iframe contentWindow
      Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
        get: function() {
          return window;
        }
      });

      // 14. Media Codecs - réaliste
      const originalCanPlayType = HTMLMediaElement.prototype.canPlayType;
      HTMLMediaElement.prototype.canPlayType = function(type) {
        if (type === 'video/ogg; codecs="theora"') return '';
        if (type === 'video/mp4; codecs="avc1.42E01E"') return 'probably';
        if (type === 'video/webm; codecs="vp8, vorbis"') return 'probably';
        return originalCanPlayType.apply(this, [type]);
      };

      console.log('[Stealth] Masquage appliqué');
    });

    console.log('[StealthService] ✓ Script stealth injecté');
  }

  /**
   * Génère des headers HTTP réalistes
   * @returns {Object} Headers HTTP
   */
  getRealisticHeaders() {
    const userAgent = this._getRandomUserAgent();

    return {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    };
  }

  /**
   * Sélectionne un User-Agent aléatoire
   * @private
   */
  _getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Génère un viewport aléatoire réaliste
   * @returns {Object} Viewport configuration
   */
  getRandomViewport() {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 2560, height: 1440 }
    ];

    return viewports[Math.floor(Math.random() * viewports.length)];
  }

  /**
   * Simule un comportement humain sur une page
   * @param {Page} page - Page Playwright
   */
  async simulateHumanBehavior(page) {
    if (!this.config.humanBehavior.enabled) {
      return;
    }

    try {
      // 1. Scroll aléatoire
      if (this.config.humanBehavior.randomScrolling) {
        await this._randomScroll(page);
      }

      // 2. Mouvements de souris (optionnel, coûteux en perf)
      if (this.config.humanBehavior.randomMouseMovement) {
        await this._randomMouseMovement(page);
      }

      // 3. Delay aléatoire
      if (this.config.humanBehavior.randomDelays) {
        await this._randomDelay();
      }

      console.log('[StealthService] ✓ Comportement humain simulé');
    } catch (error) {
      console.error('[StealthService] Erreur simulation comportement:', error.message);
    }
  }

  /**
   * Scroll aléatoire sur la page
   * @private
   */
  async _randomScroll(page) {
    try {
      const scrolls = Math.floor(Math.random() * 3) + 1; // 1-3 scrolls

      for (let i = 0; i < scrolls; i++) {
        const scrollY = Math.floor(Math.random() * 500) + 200; // 200-700px
        await page.evaluate((y) => {
          window.scrollBy({
            top: y,
            behavior: 'smooth'
          });
        }, scrollY);

        await this._delay(Math.floor(Math.random() * 1000) + 500); // 500-1500ms entre scrolls
      }
    } catch (error) {
      // Ignorer les erreurs de scroll
    }
  }

  /**
   * Mouvements de souris aléatoires
   * @private
   */
  async _randomMouseMovement(page) {
    try {
      const movements = Math.floor(Math.random() * 3) + 2; // 2-4 mouvements

      for (let i = 0; i < movements; i++) {
        const x = Math.floor(Math.random() * 800) + 100;
        const y = Math.floor(Math.random() * 600) + 100;

        await page.mouse.move(x, y, { steps: 10 });
        await this._delay(Math.floor(Math.random() * 500) + 200);
      }
    } catch (error) {
      // Ignorer les erreurs de souris
    }
  }

  /**
   * Delay aléatoire
   * @private
   */
  async _randomDelay() {
    const min = this.config.humanBehavior.minDelay || 1000;
    const max = this.config.humanBehavior.maxDelay || 3000;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;

    console.log(`[StealthService] ⏳ Delay aléatoire: ${delay}ms`);
    await this._delay(delay);
  }

  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Récupère le chemin du profil navigateur persistant
   * @returns {string|null} Chemin du profil
   */
  getProfilePath() {
    if (!this.config.persistentProfile.enabled) {
      return null;
    }

    return path.resolve(this.config.persistentProfile.path);
  }

  /**
   * Configure les options de context pour Stealth
   * @param {Object} baseOptions - Options de base du context
   * @returns {Object} Options enrichies
   */
  enrichContextOptions(baseOptions = {}) {
    const headers = this.getRealisticHeaders();
    const viewport = this.getRandomViewport();

    return {
      ...baseOptions,
      userAgent: headers['User-Agent'],
      viewport: viewport,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      permissions: [],
      extraHTTPHeaders: {
        'Accept': headers['Accept'],
        'Accept-Language': headers['Accept-Language'],
        'Accept-Encoding': headers['Accept-Encoding'],
        'DNT': headers['DNT'],
        'sec-ch-ua': headers['sec-ch-ua'],
        'sec-ch-ua-mobile': headers['sec-ch-ua-mobile'],
        'sec-ch-ua-platform': headers['sec-ch-ua-platform']
      },
      // JavaScript activé
      javaScriptEnabled: true,
      // Ignorer les erreurs HTTPS (optionnel)
      ignoreHTTPSErrors: false,
      // Bypass CSP (optionnel, à utiliser avec précaution)
      bypassCSP: false
    };
  }

  /**
   * Récupère les statistiques du service
   */
  getStats() {
    return {
      initialized: this.initialized,
      enabled: this.config.enabled,
      persistentProfile: this.config.persistentProfile.enabled,
      humanBehavior: this.config.humanBehavior.enabled,
      userAgentsCount: this.userAgents.length
    };
  }
}

// Instance singleton
let stealthServiceInstance = null;

/**
 * Récupère l'instance singleton du service
 */
export function getStealthService() {
  if (!stealthServiceInstance) {
    stealthServiceInstance = new StealthService();
  }
  return stealthServiceInstance;
}

/**
 * Réinitialise l'instance (utile pour les tests)
 */
export function resetStealthService() {
  stealthServiceInstance = null;
}

export default StealthService;
