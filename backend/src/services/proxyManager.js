import { antiBotConfig } from '../config/antiBotConfig.js';

/**
 * Service de gestion des proxies pour le scraping
 * Gère la rotation, validation et sélection des proxies
 */

class ProxyManager {
  constructor() {
    this.config = antiBotConfig.proxies;
    this.currentProxyIndex = 0;
    this.proxyList = [];
    this.failedProxies = new Set();
    this.initialized = false;
  }

  /**
   * Initialise le gestionnaire de proxies
   */
  async initialize() {
    if (this.initialized) {
      console.log('[ProxyManager] Déjà initialisé');
      return;
    }

    if (!this.config.enabled) {
      console.log('[ProxyManager] Proxies désactivés');
      return;
    }

    console.log(`[ProxyManager] Initialisation avec provider: ${this.config.provider}`);

    try {
      // Construire la liste de proxies selon le provider
      switch (this.config.provider) {
        case 'brightdata':
          this.proxyList = [this._buildBrightDataProxy()];
          break;

        case 'oxylabs':
          this.proxyList = [this._buildOxylabsProxy()];
          break;

        case 'smartproxy':
          this.proxyList = [this._buildSmartProxyProxy()];
          break;

        case 'custom':
          this.proxyList = this._parseCustomProxyList();
          break;

        default:
          throw new Error(`Provider de proxy non supporté: ${this.config.provider}`);
      }

      if (this.proxyList.length === 0) {
        throw new Error('Aucun proxy configuré');
      }

      console.log(`[ProxyManager] ✓ ${this.proxyList.length} proxy(s) chargé(s)`);

      // Tester les proxies si configuré
      if (this.config.testBeforeUse) {
        await this._testProxies();
      }

      this.initialized = true;
    } catch (error) {
      console.error('[ProxyManager] ❌ Erreur initialisation:', error.message);
      throw error;
    }
  }

  /**
   * Construit une configuration proxy pour BrightData
   * @private
   */
  _buildBrightDataProxy() {
    const { brightdata } = this.config;

    if (!brightdata.host || !brightdata.username || !brightdata.password) {
      throw new Error('Configuration BrightData incomplète');
    }

    // Format BrightData: username-country-{country}-session-{session_id}
    const username = `${brightdata.username}-country-${brightdata.country}-session-${brightdata.session_id}`;

    return {
      server: `http://${brightdata.host}:${brightdata.port}`,
      username: username,
      password: brightdata.password,
      provider: 'brightdata',
      country: brightdata.country
    };
  }

  /**
   * Construit une configuration proxy pour Oxylabs
   * @private
   */
  _buildOxylabsProxy() {
    const { oxylabs } = this.config;

    if (!oxylabs.host || !oxylabs.username || !oxylabs.password) {
      throw new Error('Configuration Oxylabs incomplète');
    }

    // Format Oxylabs: customer-{username}-cc-{country}
    const username = `customer-${oxylabs.username}-cc-${oxylabs.country}`;

    return {
      server: `http://${oxylabs.host}:${oxylabs.port}`,
      username: username,
      password: oxylabs.password,
      provider: 'oxylabs',
      country: oxylabs.country
    };
  }

  /**
   * Construit une configuration proxy pour SmartProxy
   * @private
   */
  _buildSmartProxyProxy() {
    const { smartproxy } = this.config;

    if (!smartproxy.host || !smartproxy.username || !smartproxy.password) {
      throw new Error('Configuration SmartProxy incomplète');
    }

    // Format SmartProxy: user-{username}-country-{country}
    const username = `user-${smartproxy.username}-country-${smartproxy.country}`;

    return {
      server: `http://${smartproxy.host}:${smartproxy.port}`,
      username: username,
      password: smartproxy.password,
      provider: 'smartproxy',
      country: smartproxy.country
    };
  }

  /**
   * Parse une liste de proxies personnalisés
   * @private
   */
  _parseCustomProxyList() {
    const { custom } = this.config;

    if (!custom.list || custom.list.length === 0) {
      throw new Error('Liste de proxies personnalisés vide');
    }

    return custom.list.map((proxyUrl, index) => {
      try {
        const url = new URL(proxyUrl);
        return {
          server: `${url.protocol}//${url.host}`,
          username: url.username || null,
          password: url.password || null,
          provider: 'custom',
          index
        };
      } catch (error) {
        console.error(`[ProxyManager] Proxy invalide ignoré: ${proxyUrl}`);
        return null;
      }
    }).filter(proxy => proxy !== null);
  }

