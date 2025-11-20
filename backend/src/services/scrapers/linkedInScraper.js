import { getPlaywrightService } from "../playwrightService.js";

/**
 * Scraper pour LinkedIn (Mode Public)
 * Extrait les informations de base depuis les profils publics LinkedIn
 *
 * ⚠️ LIMITATIONS :
 * - Mode public uniquement (pas d'authentification)
 * - Volume limité : 5-10 profils par session
 * - Données de base : nom, titre, entreprise, localisation
 * - Rate limiting agressif : 10-30s entre profils
 * - CAPTCHA possible en usage intensif
 *
 * 📋 RECOMMANDATION : Usage ponctuel, pas de scraping massif
 */

class LinkedInScraper {
  constructor() {
    this.playwrightService = getPlaywrightService();
    this.baseUrl = "https://www.linkedin.com";

    // Limites strictes pour éviter détection
    this.maxProfilesPerSession = 10;
    this.minDelayBetweenProfiles = 10000; // 10 secondes minimum
    this.maxDelayBetweenProfiles = 30000; // 30 secondes maximum

    // Compteur de profils scrapés dans cette session
    this.profilesScraped = 0;
    this.captchaDetected = false;
  }

  /**
   * Construit une URL de profil LinkedIn
   * @param {string} profileId - ID du profil (ex: "jean-dupont")
   */
  buildProfileUrl(profileId) {
    return `${this.baseUrl}/in/${profileId}/`;
  }

