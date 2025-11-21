import axios from 'axios';
import { getPlaywrightService } from './playwrightService.js';
import { SCRAPER_IDS, getScraperConfig } from '../config/antiBotConfig.js';

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
   * Recherche avec le scraper Playwright (VERSION AMÉLIORÉE)
   * @private
   */
  async _searchWithScraper(keyword, location, maxResults, onProgress) {
    console.log('[GoogleMapsService] 🚀 Utilisation du scraper Playwright AMÉLIORÉ');

    if (onProgress) onProgress(10, 'Initialisation du navigateur...');

    const playwrightService = getPlaywrightService(SCRAPER_IDS.GOOGLE_MAPS);
    let context = null;
    let page = null;

    try {
      // Initialiser Playwright
      await playwrightService.initialize();
      context = await playwrightService.createContext();
      page = await context.newPage();

      if (onProgress) onProgress(15, 'Navigation vers Google Maps...');

      // Construire l'URL de recherche Google Maps
      const searchQuery = `${keyword} ${location}`;
      const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

      console.log(`[GoogleMapsService] Navigation: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Attendre que les résultats se chargent
      await page.waitForTimeout(2000);

      if (onProgress) onProgress(20, 'Détection des résultats...');

      // Détecter le panneau de résultats (scrollable)
      const resultsSelector = 'div[role="feed"]';
      await page.waitForSelector(resultsSelector, { timeout: 10000 });

      console.log('[GoogleMapsService] ✓ Panneau de résultats détecté');

      if (onProgress) onProgress(25, 'Scroll pour charger plus de résultats...');

      // Infinite scroll pour charger tous les résultats nécessaires
      const loadedCount = await this._infiniteScrollResults(page, resultsSelector, maxResults, onProgress);

      console.log(`[GoogleMapsService] ✓ ${loadedCount} résultats chargés via scroll`);

      if (onProgress) onProgress(50, `Extraction détaillée de ${Math.min(loadedCount, maxResults)} prospects...`);

      // Extraire les détails de chaque résultat (avec clic)
      const prospects = await this._extractDetailedProspects(
        page,
        Math.min(loadedCount, maxResults),
        onProgress
      );

      if (onProgress) onProgress(100, 'Extraction terminée');

      console.log(`[GoogleMapsService] ✓ ${prospects.length} prospects extraits avec détails complets`);

      return prospects;

    } catch (error) {
      console.error('[GoogleMapsService] ❌ Erreur scraper:', error.message);
      throw error;
    } finally {
      if (context) {
        await playwrightService.closeContext(context);
      }
    }
  }

  /**
   * Scroll infini pour charger plus de résultats
   * @private
   */
  async _infiniteScrollResults(page, resultsSelector, targetCount, onProgress) {
    console.log(`[GoogleMapsService] 📜 Infinite scroll pour charger ${targetCount} résultats...`);

    const playwrightService = getPlaywrightService(SCRAPER_IDS.GOOGLE_MAPS);
    let previousCount = 0;
    let stableCount = 0;
    const maxStableIterations = 3;

    for (let iteration = 0; iteration < 20; iteration++) {
      // Compter les résultats actuellement chargés
      const currentCount = await page.evaluate((selector) => {
        const articles = document.querySelectorAll(`${selector} div[role="article"]`);
        return articles.length;
      }, resultsSelector);

      console.log(`[GoogleMapsService] Scroll ${iteration + 1}: ${currentCount} résultats chargés`);

      // Si on a atteint le nombre cible, arrêter
      if (currentCount >= targetCount) {
        console.log(`[GoogleMapsService] ✓ Objectif atteint: ${currentCount}/${targetCount}`);
        break;
      }

      // Si le nombre n'a pas changé, incrémenter le compteur stable
      if (currentCount === previousCount) {
        stableCount++;
        if (stableCount >= maxStableIterations) {
          console.log(`[GoogleMapsService] ⚠️ Plus de résultats disponibles (${currentCount} total)`);
          break;
        }
      } else {
        stableCount = 0;
      }

      previousCount = currentCount;

      // Scroll progressif dans le panneau de résultats
      await page.evaluate((selector) => {
        const feed = document.querySelector(selector);
        if (feed) {
          feed.scrollBy(0, feed.clientHeight * 0.8);
        }
      }, resultsSelector);

      // Attendre le chargement avec rate limiting
      await playwrightService.waitWithRateLimit();

      // Mettre à jour la progression
      if (onProgress) {
        const progress = 25 + Math.min((currentCount / targetCount) * 25, 25);
        onProgress(Math.round(progress), `Chargement: ${currentCount}/${targetCount} résultats...`);
      }
    }

    // Retourner au début de la liste
    await page.evaluate((selector) => {
      const feed = document.querySelector(selector);
      if (feed) {
        feed.scrollTo(0, 0);
      }
    }, resultsSelector);

    await page.waitForTimeout(500);

    return previousCount;
  }

  /**
   * Extrait les détails complets en cliquant sur chaque résultat
   * @private
   */
  async _extractDetailedProspects(page, count, onProgress) {
    console.log(`[GoogleMapsService] 📋 Extraction détaillée de ${count} prospects...`);

    const playwrightService = getPlaywrightService(SCRAPER_IDS.GOOGLE_MAPS);
    const prospects = [];

    // Sélecteur des articles
    const articleSelector = 'div[role="feed"] div[role="article"]';

    for (let i = 0; i < count; i++) {
      try {
        console.log(`[GoogleMapsService] Extraction prospect ${i + 1}/${count}...`);

        // Attendre que l'article soit disponible
        const article = await page.$(`:nth-match(${articleSelector}, ${i + 1})`);

        if (!article) {
          console.warn(`[GoogleMapsService] Article ${i + 1} non trouvé, skip`);
          continue;
        }

        // Scroll vers l'article de manière progressive
        await playwrightService.scrollToElement(page, `:nth-match(${articleSelector}, ${i + 1})`, {
          offset: -100,
          duration: 800
        });

        await page.waitForTimeout(300);

        // Cliquer sur l'article pour ouvrir le panneau de détails
        await article.click();
        console.log(`[GoogleMapsService] ✓ Clic sur prospect ${i + 1}`);

        // Attendre que le panneau de détails se charge
        await page.waitForTimeout(1500);

        // Extraire les informations du panneau de détails
        const prospect = await this._extractProspectDetails(page);

        if (prospect) {
          prospects.push(prospect);
          console.log(`[GoogleMapsService] ✓ Prospect ${i + 1}: ${prospect.nom_entreprise}`);
        }

        // Mettre à jour la progression
        if (onProgress) {
          const progress = 50 + Math.round(((i + 1) / count) * 50);
          onProgress(progress, `Extraction: ${i + 1}/${count} prospects...`);
        }

        // Rate limiting entre chaque extraction
        await playwrightService.waitWithRateLimit();

      } catch (error) {
        console.error(`[GoogleMapsService] ❌ Erreur extraction prospect ${i + 1}:`, error.message);
        // Continuer avec le suivant
      }
    }

    return prospects;
  }

  /**
   * Extrait les détails d'un prospect depuis le panneau latéral
   * @private
   */
  async _extractProspectDetails(page) {
    try {
      const details = await page.evaluate(() => {
        const data = {};

        // Nom de l'entreprise (heading principal)
        const nameEl = document.querySelector('h1');
        data.nom_entreprise = nameEl?.textContent?.trim() || 'Nom inconnu';

        // Adresse
        const addressButton = document.querySelector('button[data-item-id="address"]');
        data.adresse = addressButton?.textContent?.trim() || null;

        // Téléphone
        const phoneButton = document.querySelector('button[data-item-id^="phone"]');
        const phoneText = phoneButton?.textContent?.trim();
        data.telephone = phoneText || null;

        // Site web
        const websiteButton = document.querySelector('a[data-item-id="authority"]');
        data.url_site = websiteButton?.href || null;

        // Coordonnées GPS depuis l'URL
        const urlMatch = window.location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (urlMatch) {
          data.latitude = parseFloat(urlMatch[1]);
          data.longitude = parseFloat(urlMatch[2]);
        }

        // Note/avis (optionnel)
        const ratingEl = document.querySelector('span[role="img"]');
        const ratingText = ratingEl?.getAttribute('aria-label');
        if (ratingText) {
          const ratingMatch = ratingText.match(/(\d+[,.]?\d*)/);
          data.note = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;
        }

        return data;
      });

      // Formater le téléphone
      if (details.telephone) {
        details.telephone = this._formatPhoneNumber(details.telephone);
      }

      // Ajouter la source
      details.source_scraping = 'Google Maps Scraper (Enhanced)';
      details.email = null; // Google Maps ne fournit généralement pas d'email

      return details;

    } catch (error) {
      console.error('[GoogleMapsService] Erreur extraction détails:', error);
      return null;
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
    const scraperConfig = getScraperConfig(SCRAPER_IDS.GOOGLE_MAPS);
    return {
      strategy: this.strategy,
      apiKeyConfigured: !!this.apiKey,
      maxResults: this.maxResults,
      antiBotStrategy: scraperConfig.activeStrategy,
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
