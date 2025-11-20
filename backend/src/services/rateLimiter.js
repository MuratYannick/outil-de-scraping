/**
 * Rate Limiter avec patterns de comportement humain
 * Simule des délais réalistes entre les requêtes pour éviter la détection
 */

/**
 * Patterns de comportement disponibles
 */
export const RATE_LIMIT_PATTERNS = {
  CAUTIOUS: 'cautious',       // Très prudent: 5-10s entre requêtes
  NORMAL: 'normal',           // Normal: 2-5s entre requêtes
  AGGRESSIVE: 'aggressive',   // Agressif: 1-3s entre requêtes
  HUMAN: 'human',             // Simule comportement humain avec bursts
  RANDOM: 'random'            // Complètement aléatoire
};

/**
 * Configuration des patterns
 */
const PATTERN_CONFIG = {
  [RATE_LIMIT_PATTERNS.CAUTIOUS]: {
    minDelay: 5000,
    maxDelay: 10000,
    burstEnabled: false
  },
  [RATE_LIMIT_PATTERNS.NORMAL]: {
    minDelay: 2000,
    maxDelay: 5000,
    burstEnabled: true,
    burstSize: 3,
    burstPause: 8000
  },
  [RATE_LIMIT_PATTERNS.AGGRESSIVE]: {
    minDelay: 1000,
    maxDelay: 3000,
    burstEnabled: false
  },
  [RATE_LIMIT_PATTERNS.HUMAN]: {
    minDelay: 1500,
    maxDelay: 4000,
    burstEnabled: true,
    burstSize: 5,
    burstPause: 15000,
    randomPauses: true,        // Pauses aléatoires supplémentaires
    pauseProbability: 0.15,    // 15% de chance de pause
    pauseDuration: [5000, 20000] // Durée des pauses aléatoires
  },
  [RATE_LIMIT_PATTERNS.RANDOM]: {
    minDelay: 500,
    maxDelay: 15000,
    burstEnabled: false
  }
};

class RateLimiter {
  constructor(pattern = RATE_LIMIT_PATTERNS.NORMAL) {
    this.pattern = pattern;
    this.config = PATTERN_CONFIG[pattern];
    this.requestCount = 0;
    this.burstCount = 0;
    this.lastRequestTime = 0;
    this.totalDelay = 0;
    this.sessionStartTime = Date.now();

    console.log(`[RateLimiter] Initialisé avec pattern: ${pattern}`);
  }

  /**
   * Obtient le délai à attendre avant la prochaine requête
   * @returns {number} Délai en millisecondes
   */
  getNextDelay() {
    const config = this.config;
    this.requestCount++;

    // Pattern HUMAN avec bursts réalistes
    if (this.pattern === RATE_LIMIT_PATTERNS.HUMAN) {
      return this._getHumanDelay();
    }

    // Pattern NORMAL avec bursts
    if (this.pattern === RATE_LIMIT_PATTERNS.NORMAL && config.burstEnabled) {
      return this._getBurstDelay();
    }

    // Pattern simple (CAUTIOUS, AGGRESSIVE, RANDOM)
    return this._getRandomDelay(config.minDelay, config.maxDelay);
  }

  /**
   * Calcule un délai avec pattern humain (bursts + pauses aléatoires)
   * @private
   */
  _getHumanDelay() {
    const config = this.config;

    // Incrémenter le compteur de burst
    this.burstCount++;

    // Si on a atteint la taille du burst, faire une pause longue
    if (this.burstCount >= config.burstSize) {
      this.burstCount = 0;
      const pauseDelay = config.burstPause + this._getRandomDelay(0, 5000);
      console.log(`[RateLimiter] 🛑 Pause burst (${Math.round(pauseDelay / 1000)}s)`);
      return pauseDelay;
    }

    // Pause aléatoire occasionnelle (simule distraction, lecture)
    if (config.randomPauses && Math.random() < config.pauseProbability) {
      const [minPause, maxPause] = config.pauseDuration;
      const randomPause = this._getRandomDelay(minPause, maxPause);
      console.log(`[RateLimiter] 💭 Pause aléatoire (${Math.round(randomPause / 1000)}s)`);
      return randomPause;
    }

    // Délai normal avec variation
    return this._getRandomDelay(config.minDelay, config.maxDelay);
  }

