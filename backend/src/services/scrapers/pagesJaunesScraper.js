import { getPlaywrightService } from "../playwrightService.js";

/**
 * Scraper pour Pages Jaunes
 * Extrait les informations de prospects depuis les résultats de recherche
 */

class PagesJaunesScraper {
  constructor() {
    this.playwrightService = getPlaywrightService();
    this.baseUrl = "https://www.pagesjaunes.fr";
  }

  /**
   * Construit l'URL de recherche
   * @param {string} quoiqui - Activité ou nom de l'entreprise
   * @param {string} ou - Localisation
   * @param {number} page - Numéro de page (optionnel)
   */
  buildSearchUrl(quoiqui, ou, page = 1) {
    const params = new URLSearchParams({
      quoiqui,
      ou,
      univers: "pagesjaunes"
    });

    if (page > 1) {
      params.append("page", page.toString());
    }

    return `${this.baseUrl}/annuaire/chercherlespros?${params.toString()}`;
  }

  /**
   * Normalise un numéro de téléphone français
   * @param {string} phone - Numéro brut
   */
  normalizePhone(phone) {
    if (!phone) return null;

    // Enlever tous les caractères non-numériques
    let cleaned = phone.replace(/[^\d+]/g, "");

    // Si commence par 33, remplacer par 0
    if (cleaned.startsWith("33")) {
      cleaned = "0" + cleaned.substring(2);
    }

    // Formater en groupes de 2
    if (cleaned.length === 10 && cleaned.startsWith("0")) {
      return cleaned.match(/.{1,2}/g).join(" ");
    }

    return cleaned || null;
  }

  /**
   * Normalise une adresse email
   * @param {string} email - Email brut
   */
  normalizeEmail(email) {
    if (!email) return null;
    const trimmed = email.trim().toLowerCase();
    // Validation basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed) ? trimmed : null;
  }

  /**
   * Normalise une URL de site web
   * @param {string} url - URL brute
   */
  normalizeWebsite(url) {
    if (!url) return null;

    try {
      // Si l'URL ne commence pas par http, ajouter https
      if (!url.startsWith("http")) {
        url = "https://" + url;
      }
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      return null;
    }
  }

  /**
   * Extrait les données d'un élément de résultat
   * @param {ElementHandle} element - Élément DOM du résultat
   */
  async extractProspectData(element, page) {
    try {
      const data = await element.evaluate((el) => {
        const result = {
          nom_entreprise: null,
          adresse: null,
          telephone: null,
          url_site: null,
          email: null
        };

        // Nom de l'entreprise - Différents sélecteurs possibles
        const nameSelectors = [
          '.bi-denomination',
          '[class*="denomination"]',
          'h2',
          'h3',
          '[itemprop="name"]'
        ];
        for (const selector of nameSelectors) {
          const nameEl = el.querySelector(selector);
          if (nameEl && nameEl.textContent.trim()) {
            result.nom_entreprise = nameEl.textContent.trim();
            break;
          }
        }

        // Adresse
        const addressSelectors = [
          '.bi-address',
          '[class*="address"]',
          '[itemprop="address"]'
        ];
        for (const selector of addressSelectors) {
          const addrEl = el.querySelector(selector);
          if (addrEl && addrEl.textContent.trim()) {
            result.adresse = addrEl.textContent.trim().replace(/\s+/g, " ");
            break;
          }
        }

        // Téléphone
        const phoneSelectors = [
          'a[href^="tel:"]',
          '.bi-phone',
          '[class*="phone"]',
          '[itemprop="telephone"]'
        ];
        for (const selector of phoneSelectors) {
          const phoneEl = el.querySelector(selector);
          if (phoneEl) {
            result.telephone = phoneEl.getAttribute("href") || phoneEl.textContent.trim();
            break;
          }
        }

        // Site web
        const websiteSelectors = [
          'a[data-pjlid]',
          'a[class*="website"]',
          'a[class*="site-internet"]',
          '.bi-website a'
        ];
        for (const selector of websiteSelectors) {
          const webEl = el.querySelector(selector);
          if (webEl && webEl.getAttribute("href")) {
            result.url_site = webEl.getAttribute("href");
            break;
          }
        }

        return result;
      });

      // Normaliser les données
      if (data.telephone) {
        data.telephone = data.telephone.replace("tel:", "");
      }

      return data;
    } catch (error) {
      console.error("[PagesJaunesScraper] Erreur extraction données:", error.message);
      return null;
    }
  }

