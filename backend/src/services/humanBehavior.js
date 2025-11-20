/**
 * Human Behavior Simulation Module
 * Simule des comportements humains réalistes pour éviter la détection
 * - Mouvements de souris avec courbes de Bézier
 * - Scroll progressif avec accélération/décélération
 * - Frappe clavier avec délais variables et erreurs
 * - User-Agent rotation cohérente
 */

/**
 * Pool de User-Agents réalistes et récents
 * Organisés par OS et navigateur pour cohérence
 */
const USER_AGENTS = {
  windows: {
    chrome: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    ],
    firefox: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    ],
    edge: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
    ]
  },
  macos: {
    chrome: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    ],
    safari: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    ],
    firefox: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    ]
  },
  linux: {
    chrome: [
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    ],
    firefox: [
      'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
    ]
  }
};

class HumanBehavior {
  constructor() {
    this.currentUserAgent = null;
    this.userAgentConfig = null;
  }

  /**
   * ========================================
   * MOUVEMENTS DE SOURIS (Courbes de Bézier)
   * ========================================
   */

  /**
   * Génère un point sur une courbe de Bézier cubique
   * @param {number} t - Position sur la courbe (0-1)
   * @param {Object} start - Point de départ {x, y}
   * @param {Object} cp1 - Premier point de contrôle {x, y}
   * @param {Object} cp2 - Second point de contrôle {x, y}
   * @param {Object} end - Point d'arrivée {x, y}
   * @returns {Object} Point {x, y}
   */
  bezierPoint(t, start, cp1, cp2, end) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * start.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * end.x,
      y: mt3 * start.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * end.y
    };
  }

  /**
   * Génère une trajectoire de souris réaliste avec courbe de Bézier
   * @param {Object} start - Point de départ {x, y}
   * @param {Object} end - Point d'arrivée {x, y}
   * @param {number} steps - Nombre d'étapes (défaut: 20)
   * @returns {Array} Tableau de points {x, y}
   */
  generateMousePath(start, end, steps = 20) {
    // Générer des points de contrôle aléatoires pour la courbe
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Points de contrôle avec variation aléatoire pour naturalité
    const cp1 = {
      x: start.x + dx * (0.25 + Math.random() * 0.1),
      y: start.y + dy * (0.25 + Math.random() * 0.1) + (Math.random() - 0.5) * 50
    };

    const cp2 = {
      x: start.x + dx * (0.75 + Math.random() * 0.1),
      y: start.y + dy * (0.75 + Math.random() * 0.1) + (Math.random() - 0.5) * 50
    };

    // Générer les points le long de la courbe
    const path = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = this.bezierPoint(t, start, cp1, cp2, end);
      path.push(point);
    }

    return path;
  }

  /**
   * Déplace la souris de manière réaliste entre deux points
   * @param {Page} page - Page Playwright
   * @param {Object} from - Point de départ {x, y}
   * @param {Object} to - Point d'arrivée {x, y}
   * @param {Object} options - Options de mouvement
   */
  async moveMouseNaturally(page, from, to, options = {}) {
    const {
      steps = 20,
      duration = 1000,
      addJitter = true
    } = options;

    const path = this.generateMousePath(from, to, steps);
    const stepDelay = duration / steps;

    for (let i = 0; i < path.length; i++) {
      const point = path[i];

      // Ajouter un micro-mouvement aléatoire (jitter)
      let x = point.x;
      let y = point.y;

      if (addJitter && i > 0 && i < path.length - 1) {
        x += (Math.random() - 0.5) * 2;
        y += (Math.random() - 0.5) * 2;
      }

      await page.mouse.move(x, y);

      // Délai variable pour naturalité (plus lent au début et fin)
      const progress = i / steps;
      const speedMultiplier = Math.sin(progress * Math.PI); // Courbe sinusoïdale
      const delay = stepDelay * (0.5 + speedMultiplier * 0.5);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Survol d'un élément avant de cliquer
   * @param {Page} page - Page Playwright
   * @param {ElementHandle|string} element - Element ou sélecteur
   * @param {Object} options - Options
   */
  async hoverBeforeClick(page, element, options = {}) {
    const {
      hoverDuration = 500,
      moveNaturally = true
    } = options;

    try {
      // Obtenir la bounding box de l'élément
      const elementHandle = typeof element === 'string'
        ? await page.$(element)
        : element;

      if (!elementHandle) {
        console.warn('[HumanBehavior] Element not found for hover');
        return false;
      }

      const box = await elementHandle.boundingBox();
      if (!box) {
        console.warn('[HumanBehavior] Element has no bounding box');
        return false;
      }

      // Point cible au centre de l'élément
      const target = {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
      };

      // Position actuelle (simulée)
      const current = {
        x: Math.random() * 100 + 100,
        y: Math.random() * 100 + 100
      };

      // Déplacer vers l'élément
      if (moveNaturally) {
        await this.moveMouseNaturally(page, current, target, {
          steps: 15,
          duration: 800
        });
      } else {
        await page.mouse.move(target.x, target.y);
      }

      // Hover pendant un moment
      await new Promise(resolve => setTimeout(resolve, hoverDuration));

      return true;
    } catch (error) {
      console.error('[HumanBehavior] Error during hover:', error);
      return false;
    }
  }

  /**
   * ========================================
   * SCROLL INTELLIGENT
   * ========================================
   */

  /**
   * Fonction d'easing pour accélération/décélération
   * @param {number} t - Position (0-1)
   * @returns {number} Valeur avec easing
   */
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Scroll progressif avec accélération et décélération
   * @param {Page} page - Page Playwright
   * @param {number} distance - Distance à scroller (pixels, négatif = haut)
   * @param {Object} options - Options de scroll
   */
  async scrollSmoothly(page, distance, options = {}) {
    const {
      duration = 1000,
      steps = 30,
      addOvershoot = true,
      overshootAmount = 0.1,
      pauseProbability = 0.2
    } = options;

    const stepDelay = duration / steps;
    let scrolled = 0;

    // Ajouter un overshoot (dépassement puis correction)
    const overshoot = addOvershoot ? distance * overshootAmount : 0;
    const totalDistance = distance + overshoot;

    console.log(`[HumanBehavior] 📜 Scroll progressif: ${distance}px sur ${duration}ms`);

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const eased = this.easeInOutCubic(progress);
      const targetScroll = totalDistance * eased;
      const deltaScroll = targetScroll - scrolled;

      await page.evaluate((delta) => {
        window.scrollBy(0, delta);
      }, deltaScroll);

      scrolled = targetScroll;

      // Pause aléatoire occasionnelle (simule lecture)
      if (Math.random() < pauseProbability && i < steps - 2) {
        const pauseDuration = Math.random() * 200 + 100;
        await new Promise(resolve => setTimeout(resolve, stepDelay + pauseDuration));
      } else {
        await new Promise(resolve => setTimeout(resolve, stepDelay));
      }
    }

    // Corriger l'overshoot si présent
    if (addOvershoot && overshoot !== 0) {
      await new Promise(resolve => setTimeout(resolve, 100));

      await page.evaluate((correction) => {
        window.scrollBy(0, correction);
      }, -overshoot);

      console.log(`[HumanBehavior] ✓ Correction overshoot: ${-overshoot}px`);
    }

    console.log(`[HumanBehavior] ✓ Scroll terminé`);
  }

  /**
   * Scroll jusqu'à un élément de manière progressive
   * @param {Page} page - Page Playwright
   * @param {string} selector - Sélecteur de l'élément
   * @param {Object} options - Options
   */
  async scrollToElement(page, selector, options = {}) {
    const {
      offset = -100,
      ...scrollOptions
    } = options;

    try {
      const element = await page.$(selector);
      if (!element) {
        console.warn(`[HumanBehavior] Element not found: ${selector}`);
        return false;
      }

      // Obtenir position de l'élément et position actuelle du scroll
      const position = await page.evaluate(({ sel, off }) => {
        const el = document.querySelector(sel);
        if (!el) return null;

        const rect = el.getBoundingClientRect();
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        const targetScroll = currentScroll + rect.top + off;

        return {
          current: currentScroll,
          target: targetScroll,
          distance: targetScroll - currentScroll
        };
      }, { sel: selector, off: offset });

      if (!position) {
        return false;
      }

      console.log(`[HumanBehavior] Scroll vers élément: ${position.distance}px`);

      await this.scrollSmoothly(page, position.distance, scrollOptions);

      return true;
    } catch (error) {
      console.error('[HumanBehavior] Error scrolling to element:', error);
      return false;
    }
  }

  /**
   * ========================================
   * FRAPPE CLAVIER RÉALISTE
   * ========================================
   */

  /**
   * Simule la frappe d'un texte avec délais variables et erreurs
   * @param {Page} page - Page Playwright
   * @param {string} selector - Sélecteur du champ de saisie
   * @param {string} text - Texte à taper
   * @param {Object} options - Options de frappe
   */
  async typeHumanLike(page, selector, text, options = {}) {
    const {
      minDelay = 50,
      maxDelay = 200,
      errorProbability = 0.05,
      thinkProbability = 0.1,
      thinkDuration = [500, 1500],
      skipClick = false
    } = options;

    console.log(`[HumanBehavior] ⌨️ Frappe: "${text}"`);

    // Cliquer sur le champ si nécessaire
    if (!skipClick) {
      await page.click(selector);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Pause de réflexion occasionnelle
      if (Math.random() < thinkProbability) {
        const [minThink, maxThink] = thinkDuration;
        const thinkTime = Math.random() * (maxThink - minThink) + minThink;
        console.log(`[HumanBehavior] 💭 Pause réflexion: ${Math.round(thinkTime)}ms`);
        await new Promise(resolve => setTimeout(resolve, thinkTime));
      }

      // Erreur de frappe occasionnelle
      if (Math.random() < errorProbability && i < text.length - 1) {
        // Taper un caractère aléatoire
        const wrongChars = 'abcdefghijklmnopqrstuvwxyz';
        const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)];

        await page.keyboard.type(wrongChar, {
          delay: Math.random() * (maxDelay - minDelay) + minDelay
        });

        // Attendre un peu (réalisation de l'erreur)
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        // Corriger avec backspace
        await page.keyboard.press('Backspace');
        await new Promise(resolve => setTimeout(resolve, 50));

        console.log(`[HumanBehavior] ❌ Erreur corrigée: ${wrongChar} → ${char}`);
      }

      // Taper le bon caractère
      const delay = Math.random() * (maxDelay - minDelay) + minDelay;
      await page.keyboard.type(char, { delay });
    }

    console.log(`[HumanBehavior] ✓ Frappe terminée`);
  }

  /**
   * ========================================
   * USER-AGENT ROTATION
   * ========================================
   */

  /**
   * Sélectionne un User-Agent aléatoire mais cohérent
   * @param {Object} preferences - Préférences (os, browser)
   * @returns {Object} {userAgent, config: {os, browser}}
   */
  selectUserAgent(preferences = {}) {
    const {
      os = null,
      browser = null
    } = preferences;

    // Sélectionner OS aléatoire si non spécifié
    const selectedOS = os || this._randomChoice(['windows', 'windows', 'macos', 'linux']); // windows 2x plus probable

    // Sélectionner navigateur aléatoire pour cet OS
    const availableBrowsers = Object.keys(USER_AGENTS[selectedOS]);
    const selectedBrowser = browser && availableBrowsers.includes(browser)
      ? browser
      : this._randomChoice(availableBrowsers);

    // Sélectionner UA aléatoire pour ce navigateur
    const userAgents = USER_AGENTS[selectedOS][selectedBrowser];
    const selectedUA = this._randomChoice(userAgents);

    this.currentUserAgent = selectedUA;
    this.userAgentConfig = {
      os: selectedOS,
      browser: selectedBrowser
    };

    console.log(`[HumanBehavior] 🌐 User-Agent: ${selectedOS}/${selectedBrowser}`);
    console.log(`[HumanBehavior]    ${selectedUA.substring(0, 80)}...`);

    return {
      userAgent: selectedUA,
      config: this.userAgentConfig
    };
  }

  /**
   * Obtient le viewport cohérent avec l'OS
   * @returns {Object} {width, height}
   */
  getConsistentViewport() {
    if (!this.userAgentConfig) {
      this.selectUserAgent();
    }

    const viewports = {
      windows: [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1536, height: 864 }
      ],
      macos: [
        { width: 1440, height: 900 },
        { width: 1920, height: 1080 },
        { width: 2560, height: 1440 }
      ],
      linux: [
        { width: 1920, height: 1080 },
        { width: 1680, height: 1050 },
        { width: 1366, height: 768 }
      ]
    };

    return this._randomChoice(viewports[this.userAgentConfig.os]);
  }

  /**
   * Obtient les headers cohérents avec le navigateur
   * @returns {Object} Headers HTTP
   */
  getConsistentHeaders() {
    if (!this.userAgentConfig) {
      this.selectUserAgent();
    }

    const baseHeaders = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    // Headers spécifiques Chrome
    if (this.userAgentConfig.browser === 'chrome' || this.userAgentConfig.browser === 'edge') {
      return {
        ...baseHeaders,
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': `"${this._capitalizeOS(this.userAgentConfig.os)}"`,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      };
    }

    // Headers Firefox
    return baseHeaders;
  }

  /**
   * ========================================
   * HELPERS PRIVÉS
   * ========================================
   */

  _randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  _capitalizeOS(os) {
    const mapping = {
      windows: 'Windows',
      macos: 'macOS',
      linux: 'Linux'
    };
    return mapping[os] || os;
  }
}

// Instance singleton
let humanBehaviorInstance = null;

/**
 * Récupère l'instance singleton du HumanBehavior
 */
export function getHumanBehavior() {
  if (!humanBehaviorInstance) {
    humanBehaviorInstance = new HumanBehavior();
  }
  return humanBehaviorInstance;
}

/**
 * Réinitialise l'instance (utile pour les tests)
 */
export function resetHumanBehavior() {
  humanBehaviorInstance = null;
}

export default HumanBehavior;
