/**
 * Service de geocoding inversé (reverse geocoding)
 * Convertit des coordonnées GPS (latitude, longitude) en adresse complète
 * avec ville et code postal
 *
 * Utilise 2 APIs gratuites en cascade :
 * 1. API Gouvernementale française (api-adresse.data.gouv.fr) - Prioritaire
 * 2. Nominatim OpenStreetMap - Fallback
 */

import axios from 'axios';

class GeocodingService {
  constructor() {
    // Cache local pour éviter requêtes répétées
    this.cache = new Map();

    // Configuration API Gouvernementale française
    this.gouvApiUrl = 'https://api-adresse.data.gouv.fr/reverse/';

    // Configuration Nominatim (fallback)
    this.nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';
    this.nominatimHeaders = {
      'User-Agent': 'Outil-Scraping/1.0 (muratyannick.dev@gmail.com)', // Requis par Nominatim
    };

    // Stats pour monitoring
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      gouvApiSuccess: 0,
      nominatimSuccess: 0,
      failures: 0,
    };
  }

  /**
   * Génère une clé de cache depuis les coordonnées
   * Arrondi à 4 décimales (~11m de précision) pour mutualiser les requêtes proches
   * @private
   */
  _getCacheKey(latitude, longitude) {
    const lat = parseFloat(latitude).toFixed(4);
    const lng = parseFloat(longitude).toFixed(4);
    return `${lat},${lng}`;
  }

  /**
   * Récupère ville et code postal depuis le cache
   * @private
   */
  _getFromCache(latitude, longitude) {
    const key = this._getCacheKey(latitude, longitude);
    return this.cache.get(key);
  }

  /**
   * Sauvegarde ville et code postal dans le cache
   * @private
   */
  _saveToCache(latitude, longitude, data) {
    const key = this._getCacheKey(latitude, longitude);
    this.cache.set(key, data);
  }

  /**
   * Appelle l'API Gouvernementale française (prioritaire)
   * @private
   */
  async _reverseGeocodeGouv(latitude, longitude) {
    try {
      console.log(`[Geocoding] 🇫🇷 API Gouv: lat=${latitude}, lon=${longitude}`);

      const response = await axios.get(this.gouvApiUrl, {
        params: {
          lat: latitude,
          lon: longitude,
        },
        timeout: 5000,
      });

      if (response.data && response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const properties = feature.properties;

        const result = {
          ville: properties.city || properties.town || properties.village || properties.municipality || null,
          code_postal: properties.postcode || null,
          source: 'api-gouv',
        };

        console.log(`[Geocoding] ✅ API Gouv: ${result.ville} (${result.code_postal})`);
        this.stats.gouvApiSuccess++;
        return result;
      }

      console.log(`[Geocoding] ⚠️ API Gouv: Aucun résultat`);
      return null;
    } catch (error) {
      console.error(`[Geocoding] ❌ API Gouv erreur:`, error.message);
      return null;
    }
  }

  /**
   * Appelle Nominatim OpenStreetMap (fallback)
   * @private
   */
  async _reverseGeocodeNominatim(latitude, longitude) {
    try {
      console.log(`[Geocoding] 🌍 Nominatim: lat=${latitude}, lon=${longitude}`);

      const response = await axios.get(this.nominatimUrl, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
        },
        headers: this.nominatimHeaders,
        timeout: 5000,
      });

      if (response.data && response.data.address) {
        const address = response.data.address;

        const result = {
          ville: address.city || address.town || address.village || address.municipality || null,
          code_postal: address.postcode || null,
          source: 'nominatim',
        };

        console.log(`[Geocoding] ✅ Nominatim: ${result.ville} (${result.code_postal})`);
        this.stats.nominatimSuccess++;
        return result;
      }

      console.log(`[Geocoding] ⚠️ Nominatim: Aucun résultat`);
      return null;
    } catch (error) {
      console.error(`[Geocoding] ❌ Nominatim erreur:`, error.message);
      return null;
    }
  }

  /**
   * Convertit des coordonnées GPS en ville et code postal
   *
   * @param {number} latitude - Latitude GPS
   * @param {number} longitude - Longitude GPS
   * @returns {Promise<{ville: string|null, code_postal: string|null, source: string}>}
   *
   * @example
   * const result = await geocodingService.reverseGeocode(48.8566, 2.3522);
   * // { ville: "Paris", code_postal: "75001", source: "api-gouv" }
   */
  async reverseGeocode(latitude, longitude) {
    this.stats.totalRequests++;

    // Validation des coordonnées
    if (!latitude || !longitude) {
      console.warn('[Geocoding] ⚠️ Coordonnées manquantes');
      this.stats.failures++;
      return { ville: null, code_postal: null, source: 'error' };
    }

    // Vérifier le cache
    const cached = this._getFromCache(latitude, longitude);
    if (cached) {
      console.log(`[Geocoding] 💾 Cache hit: ${cached.ville} (${cached.code_postal})`);
      this.stats.cacheHits++;
      return cached;
    }

    // Essayer API Gouv (prioritaire)
    let result = await this._reverseGeocodeGouv(latitude, longitude);

    // Fallback sur Nominatim si API Gouv échoue
    if (!result || (!result.ville && !result.code_postal)) {
      console.log('[Geocoding] 🔄 Fallback sur Nominatim...');

      // Rate limiting Nominatim (max 1 req/sec)
      await this._delay(1000);

      result = await this._reverseGeocodeNominatim(latitude, longitude);
    }

    // Si toujours pas de résultat
    if (!result || (!result.ville && !result.code_postal)) {
      console.warn('[Geocoding] ❌ Échec: Aucune API n\'a retourné de résultat');
      this.stats.failures++;
      return { ville: null, code_postal: null, source: 'error' };
    }

    // Sauvegarder dans le cache
    this._saveToCache(latitude, longitude, result);

    return result;
  }

  /**
   * Délai asynchrone
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Récupère les statistiques du service
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      cacheHitRate: this.stats.totalRequests > 0
        ? Math.round((this.stats.cacheHits / this.stats.totalRequests) * 100)
        : 0,
    };
  }

  /**
   * Vide le cache
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[Geocoding] 🗑️ Cache vidé (${size} entrées supprimées)`);
  }

  /**
   * Réinitialise les statistiques
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      gouvApiSuccess: 0,
      nominatimSuccess: 0,
      failures: 0,
    };
    console.log('[Geocoding] 📊 Statistiques réinitialisées');
  }
}

// Export singleton
const geocodingService = new GeocodingService();
export default geocodingService;

// Export classe pour tests
export { GeocodingService };
