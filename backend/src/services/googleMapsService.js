import axios from 'axios';
import { getPlaywrightService } from './playwrightService.js';
import { SCRAPER_IDS, getScraperConfig } from '../config/antiBotConfig.js';
import { normalizeKeyword, normalizeLocation } from '../utils/stringUtils.js';

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

    // Normaliser les mots-clés et localisation (retirer accents pour compatibilité URL)
    const normalizedKeyword = normalizeKeyword(keyword);
    const normalizedLocation = normalizeLocation(location);

    // Logger les mots-clés originaux et normalisés si différents
    if (normalizedKeyword !== keyword || normalizedLocation !== location) {
      console.log(`[GoogleMapsService] Normalisation des accents:`);
      if (normalizedKeyword !== keyword) {
        console.log(`  Keyword: "${keyword}" → "${normalizedKeyword}"`);
      }
      if (normalizedLocation !== location) {
        console.log(`  Location: "${location}" → "${normalizedLocation}"`);
      }
    }

    console.log(`[GoogleMapsService] Recherche: "${normalizedKeyword}" à "${normalizedLocation}" (stratégie: ${this.strategy})`);

    if (this.strategy === 'api') {
      return await this._searchWithAPI(normalizedKeyword, normalizedLocation, maxResults, onProgress);
    } else {
      return await this._searchWithScraper(normalizedKeyword, normalizedLocation, maxResults, onProgress);
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

      // Attendre que la page se stabilise
      await page.waitForTimeout(3000);

      // Gérer le popup de cookies Google si présent
      let cookieHandled = false;
      try {
        console.log('[GoogleMapsService] Vérification popup cookies...');

        // Vérifier si on est sur la page de consentement Google
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log(`[GoogleMapsService] Page actuelle: ${pageTitle}`);
        console.log(`[GoogleMapsService] URL actuelle: ${pageUrl}`);

        // Liste complète de sélecteurs pour les boutons de cookies
        const acceptButtonSelectors = [
          // Texte visible
          'button:has-text("Tout accepter")',
          'button:has-text("Accept all")',
          'button:has-text("Tout refuser")',
          'button:has-text("Reject all")',
          // IDs courants
          '#L2AGLb', // Bouton "Tout refuser" en français
          '#W0wltc', // Bouton "Tout accepter" en français
          // Sélecteurs plus génériques
          'button[aria-label*="Accepter"]',
          'button[aria-label*="Accept"]',
          'button[aria-label*="Refuser"]',
          'button[aria-label*="Reject"]',
          // Forme du bouton
          'form[action*="consent"] button',
          'div[role="dialog"] button'
        ];

        for (const selector of acceptButtonSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              const isVisible = await button.isVisible();
              if (isVisible) {
                console.log(`[GoogleMapsService] ✓ Bouton cookies trouvé: ${selector}`);
                await button.click();
                console.log('[GoogleMapsService] ✓ Clic effectué, attente de la redirection...');

                // Attendre que la page Google Maps se charge après le clic
                await page.waitForTimeout(3000);
                cookieHandled = true;
                break;
              }
            }
          } catch (err) {
            // Ignorer les erreurs pour continuer à tester les autres sélecteurs
            continue;
          }
        }

        if (!cookieHandled) {
          console.log('[GoogleMapsService] Aucun popup cookies détecté ou déjà géré');
        }
      } catch (error) {
        console.log('[GoogleMapsService] Erreur lors de la gestion des cookies:', error.message);
      }

      if (onProgress) onProgress(20, 'Détection des résultats...');

      // Détecter le panneau de résultats (scrollable)
      console.log('[GoogleMapsService] Recherche du panneau de résultats...');
      const resultsSelector = 'div[role="feed"]';
      await page.waitForSelector(resultsSelector, { timeout: 20000 });

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
    let currentCount = 0;
    let stableCount = 0;
    const maxStableIterations = 3;

    for (let iteration = 0; iteration < 20; iteration++) {
      // Compter les résultats actuellement chargés
      currentCount = await page.evaluate((selector) => {
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

    return currentCount;
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

    // Récupérer tous les articles d'un coup
    const articles = await page.$$(articleSelector);
    console.log(`[GoogleMapsService] ${articles.length} articles trouvés dans le DOM`);

    // Extraire directement depuis les cards de la liste (pas besoin de cliquer !)
    for (let i = 0; i < Math.min(count, articles.length); i++) {
      try {
        console.log(`[GoogleMapsService] Extraction prospect ${i + 1}/${count}...`);

        const article = articles[i];

        if (!article) {
          console.warn(`[GoogleMapsService] Article ${i + 1} non trouvé, skip`);
          continue;
        }

        // Extraire les informations directement depuis la card
        const prospect = await article.evaluate((el) => {
          const data = {};

          // DEBUG: Obtenir tout le HTML de l'article pour inspection
          data.debug_html = el.innerHTML.substring(0, 500); // Premiers 500 caractères

          // Nom de l'entreprise - le nom est dans aria-label du lien !
          let nameEl = el.querySelector('a[href*="/maps/place/"]');
          if (!nameEl) nameEl = el.querySelector('a.hfpxzc'); // Classe spécifique Google Maps

          // Le nom est dans aria-label, pas dans textContent
          let nom = null;
          if (nameEl) {
            nom = nameEl.getAttribute('aria-label');
            // Si pas d'aria-label, essayer le textContent
            if (!nom) nom = nameEl.textContent?.trim();
          }

          // Fallback sur d'autres sélecteurs si pas trouvé
          if (!nom) {
            const headingEl = el.querySelector('[class*="fontHeadline"]') || el.querySelector('div[role="heading"]');
            nom = headingEl?.textContent?.trim();
          }

          data.nom_entreprise = nom || 'Nom inconnu';
          data.debug_name_selector = nameEl ? 'found (aria-label)' : 'not found';

          // Adresse - chercher dans plusieurs endroits
          // L'adresse est dans un div/span séparé, généralement après la note
          let adresse = null;

          // Stratégie: Chercher UNIQUEMENT les divs/spans feuilles (sans enfants)
          // qui contiennent une vraie adresse
          const allElements = el.querySelectorAll('div, span');
          const addressCandidates = [];

          for (const element of allElements) {
            // IMPORTANT: Prendre UNIQUEMENT les éléments sans enfants (feuilles du DOM)
            if (element.children.length > 0) continue;

            const text = element.textContent?.trim();

            // Skip si vide ou trop court
            if (!text || text.length < 5) continue;

            // Skip si c'est exactement le nom de l'entreprise
            if (text === nom) continue;

            // Skip si c'est une note (ex: "4,6(322)")
            if (text.match(/^\d+[,.]?\d*\(\d+\)$/)) continue;

            // Skip si le texte contient le nom (= c'est un parent qui contient tout)
            if (text.includes(nom) && text.length > nom.length + 10) continue;

            // Skip si contient une note avec parenthèses (signe de concaténation)
            if (text.match(/\d+[,.]?\d*\(\d+\)/)) continue;

            // Score pour identifier une adresse
            let score = 0;

            // Bonus si contient un code postal français (5 chiffres)
            if (text.match(/\b\d{5}\b/)) score += 10;

            // Bonus si contient "rue", "avenue", "boulevard", etc.
            if (text.match(/\b(rue|avenue|av\.|bd|boulevard|impasse|place|chemin|allée)\b/i)) score += 8;

            // Bonus si commence par un numéro (ex: "15 rue de...")
            if (text.match(/^\d+[\s,]/)) score += 5;

            // Bonus si contient une ville connue
            if (text.match(/\b(Paris|Lyon|Marseille|Toulouse|Nice|Nantes|Bordeaux)\b/i)) score += 3;

            // Malus si contient des mots métier (signe que c'est pas une adresse pure)
            if (text.match(/\b(plombier|électricien|chauffagiste|dépannage|service|artisan)\b/i)) score -= 10;

            // Malus si trop long (probablement du texte concaténé)
            if (text.length > 100) score -= 5;

            if (score > 0) {
              addressCandidates.push({ text, score });
            }
          }

          // Prendre le candidat avec le meilleur score
          if (addressCandidates.length > 0) {
            addressCandidates.sort((a, b) => b.score - a.score);
            adresse = addressCandidates[0].text;
          }

          data.adresse = adresse;
          data.debug_address_selector = adresse ? `found (score: ${addressCandidates[0]?.score || 0})` : 'not found';

          // Téléphone - chercher un numéro de téléphone français
          let telephone = null;
          const phoneRegexes = [
            /\b0[1-9](?:[\s\.]?\d{2}){4}\b/,           // 01 23 45 67 89 ou 01.23.45.67.89
            /\b\+33[\s\.]?[1-9](?:[\s\.]?\d{2}){4}\b/, // +33 1 23 45 67 89
            /\b(?:0033|0)[\s\.]?[1-9](?:[\s\.]?\d{2}){4}\b/ // 0033 1 23 45 67 89
          ];

          // Chercher dans tous les éléments texte
          for (const element of allElements) {
            if (element.children.length > 0) continue;
            const text = element.textContent?.trim();
            if (!text) continue;

            // Tester chaque pattern de téléphone
            for (const regex of phoneRegexes) {
              const match = text.match(regex);
              if (match) {
                telephone = match[0];
                break;
              }
            }

            if (telephone) break;
          }

          data.telephone = telephone;
          data.debug_phone_selector = telephone ? 'found' : 'not found';

          // Note
          const ratingEl = el.querySelector('span[role="img"]');
          if (ratingEl) {
            const ariaLabel = ratingEl.getAttribute('aria-label');
            const match = ariaLabel?.match(/(\d+[,.]?\d*)/);
            data.note = match ? parseFloat(match[1].replace(',', '.')) : null;
          }
          data.debug_rating_selector = ratingEl ? 'found' : 'not found';

          // Site web (lien)
          const linkEl = el.querySelector('a[href*="/maps/place/"]');
          data.url_maps = linkEl?.href || null;
          data.debug_link_selector = linkEl ? 'found' : 'not found';

          return data;
        });

        // Mapper url_maps vers url_site pour correspondre au modèle DB
        prospect.url_site = prospect.url_maps;

        // Extraire latitude/longitude depuis l'URL Google Maps
        // Format principal: https://www.google.com/maps/place/.../data=!4m7!3m6!...!3d48.889609!4d2.344058!...
        // Format alternatif: https://www.google.com/maps/place/.../@48.8566,2.3522,17z/...
        if (prospect.url_maps) {
          // Essayer d'abord le format !3d/!4d (format data - plus commun)
          let coordsMatch = prospect.url_maps.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
          if (coordsMatch) {
            prospect.latitude = parseFloat(coordsMatch[1]);
            prospect.longitude = parseFloat(coordsMatch[2]);
          } else {
            // Fallback sur format @lat,lng (format classique)
            coordsMatch = prospect.url_maps.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (coordsMatch) {
              prospect.latitude = parseFloat(coordsMatch[1]);
              prospect.longitude = parseFloat(coordsMatch[2]);
            } else {
              prospect.latitude = null;
              prospect.longitude = null;
            }
          }
        } else {
          prospect.latitude = null;
          prospect.longitude = null;
        }

        // Logger les données extraites pour debug
        console.log(`[GoogleMapsService] 🔍 Debug prospect ${i + 1}:`, {
          nom: prospect.nom_entreprise,
          adresse: prospect.adresse?.substring(0, 50),
          telephone: prospect.telephone,
          note: prospect.note,
          url: prospect.url_site?.substring(0, 60),
          coords: prospect.latitude && prospect.longitude ? `${prospect.latitude}, ${prospect.longitude}` : 'N/A',
          selectors: {
            name: prospect.debug_name_selector,
            address: prospect.debug_address_selector,
            phone: prospect.debug_phone_selector,
            rating: prospect.debug_rating_selector,
            link: prospect.debug_link_selector
          }
        });

        // Logger le HTML pour inspection (seulement le premier pour éviter spam)
        if (i === 0) {
          console.log(`[GoogleMapsService] 📄 HTML du premier article:\n${prospect.debug_html}`);
        }

        // Formater et ajouter les champs manquants
        prospect.email = null; // Jamais visible dans la liste
        prospect.source_scraping = 'Google Maps Scraper (Enhanced)';

        if (prospect && prospect.nom_entreprise && prospect.nom_entreprise !== 'Nom inconnu') {
          prospects.push(prospect);
          console.log(`[GoogleMapsService] ✓ Prospect ${i + 1}: ${prospect.nom_entreprise}`);
        } else {
          console.log(`[GoogleMapsService] ⚠️ Prospect ${i + 1}: données incomplètes, ignoré`);
        }

        // Mettre à jour la progression
        if (onProgress) {
          const progress = 50 + Math.round(((i + 1) / count) * 50);
          onProgress(progress, `Extraction: ${i + 1}/${count} prospects...`);
        }

        // Pas besoin de rate limiting si on ne clique pas
        await page.waitForTimeout(100);

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

        // Cibler spécifiquement le panneau de détails (role="main")
        const mainPanel = document.querySelector('div[role="main"]');

        if (!mainPanel) {
          console.log('[Extract] Panneau principal non trouvé');
          data.nom_entreprise = 'Nom inconnu';
          return data;
        }

        // Nom de l'entreprise - chercher dans le panneau principal uniquement
        let nameEl = mainPanel.querySelector('h1.DUwDvf');
        if (!nameEl) nameEl = mainPanel.querySelector('h1[class*="fontHeadline"]');
        if (!nameEl) nameEl = mainPanel.querySelector('h1');
        if (!nameEl) nameEl = mainPanel.querySelector('h2');

        // Filtrer "Résultats" qui est le titre de la sidebar
        let nomEntreprise = nameEl?.textContent?.trim() || 'Nom inconnu';
        if (nomEntreprise === 'Résultats' || nomEntreprise === 'Results') {
          // Essayer un autre sélecteur plus spécifique
          nameEl = mainPanel.querySelector('[class*="fontHeadline"]');
          nomEntreprise = nameEl?.textContent?.trim() || 'Nom inconnu';
        }

        data.nom_entreprise = nomEntreprise;

        // Adresse - essayer plusieurs sélecteurs
        let addressButton = document.querySelector('button[data-item-id="address"]');
        if (!addressButton) addressButton = document.querySelector('[data-item-id="address"]');
        if (!addressButton) addressButton = document.querySelector('button[aria-label*="Adresse"]');
        data.adresse = addressButton?.textContent?.trim() || null;

        // Téléphone - essayer plusieurs sélecteurs
        let phoneButton = document.querySelector('button[data-item-id^="phone"]');
        if (!phoneButton) phoneButton = document.querySelector('[data-item-id^="phone"]');
        if (!phoneButton) phoneButton = document.querySelector('button[aria-label*="Téléphone"]');
        if (!phoneButton) phoneButton = document.querySelector('button[aria-label*="Phone"]');
        data.telephone = phoneButton?.textContent?.trim() || null;

        // Site web - essayer plusieurs sélecteurs
        let websiteButton = document.querySelector('a[data-item-id="authority"]');
        if (!websiteButton) websiteButton = document.querySelector('[data-item-id="authority"]');
        if (!websiteButton) websiteButton = document.querySelector('a[aria-label*="Site Web"]');
        if (!websiteButton) websiteButton = document.querySelector('a[aria-label*="Website"]');
        data.url_site = websiteButton?.href || null;

        // Coordonnées GPS depuis l'URL
        const urlMatch = window.location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (urlMatch) {
          data.latitude = parseFloat(urlMatch[1]);
          data.longitude = parseFloat(urlMatch[2]);
        }

        // Note/avis (optionnel)
        const ratingEl = document.querySelector('span[role="img"][aria-label*="étoiles"]');
        if (!ratingEl) {
          const ratingText = document.querySelector('div[role="img"][aria-label*="étoiles"]')?.getAttribute('aria-label');
          if (ratingText) {
            const ratingMatch = ratingText.match(/(\d+[,.]?\d*)/);
            data.note = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;
          }
        } else {
          const ratingText = ratingEl.getAttribute('aria-label');
          if (ratingText) {
            const ratingMatch = ratingText.match(/(\d+[,.]?\d*)/);
            data.note = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;
          }
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
