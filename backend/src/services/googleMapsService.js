import axios from 'axios';
import { getPlaywrightService } from './playwrightService.js';
import { antiBotConfig } from '../config/antiBotConfig.js';

/**
 * Service principal pour Google Maps
 * Permet de basculer entre le scraper Playwright et l'API Google Places
 */

class GoogleMapsService {
  constructor() {
    this.strategy = process.env.GOOGLE_MAPS_STRATEGY || 'scraper';
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.maxResults = parseInt(process.env.GOOGLE_PLACES_MAX_RESULTS || '20');
  }

  /**
   * Recherche des prospects sur Google Maps
   * @param {Object} params - Paramètres de recherche
   * @param {string} params.keyword - Mot-clé de recherche (ex: "plombier")
   * @param {string} params.location - Localisation (ex: "Paris")
   * @param {number} params.maxResults - Nombre max de résultats
   * @param {Function} onProgress - Callback de progression
   * @returns {Promise<Array>} Liste des prospects
   */
  async search(params, onProgress = null) {
    const { keyword, location, maxResults = this.maxResults } = params;

    console.log(`[GoogleMapsService] Recherche: "${keyword}" à "${location}" (stratégie: ${this.strategy})`);

    if (this.strategy === 'api') {
      return await this._searchWithAPI(keyword, location, maxResults, onProgress);
    } else {
      return await this._searchWithScraper(keyword, location, maxResults, onProgress);
    }
  }

  /**
   * Recherche avec l'API Google Places
   * @private
   */
  async _searchWithAPI(keyword, location, maxResults, onProgress) {
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY non configurée. Veuillez ajouter votre clé API dans le fichier .env');
    }

    console.log('[GoogleMapsService] Utilisation de Google Places API');