  /**
   * Teste les proxies disponibles
   * @private
   */
  async _testProxies() {
    console.log('[ProxyManager] Test des proxies...');

    const validProxies = [];

    for (const proxy of this.proxyList) {
      const isValid = await this._testProxy(proxy);
      if (isValid) {
        validProxies.push(proxy);
      } else {
        console.warn(`[ProxyManager] ⚠️ Proxy échoué: ${proxy.server}`);
      }
    }

    this.proxyList = validProxies;

    if (this.proxyList.length === 0) {
      throw new Error('Aucun proxy valide trouvé');
    }

    console.log(`[ProxyManager] ✓ ${this.proxyList.length} proxy(s) valide(s)`);
  }

  /**
   * Teste un proxy individuel
   * @private
   */
  async _testProxy(proxy) {
    // TODO: Implémenter le test réel avec une requête HTTP simple
    // Pour l'instant, on considère tous les proxies comme valides
    return true;
  }

  /**
   * Récupère le prochain proxy selon la stratégie de rotation
   * @returns {Object|null} Configuration du proxy
   */
  getNextProxy() {
    if (!this.initialized || this.proxyList.length === 0) {
      return null;
    }

    let proxy;

    if (this.config.custom.rotation === 'random') {
      // Rotation aléatoire
      const availableProxies = this.proxyList.filter(
        p => !this.failedProxies.has(this._getProxyKey(p))
      );

      if (availableProxies.length === 0) {
        // Réinitialiser les proxies échoués
        this.failedProxies.clear();
        proxy = this.proxyList[Math.floor(Math.random() * this.proxyList.length)];
      } else {
        proxy = availableProxies[Math.floor(Math.random() * availableProxies.length)];
      }
    } else {
      // Rotation round-robin (par défaut)
      proxy = this.proxyList[this.currentProxyIndex];
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    }

    if (antiBotConfig.logging.logProxyChanges) {
      console.log(`[ProxyManager] 🔄 Utilisation du proxy: ${proxy.server} (${proxy.provider})`);
    }

    return proxy;
  }

  /**
   * Marque un proxy comme échoué
   * @param {Object} proxy - Configuration du proxy
   */
  markProxyAsFailed(proxy) {
    const key = this._getProxyKey(proxy);
    this.failedProxies.add(key);
    console.warn(`[ProxyManager] ⚠️ Proxy marqué comme échoué: ${proxy.server}`);

    // Si tous les proxies ont échoué, réinitialiser
    if (this.failedProxies.size >= this.proxyList.length) {
      console.log('[ProxyManager] ⚠️ Tous les proxies ont échoué, réinitialisation...');
      this.failedProxies.clear();
    }
  }

  /**
   * Génère une clé unique pour un proxy
   * @private
   */
  _getProxyKey(proxy) {
    return `${proxy.server}-${proxy.username}`;
  }

  /**
   * Récupère les statistiques du gestionnaire
   */
  getStats() {
    return {
      initialized: this.initialized,
      enabled: this.config.enabled,
      provider: this.config.provider,
      totalProxies: this.proxyList.length,
      failedProxies: this.failedProxies.size,
      currentIndex: this.currentProxyIndex
    };
  }

  /**
   * Réinitialise le gestionnaire
   */
  reset() {
    this.currentProxyIndex = 0;
    this.failedProxies.clear();
    console.log('[ProxyManager] ✓ Gestionnaire réinitialisé');
  }
}

// Instance singleton
let proxyManagerInstance = null;

/**
 * Récupère l'instance singleton du gestionnaire de proxies
 */
export function getProxyManager() {
  if (!proxyManagerInstance) {
    proxyManagerInstance = new ProxyManager();
  }
  return proxyManagerInstance;
}

/**
 * Réinitialise l'instance (utile pour les tests)
 */
export function resetProxyManager() {
  if (proxyManagerInstance) {
    proxyManagerInstance.reset();
    proxyManagerInstance = null;
  }
}

export default ProxyManager;