  /**
   * Scrape une page de résultats
   * @param {Page} page - Page Playwright
   * @param {string} quoiqui - Recherche
   * @param {string} ou - Localisation
   * @param {number} pageNum - Numéro de page
   */
  async scrapePage(page, quoiqui, ou, pageNum = 1) {
    const url = this.buildSearchUrl(quoiqui, ou, pageNum);

    console.log(`[PagesJaunesScraper] Scraping page ${pageNum}: ${url}`);

    // Navigation
    await this.playwrightService.navigateToPage(page, url, {
      waitUntil: "domcontentloaded"
    });

    // Attendre que les résultats se chargent (JavaScript dynamique)
    await this.playwrightService.delay(5000);

    // Chercher les résultats avec différents sélecteurs possibles
    const resultSelectors = [
      '.bi-product',
      '[class*="result-item"]',
      '[class*="search-item"]',
      'li[itemtype*="LocalBusiness"]',
      'article[class*="item"]'
    ];

    let results = [];
    for (const selector of resultSelectors) {
      results = await page.$$(selector);
      if (results.length > 0) {
        console.log(`[PagesJaunesScraper] Trouvé ${results.length} résultats avec sélecteur: ${selector}`);
        break;
      }
    }

    if (results.length === 0) {
      console.warn(`[PagesJaunesScraper] Aucun résultat trouvé sur la page ${pageNum}`);
      return [];
    }

    // Extraire les données de chaque résultat
    const prospects = [];
    for (let i = 0; i < results.length; i++) {
      try {
        console.log(`[PagesJaunesScraper] Extraction résultat ${i + 1}/${results.length}`);

        const data = await this.extractProspectData(results[i], page);

        if (data && data.nom_entreprise) {
          // Normaliser les données
          const prospect = {
            nom_entreprise: data.nom_entreprise,
            nom_contact: null, // Pages Jaunes ne fournit généralement pas le nom du contact
            email: this.normalizeEmail(data.email),
            telephone: this.normalizePhone(data.telephone),
            adresse: data.adresse,
            url_site: this.normalizeWebsite(data.url_site),
            source_scraping: "Pages Jaunes"
          };

          prospects.push(prospect);
          console.log(`[PagesJaunesScraper] ✓ Prospect extrait: ${prospect.nom_entreprise}`);
        }

        // Delay aléatoire entre chaque extraction
        await this.playwrightService.randomDelay(500, 1500);

      } catch (error) {
        console.error(`[PagesJaunesScraper] Erreur lors de l'extraction du résultat ${i + 1}:`, error.message);
      }
    }

    return prospects;
  }

  /**
   * Scrape plusieurs pages de résultats
   * @param {string} quoiqui - Activité recherchée
   * @param {string} ou - Localisation
   * @param {Object} options - Options de scraping
   */
  async scrape(quoiqui, ou, options = {}) {
    const {
      maxPages = 1,
      maxResults = 50
    } = options;

    console.log(`[PagesJaunesScraper] Démarrage du scraping: "${quoiqui}" à "${ou}"`);
    console.log(`[PagesJaunesScraper] Max pages: ${maxPages}, Max résultats: ${maxResults}`);

    const allProspects = [];
    let pageNum = 0;

    try {
      // Initialiser Playwright
      await this.playwrightService.initialize();
      const context = await this.playwrightService.createContext();
      const page = await context.newPage();

      // Scraper chaque page
      for (pageNum = 1; pageNum <= maxPages; pageNum++) {
        console.log(`\n[PagesJaunesScraper] === Page ${pageNum}/${maxPages} ===`);

        const prospects = await this.scrapePage(page, quoiqui, ou, pageNum);
        allProspects.push(...prospects);

        console.log(`[PagesJaunesScraper] ${prospects.length} prospects extraits de la page ${pageNum}`);
        console.log(`[PagesJaunesScraper] Total cumulé: ${allProspects.length} prospects`);

        // Arrêter si on a atteint le maximum
        if (allProspects.length >= maxResults) {
          console.log(`[PagesJaunesScraper] Limite de ${maxResults} résultats atteinte`);
          break;
        }

        // Delay entre les pages
        if (pageNum < maxPages) {
          await this.playwrightService.randomDelay(3000, 6000);
        }
      }

      // Fermer le context
      await this.playwrightService.closeContext(context);

      // Limiter au nombre max de résultats
      const finalProspects = allProspects.slice(0, maxResults);

      console.log(`\n[PagesJaunesScraper] ✅ Scraping terminé: ${finalProspects.length} prospects récupérés`);

      return {
        success: true,
        prospects: finalProspects,
        total: finalProspects.length,
        pages_scraped: Math.min(pageNum, maxPages),
        search: { quoiqui, ou }
      };

    } catch (error) {
      console.error(`[PagesJaunesScraper] ❌ Erreur lors du scraping:`, error);
      return {
        success: false,
        error: error.message,
        prospects: allProspects,
        total: allProspects.length
      };
    }
  }
}

export default PagesJaunesScraper;