  /**
   * Calcule un délai avec pattern burst simple
   * @private
   */
  _getBurstDelay() {
    const config = this.config;

    // Incrémenter le compteur de burst
    this.burstCount++;

    // Si on a atteint la taille du burst, faire une pause
    if (this.burstCount >= config.burstSize) {
      this.burstCount = 0;
      console.log(`[RateLimiter] 🛑 Pause burst (${Math.round(config.burstPause / 1000)}s)`);
      return config.burstPause;
    }

    // Délai rapide dans le burst
    return this._getRandomDelay(config.minDelay, config.maxDelay);
  }

  /**
   * Génère un délai aléatoire entre min et max
   * @private
   */
  _getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Attend le délai calculé avant de continuer
   * @returns {Promise<number>} Le délai attendu (ms)
   */
  async wait() {
    const delay = this.getNextDelay();
    this.totalDelay += delay;

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    console.log(
      `[RateLimiter] ⏳ Attente ${Math.round(delay / 1000)}s (requête #${this.requestCount})`
    );

    // Attendre le délai
    await new Promise(resolve => setTimeout(resolve, delay));

    this.lastRequestTime = Date.now();

    return delay;
  }

  /**
   * Change le pattern en cours d'exécution
   * @param {string} newPattern - Nouveau pattern à utiliser
   */
  setPattern(newPattern) {
    if (!PATTERN_CONFIG[newPattern]) {
      console.warn(`[RateLimiter] Pattern inconnu: ${newPattern}`);
      return;
    }

    this.pattern = newPattern;
    this.config = PATTERN_CONFIG[newPattern];
    this.burstCount = 0; // Réinitialiser le compteur de burst

    console.log(`[RateLimiter] ✓ Pattern changé: ${newPattern}`);
  }

  /**
   * Obtient les statistiques de la session
   * @returns {Object} Statistiques
   */
  getStats() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const avgDelayPerRequest = this.requestCount > 0
      ? Math.round(this.totalDelay / this.requestCount)
      : 0;

    return {
      pattern: this.pattern,
      requestCount: this.requestCount,
      totalDelayMs: this.totalDelay,
      totalDelaySec: Math.round(this.totalDelay / 1000),
      avgDelayPerRequest,
      sessionDurationMs: sessionDuration,
      sessionDurationSec: Math.round(sessionDuration / 1000),
      requestsPerMinute: sessionDuration > 0
        ? Math.round((this.requestCount / sessionDuration) * 60000)
        : 0
    };
  }

  /**
   * Affiche les statistiques de la session
   */
  logStats() {
    const stats = this.getStats();
    console.log('\n[RateLimiter] 📊 Statistiques de session:');
    console.log(`  Pattern: ${stats.pattern}`);
    console.log(`  Requêtes: ${stats.requestCount}`);
    console.log(`  Délai total: ${stats.totalDelaySec}s`);
    console.log(`  Délai moyen: ${Math.round(stats.avgDelayPerRequest / 1000)}s/requête`);
    console.log(`  Durée session: ${stats.sessionDurationSec}s`);
    console.log(`  Vitesse: ${stats.requestsPerMinute} req/min\n`);
  }

  /**
   * Réinitialise les compteurs
   */
  reset() {
    this.requestCount = 0;
    this.burstCount = 0;
    this.totalDelay = 0;
    this.sessionStartTime = Date.now();
    this.lastRequestTime = 0;

    console.log('[RateLimiter] ✓ Compteurs réinitialisés');
  }
}

// Instance singleton
let rateLimiterInstance = null;

/**
 * Récupère l'instance singleton du RateLimiter
 * @param {string} pattern - Pattern à utiliser (optionnel)
 */
export function getRateLimiter(pattern = RATE_LIMIT_PATTERNS.NORMAL) {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter(pattern);
  }
  return rateLimiterInstance;
}

/**
 * Réinitialise l'instance (utile pour les tests)
 */
export function resetRateLimiter() {
  rateLimiterInstance = null;
}

/**
 * Helper: attend un délai aléatoire simple sans instance
 * @param {number} min - Minimum ms
 * @param {number} max - Maximum ms
 */
export async function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`[RateLimiter] ⏳ Délai aléatoire: ${Math.round(delay / 1000)}s`);
  await new Promise(resolve => setTimeout(resolve, delay));
  return delay;
}

export default RateLimiter;