  /**
   * Recherche des profils LinkedIn via Google
   * (Évite la recherche LinkedIn authentifiée)
   * @param {string} keyword - Mot-clé (ex: "développeur", "plombier")
   * @param {string} location - Localisation (ex: "Paris", "Lyon")
   * @param {number} maxResults - Nombre max de résultats (limité à 10)
   */
  async searchProfilesViaGoogle(keyword, location, maxResults = 10) {
    // Limiter strictement le nombre de résultats
    const limit = Math.min(maxResults, this.maxProfilesPerSession);

    // Construction de la requête Google
    const googleQuery = `site:linkedin.com/in/ "${keyword}" "${location}"`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}&num=${limit}`;

    console.log(`[LinkedInScraper] Recherche Google: ${googleQuery}`);
    console.log(`[LinkedInScraper] Limite de résultats: ${limit}`);

    return {
      query: googleQuery,
      url: googleUrl,
      maxResults: limit
    };
  }

  /**
   * Extrait les URLs de profils depuis les résultats Google
   * @param {Page} page - Page Playwright
   */
  async extractProfileUrlsFromGoogle(page) {
    try {
      // Attendre le chargement des résultats Google
      await page.waitForSelector('div#search', { timeout: 10000 });

      // Extraire les URLs de profils LinkedIn
      const profileUrls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="linkedin.com/in/"]'));
        const urls = links
          .map(link => link.href)
          .filter(url => {
            // Filtrer les URLs valides de profils
            const match = url.match(/linkedin\.com\/in\/([^/?]+)/);
            return match && !url.includes('/posts/') && !url.includes('/activity/');
          })
          .map(url => {
            // Nettoyer l'URL
            const match = url.match(/linkedin\.com\/in\/([^/?]+)/);
            return match ? `https://www.linkedin.com/in/${match[1]}/` : null;
          })
          .filter(url => url !== null);

        // Dédupliquer
        return [...new Set(urls)];
      });

      console.log(`[LinkedInScraper] ${profileUrls.length} URLs de profils extraites depuis Google`);

      return profileUrls;
    } catch (error) {
      console.error(`[LinkedInScraper] Erreur extraction URLs depuis Google:`, error.message);
      return [];
    }
  }

  /**
   * Détecte si LinkedIn affiche un CAPTCHA
   * @param {Page} page - Page Playwright
   */
  async detectCaptcha(page) {
    try {
      const captchaDetected = await page.evaluate(() => {
        // Différents indicateurs de CAPTCHA
        const captchaSelectors = [
          'iframe[src*="captcha"]',
          'div[class*="captcha"]',
          'div[class*="challenge"]',
          '#captcha-internal',
          'form[action*="challenge"]'
        ];

        for (const selector of captchaSelectors) {
          if (document.querySelector(selector)) {
            return true;
          }
        }

        // Vérifier le texte de la page
        const bodyText = document.body.textContent.toLowerCase();
        if (bodyText.includes('let\'s do a quick security check') ||
            bodyText.includes('verify you\'re a human') ||
            bodyText.includes('security verification')) {
          return true;
        }

        return false;
      });

      if (captchaDetected) {
        console.warn(`[LinkedInScraper] ⚠️ CAPTCHA détecté - Arrêt du scraping`);
        this.captchaDetected = true;
      }

      return captchaDetected;
    } catch (error) {
      console.error(`[LinkedInScraper] Erreur détection CAPTCHA:`, error.message);
      return false;
    }
  }

  /**
   * Extrait les données JSON-LD du profil (méthode prioritaire)
   * @param {Page} page - Page Playwright
   */
  async extractJsonLdData(page) {
    try {
      const jsonLdData = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);

            // LinkedIn utilise le format Person ou ProfilePage
            if (data['@type'] === 'Person' || data['@type'] === 'ProfilePage') {
              return data;
            }
          } catch (e) {
            // Ignorer les erreurs de parsing
            continue;
          }
        }

        return null;
      });

      if (jsonLdData) {
        console.log(`[LinkedInScraper] ✓ Données JSON-LD extraites`);

        // Parser les données JSON-LD
        const prospect = {
          nom_entreprise: null,
          nom_contact: null,
          email: null,
          telephone: null,
          adresse: null,
          url_site: null,
          source_scraping: "LinkedIn"
        };

        // Nom complet
        if (jsonLdData.name) {
          prospect.nom_contact = jsonLdData.name.trim();
        }

        // Titre professionnel + Entreprise
        if (jsonLdData.jobTitle) {
          const jobTitle = jsonLdData.jobTitle.trim();

          // Essayer d'extraire l'entreprise depuis le titre
          // Format typique : "Développeur chez ABC Corp" ou "Développeur at ABC Corp"
          const match = jobTitle.match(/(?:chez|at|@)\s+(.+?)(?:\s*\||$)/i);
          if (match) {
            prospect.nom_entreprise = match[1].trim();
          }
        }

        // Localisation
        if (jsonLdData.address) {
          if (typeof jsonLdData.address === 'string') {
            prospect.adresse = jsonLdData.address.trim();
          } else if (jsonLdData.address.addressLocality) {
            prospect.adresse = jsonLdData.address.addressLocality.trim();
          }
        }

        // URL du profil
        if (jsonLdData.url) {
          prospect.url_site = jsonLdData.url;
        }

        return prospect;
      }

      return null;
    } catch (error) {
      console.error(`[LinkedInScraper] Erreur extraction JSON-LD:`, error.message);
      return null;
    }
  }

  /**
   * Extrait les données via sélecteurs CSS (fallback)
   * @param {Page} page - Page Playwright
   */
  async extractCssData(page) {
    try {
      console.log(`[LinkedInScraper] Extraction via sélecteurs CSS (fallback)`);

      const cssData = await page.evaluate(() => {
        const data = {
          name: null,
          headline: null,
          location: null,
          company: null,
          photoUrl: null
        };

        // Nom (plusieurs sélecteurs possibles - changent fréquemment)
        const nameSelectors = [
          'h1.top-card-layout__title',
          'h1.text-heading-xlarge',
          'h1[class*="top-card"]',
          '.pv-text-details__name',
          '.ph5 h1'
        ];
        for (const selector of nameSelectors) {
          const el = document.querySelector(selector);
          if (el && el.textContent.trim()) {
            data.name = el.textContent.trim();
            break;
          }
        }

        // Titre professionnel (headline)
        const headlineSelectors = [
          'div.top-card-layout__headline',
          'div.text-body-medium',
          'div[class*="headline"]',
          '.pv-text-details__headline'
        ];
        for (const selector of headlineSelectors) {
          const el = document.querySelector(selector);
          if (el && el.textContent.trim()) {
            data.headline = el.textContent.trim();
            break;
          }
        }

        // Localisation
        const locationSelectors = [
          'div.top-card-layout__location',
          'span.top-card-layout__location-text',
          'span[class*="location"]',
          '.pv-text-details__location'
        ];
        for (const selector of locationSelectors) {
          const el = document.querySelector(selector);
          if (el && el.textContent.trim()) {
            data.location = el.textContent.trim();
            break;
          }
        }

        // Entreprise actuelle (depuis headline si présent)
        if (data.headline) {
          const match = data.headline.match(/(?:chez|at|@)\s+(.+?)(?:\s*\||$)/i);
          if (match) {
            data.company = match[1].trim();
          }
        }

        // Photo de profil
        const photoSelectors = [
          'img.top-card__profile-photo-container',
          'img[class*="profile-photo"]',
          'img[class*="avatar"]'
        ];
        for (const selector of photoSelectors) {
          const el = document.querySelector(selector);
          if (el && el.src) {
            data.photoUrl = el.src;
            break;
          }
        }

        return data;
      });

      // Convertir au format prospect
      const prospect = {
        nom_entreprise: cssData.company,
        nom_contact: cssData.name,
        email: null,
        telephone: null,
        adresse: cssData.location,
        url_site: null,
        source_scraping: "LinkedIn"
      };

      console.log(`[LinkedInScraper] ✓ Données CSS extraites`);

      return prospect;
    } catch (error) {
      console.error(`[LinkedInScraper] Erreur extraction CSS:`, error.message);
      return null;
    }
  }

  /**
   * Scrape un profil LinkedIn (méthode principale)
   * @param {Page} page - Page Playwright
   * @param {string} profileUrl - URL du profil
   */
  async scrapeProfile(page, profileUrl) {
    try {
      console.log(`[LinkedInScraper] Scraping profil: ${profileUrl}`);

      // Vérifier la limite de session
      if (this.profilesScraped >= this.maxProfilesPerSession) {
        console.warn(`[LinkedInScraper] ⚠️ Limite de session atteinte (${this.maxProfilesPerSession} profils)`);
        return null;
      }

      // Vérifier si CAPTCHA déjà détecté
      if (this.captchaDetected) {
        console.warn(`[LinkedInScraper] ⚠️ CAPTCHA détecté précédemment - Arrêt du scraping`);
        return null;
      }

      // Navigation vers le profil avec délai réaliste
      await this.playwrightService.navigateToPage(page, profileUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      // Délai pour laisser charger le JavaScript
      await this.playwrightService.delay(3000);

      // Détecter CAPTCHA
      const captchaDetected = await this.detectCaptcha(page);
      if (captchaDetected) {
        return null;
      }

      // Vérifier si le profil est accessible (pas de page d'erreur)
      const isAccessible = await page.evaluate(() => {
        const bodyText = document.body.textContent.toLowerCase();

        // Détecter pages d'erreur ou profil non accessible
        if (bodyText.includes('page not found') ||
            bodyText.includes('this profile is not available') ||
            bodyText.includes('member not found')) {
          return false;
        }

        return true;
      });

      if (!isAccessible) {
        console.warn(`[LinkedInScraper] Profil non accessible ou n'existe pas`);
        return null;
      }

      // Scroll léger pour simuler comportement humain
      await this.playwrightService.smoothScroll(page, 300);
      await this.playwrightService.delay(1000);

      // Extraction 1: JSON-LD (méthode prioritaire - plus stable)
      let prospect = await this.extractJsonLdData(page);

      // Extraction 2: CSS Fallback (si JSON-LD échoue ou incomplet)
      if (!prospect || !prospect.nom_contact) {
        console.log(`[LinkedInScraper] JSON-LD incomplet, utilisation du fallback CSS`);
        const cssData = await this.extractCssData(page);

        // Merger les données
        if (prospect) {
          prospect = { ...prospect, ...cssData };
        } else {
          prospect = cssData;
        }
      }

      // Ajouter l'URL du profil
      if (prospect) {
        prospect.url_site = profileUrl;
        this.profilesScraped++;

        console.log(`[LinkedInScraper] ✓ Profil extrait: ${prospect.nom_contact || 'Nom inconnu'}`);
        console.log(`[LinkedInScraper] Profils scrapés dans cette session: ${this.profilesScraped}/${this.maxProfilesPerSession}`);
      }

      return prospect;

    } catch (error) {
      console.error(`[LinkedInScraper] Erreur scraping profil ${profileUrl}:`, error.message);
      return null;
    }
  }

  /**
   * Scrape plusieurs profils LinkedIn
   * @param {string} keyword - Mot-clé de recherche
   * @param {string} location - Localisation
   * @param {Object} options - Options de scraping
   */
  async scrape(keyword, location, options = {}) {
    const {
      maxResults = 5,
      onProgress = null
    } = options;

    console.log(`[LinkedInScraper] ═══════════════════════════════════════`);
    console.log(`[LinkedInScraper] Démarrage scraping LinkedIn`);
    console.log(`[LinkedInScraper] Keyword: "${keyword}"`);
    console.log(`[LinkedInScraper] Location: "${location}"`);
    console.log(`[LinkedInScraper] Max résultats: ${Math.min(maxResults, this.maxProfilesPerSession)}`);
    console.log(`[LinkedInScraper] ═══════════════════════════════════════`);

    // Reset des compteurs
    this.profilesScraped = 0;
    this.captchaDetected = false;

    const prospects = [];
    let page = null;

    try {
      // Créer un contexte Playwright avec anti-détection
      const context = await this.playwrightService.createContext({
        antiBot: "HYBRID" // Stealth + Human Behavior + Rate Limiting
      });

      page = await context.newPage();

      // Étape 1: Recherche via Google (évite recherche LinkedIn authentifiée)
      console.log(`[LinkedInScraper] Étape 1/3: Recherche Google des profils`);

      const searchInfo = await this.searchProfilesViaGoogle(keyword, location, maxResults);

      if (onProgress) {
        onProgress({
          step: "search",
          message: `Recherche de profils via Google...`,
          progress: 10
        });
      }

      // Navigation vers Google
      await this.playwrightService.navigateToPage(page, searchInfo.url, {
        waitUntil: "domcontentloaded"
      });

      await this.playwrightService.delay(2000);

      // Extraction des URLs de profils
      const profileUrls = await this.extractProfileUrlsFromGoogle(page);

      if (profileUrls.length === 0) {
        console.warn(`[LinkedInScraper] Aucun profil trouvé via Google`);
        return prospects;
      }

      // Limiter le nombre d'URLs
      const limitedUrls = profileUrls.slice(0, Math.min(maxResults, this.maxProfilesPerSession));

      console.log(`[LinkedInScraper] ${limitedUrls.length} profils à scraper`);

      if (onProgress) {
        onProgress({
          step: "profiles_found",
          message: `${limitedUrls.length} profils trouvés`,
          progress: 20
        });
      }

      // Étape 2: Scraping des profils
      console.log(`[LinkedInScraper] Étape 2/3: Scraping des profils individuels`);

      for (let i = 0; i < limitedUrls.length; i++) {
        const profileUrl = limitedUrls[i];

        console.log(`[LinkedInScraper] -----------------------------------`);
        console.log(`[LinkedInScraper] Profil ${i + 1}/${limitedUrls.length}`);

        if (onProgress) {
          onProgress({
            step: "scraping",
            message: `Extraction profil ${i + 1}/${limitedUrls.length}...`,
            progress: 20 + ((i / limitedUrls.length) * 70)
          });
        }

        // Scraper le profil
        const prospect = await this.scrapeProfile(page, profileUrl);

        if (prospect && prospect.nom_contact) {
          prospects.push(prospect);
        }

        // Arrêter si CAPTCHA détecté
        if (this.captchaDetected) {
          console.error(`[LinkedInScraper] ❌ CAPTCHA détecté - Arrêt du scraping`);
          break;
        }

        // Délai LONG entre chaque profil (10-30 secondes)
        if (i < limitedUrls.length - 1) {
          const delay = Math.floor(
            Math.random() * (this.maxDelayBetweenProfiles - this.minDelayBetweenProfiles) +
            this.minDelayBetweenProfiles
          );

          console.log(`[LinkedInScraper] ⏳ Délai de ${Math.round(delay / 1000)}s avant le prochain profil...`);

          await this.playwrightService.delay(delay);
        }
      }

      // Étape 3: Fin
      console.log(`[LinkedInScraper] Étape 3/3: Fin du scraping`);
      console.log(`[LinkedInScraper] ═══════════════════════════════════════`);
      console.log(`[LinkedInScraper] ✓ Scraping terminé`);
      console.log(`[LinkedInScraper] Prospects extraits: ${prospects.length}/${limitedUrls.length}`);
      console.log(`[LinkedInScraper] CAPTCHA détecté: ${this.captchaDetected ? 'Oui' : 'Non'}`);
      console.log(`[LinkedInScraper] ═══════════════════════════════════════`);

      if (onProgress) {
        onProgress({
          step: "completed",
          message: `Scraping terminé - ${prospects.length} profils extraits`,
          progress: 100
        });
      }

      return prospects;

    } catch (error) {
      console.error(`[LinkedInScraper] ❌ Erreur lors du scraping:`, error.message);
      throw error;

    } finally {
      // Fermer la page et le contexte
      if (page) {
        try {
          await page.close();
          await page.context().close();
        } catch (error) {
          console.error(`[LinkedInScraper] Erreur fermeture page:`, error.message);
        }
      }
    }
  }
}

// Export singleton
let scraperInstance = null;

export function getLinkedInScraper() {
  if (!scraperInstance) {
    scraperInstance = new LinkedInScraper();
  }
  return scraperInstance;
}

export default LinkedInScraper;