    try {
      const prospects = [];

      // Étape 1: Text Search pour trouver les lieux
      if (onProgress) onProgress(10, 'Recherche des lieux...');

      const searchQuery = `${keyword} ${location}`;
      const searchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

      let nextPageToken = null;
      let pagesScraped = 0;
      const maxPages = Math.ceil(maxResults / 20); // API retourne max 20 résultats par page

      do {
        const searchParams = {
          query: searchQuery,
          key: this.apiKey,
          language: 'fr',
          region: 'fr',
        };

        if (nextPageToken) {
          searchParams.pagetoken = nextPageToken;
          // Attendre 2 secondes avant la prochaine page (requis par Google)
          await this._delay(2000);
        }

        const searchResponse = await axios.get(searchUrl, { params: searchParams });

        if (searchResponse.data.status !== 'OK' && searchResponse.data.status !== 'ZERO_RESULTS') {
          throw new Error(`Google Places API Error: ${searchResponse.data.status} - ${searchResponse.data.error_message || 'Unknown error'}`);
        }

        const results = searchResponse.data.results || [];
        console.log(`[GoogleMapsService] Page ${pagesScraped + 1}: ${results.length} lieux trouvés`);

        // Étape 2: Récupérer les détails de chaque lieu
        for (let i = 0; i < results.length && prospects.length < maxResults; i++) {
          const place = results[i];

          if (onProgress) {
            const progress = 10 + ((prospects.length / maxResults) * 80);
            onProgress(Math.round(progress), `Extraction ${prospects.length + 1}/${maxResults}...`);
          }

          try {
            // Place Details API pour obtenir contact, site web, etc.
            const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
            const detailsParams = {
              place_id: place.place_id,
              fields: 'name,formatted_address,formatted_phone_number,website,geometry,types',
              key: this.apiKey,
              language: 'fr',
            };

            const detailsResponse = await axios.get(detailsUrl, { params: detailsParams });

            if (detailsResponse.data.status === 'OK') {
              const details = detailsResponse.data.result;

              const prospect = {
                nom_entreprise: details.name,
                adresse: details.formatted_address || place.formatted_address,
                telephone: this._formatPhoneNumber(details.formatted_phone_number),
                url_site: details.website || null,
                email: null, // Non disponible via l'API
                latitude: details.geometry?.location?.lat || place.geometry?.location?.lat,
                longitude: details.geometry?.location?.lng || place.geometry?.location?.lng,
                types: details.types || place.types || [],
                source_scraping: 'Google Maps API',
              };

              prospects.push(prospect);
              console.log(`[GoogleMapsService] ✓ Extrait: ${prospect.nom_entreprise}`);
            }

            // Rate limiting: 10 requêtes/seconde max
            await this._delay(100);

          } catch (error) {
            console.error(`[GoogleMapsService] Erreur extraction lieu ${place.name}:`, error.message);
          }
        }

        nextPageToken = searchResponse.data.next_page_token;
        pagesScraped++;

      } while (nextPageToken && prospects.length < maxResults && pagesScraped < maxPages);

      if (onProgress) onProgress(100, 'Recherche terminée');

      console.log(`[GoogleMapsService] ✓ ${prospects.length} prospects extraits via API`);
      return prospects;

    } catch (error) {
      console.error('[GoogleMapsService] Erreur API:', error.message);
      throw error;
    }
  }

  /**
   * Recherche avec le scraper Playwright
   * @private
   */
  async _searchWithScraper(keyword, location, maxResults, onProgress) {
    console.log('[GoogleMapsService] Utilisation du scraper Playwright');

    if (onProgress) onProgress(10, 'Initialisation du navigateur...');

    const playwrightService = getPlaywrightService();
    let context = null;
    let page = null;

    try {
      // Initialiser Playwright
      await playwrightService.initialize();
      context = await playwrightService.createContext();
      page = await context.newPage();

      if (onProgress) onProgress(20, 'Navigation vers Google Maps...');

      // Construire l'URL de recherche Google Maps
      const searchQuery = `${keyword} ${location}`;
      const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

      console.log(`[GoogleMapsService] Navigation: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Attendre que les résultats se chargent
      await page.waitForTimeout(3000);

      if (onProgress) onProgress(40, 'Extraction des résultats...');

      // Scraper la liste de résultats
      const prospects = await page.evaluate((maxResults) => {
        const results = [];

        // Sélecteurs pour Google Maps (peuvent changer)
        const placeElements = document.querySelectorAll('div[role="article"]');

        for (let i = 0; i < Math.min(placeElements.length, maxResults); i++) {
          const element = placeElements[i];

          try {
            const nameEl = element.querySelector('[role="heading"]');
            const addressEl = element.querySelector('[class*="address"]');

            const prospect = {
              nom_entreprise: nameEl?.textContent?.trim() || 'Nom inconnu',
              adresse: addressEl?.textContent?.trim() || null,
              telephone: null, // Nécessite de cliquer sur chaque résultat
              url_site: null,
              email: null,
              source_scraping: 'Google Maps Scraper',
            };

            results.push(prospect);
          } catch (error) {
            console.error('Erreur extraction élément:', error);
          }
        }

        return results;
      }, maxResults);

      if (onProgress) onProgress(100, 'Extraction terminée');

      console.log(`[GoogleMapsService] ✓ ${prospects.length} prospects extraits via scraper`);

      // Note: Le scraper basique ci-dessus extrait seulement les noms et adresses
      // Pour obtenir téléphone/site web, il faudrait cliquer sur chaque résultat
      // Ce qui augmente significativement le temps et le risque de détection

      return prospects;

    } catch (error) {
      console.error('[GoogleMapsService] Erreur scraper:', error.message);
      throw error;
    } finally {
      if (context) {
        await playwrightService.closeContext(context);
      }
    }
  }

  /**
   * Formate un numéro de téléphone français
   * @private
   */
  _formatPhoneNumber(phone) {
    if (!phone) return null;

    // Nettoyer le numéro
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Format français: 01 23 45 67 89
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }

    // Format international: +33 1 23 45 67 89
    if (cleaned.startsWith('+33') && cleaned.length === 12) {
      return cleaned.replace(/(\+\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');
    }

    return phone;
  }

  /**
   * Delay helper
   * @private
   */
  async _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Change la stratégie (scraper ou api)
   * @param {string} strategy - 'scraper' ou 'api'
   */
  setStrategy(strategy) {
    if (!['scraper', 'api'].includes(strategy)) {
      throw new Error(`Stratégie invalide: ${strategy}. Doit être 'scraper' ou 'api'`);
    }
    this.strategy = strategy;
    console.log(`[GoogleMapsService] Stratégie changée: ${strategy}`);
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig() {
    return {
      strategy: this.strategy,
      apiKeyConfigured: !!this.apiKey,
      maxResults: this.maxResults,
      antiBotStrategy: antiBotConfig.strategy,
    };
  }
}

// Instance singleton
let googleMapsServiceInstance = null;

/**
 * Récupère l'instance singleton du service Google Maps
 */
export function getGoogleMapsService() {
  if (!googleMapsServiceInstance) {
    googleMapsServiceInstance = new GoogleMapsService();
  }
  return googleMapsServiceInstance;
}

export default GoogleMapsService;
