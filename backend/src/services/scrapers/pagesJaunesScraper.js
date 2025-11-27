import { getPlaywrightService } from "../playwrightService.js";
import { SCRAPER_IDS } from "../../config/antiBotConfig.js";
import { normalizeKeyword, normalizeLocation } from "../../utils/stringUtils.js";

/**
 * Scraper pour Pages Jaunes
 * Extrait les informations de prospects depuis les résultats de recherche
 */

class PagesJaunesScraper {
  constructor() {
    this.playwrightService = getPlaywrightService(SCRAPER_IDS.PAGES_JAUNES);
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
   * Extrait le code postal et la ville de l'adresse française
   * Format attendu: "rue 75001 Paris" ou "rue Paris 75001"
   * @param {string} adresse - Adresse complète
   * @returns {Object} { adresse_rue, code_postal, ville }
   */
  extractAddressComponents(adresse) {
    if (!adresse) {
      return { adresse_rue: null, code_postal: null, ville: null };
    }

    // Regex pour code postal français (5 chiffres)
    const codePostalRegex = /\b(\d{5})\b/;
    const match = adresse.match(codePostalRegex);

    if (!match) {
      // Pas de code postal trouvé, retourner l'adresse telle quelle
      return { adresse_rue: adresse, code_postal: null, ville: null };
    }

    const codePostal = match[1];
    const codePostalIndex = match.index;

    // Extraire la ville (tout ce qui suit le code postal)
    const afterCodePostal = adresse.substring(codePostalIndex + 5).trim();
    const ville = afterCodePostal || null;

    // Extraire la rue (tout ce qui précède le code postal)
    const adresseRue = adresse.substring(0, codePostalIndex).trim();

    return {
      adresse_rue: adresseRue || null,
      code_postal: codePostal,
      ville: ville
    };
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

        // Nom de l'entreprise - Format 2024: .bi-denomination > h3
        const nameSelectors = [
          '.bi-denomination h3',      // Format actuel (2024)
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
            // Nettoyer l'adresse: retirer "Voir le plan", "Site web", icônes, etc.
            let address = addrEl.textContent.trim()
              .replace(/\s+/g, " ")
              .replace(/Voir le plan/gi, "")
              .replace(/Site web/gi, "")
              .trim();
            result.adresse = address;
            break;
          }
        }

        // Téléphone - 2024: caché dans .bi-fantomas .number-contact
        const phoneSelectors = [
          '.bi-fantomas .number-contact',  // Format 2024: numéros cachés
          'a[href^="tel:"]',
          '.bi-phone',
          '[class*="phone"]',
          '[itemprop="telephone"]'
        ];
        for (const selector of phoneSelectors) {
          const phoneEl = el.querySelector(selector);
          if (phoneEl) {
            // Extraire le numéro du texte (format: "Tél : 01 23 45 67 89")
            const text = phoneEl.textContent.trim();
            const phoneMatch = text.match(/\d[\d\s]+\d/);
            if (phoneMatch) {
              result.telephone = phoneMatch[0].trim();
            } else {
              result.telephone = phoneEl.getAttribute("href") || text;
            }
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

    // Chercher les résultats - Pages Jaunes utilise une liste ul.bi-list > li
    const resultSelectors = [
      '.bi-list > li',            // Sélecteur principal (2024)
      'ul.bi-list > li',          // Alternative explicite
      '.bi-product',              // Ancien format (fallback)
      'li[itemtype*="LocalBusiness"]',
      '[class*="result-item"]'
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
          // Extraire code postal et ville de l'adresse
          const addressComponents = this.extractAddressComponents(data.adresse);

          // Normaliser les données
          const prospect = {
            nom_entreprise: data.nom_entreprise,
            nom_contact: null, // Pages Jaunes ne fournit généralement pas le nom du contact
            email: this.normalizeEmail(data.email),
            telephone: this.normalizePhone(data.telephone),
            adresse: addressComponents.adresse_rue || data.adresse, // Adresse sans code postal/ville
            ville: addressComponents.ville,
            code_postal: addressComponents.code_postal,
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
      startPage = 1,
      maxPages = 1,
      maxResults = 50,
      excludeDuplicates = false,
      isDuplicate = null, // Callback pour vérifier si un prospect est un doublon
      onProgress = null // Callback pour le feedback en temps réel
    } = options;

    // Normaliser les mots-clés et localisation (retirer accents)
    const normalizedQuoiqui = normalizeKeyword(quoiqui);
    const normalizedOu = normalizeLocation(ou);

    // Logger si normalisation effectuée
    if (normalizedQuoiqui !== quoiqui || normalizedOu !== ou) {
      console.log(`[PagesJaunesScraper] Normalisation des accents:`);
      if (normalizedQuoiqui !== quoiqui) {
        console.log(`  Quoi/Qui: "${quoiqui}" → "${normalizedQuoiqui}"`);
      }
      if (normalizedOu !== ou) {
        console.log(`  Où: "${ou}" → "${normalizedOu}"`);
      }
    }

    // Calculer la page de fin
    const endPage = startPage + maxPages - 1;

    console.log(`[PagesJaunesScraper] Démarrage du scraping: "${normalizedQuoiqui}" à "${normalizedOu}"`);
    console.log(`[PagesJaunesScraper] Pages: ${startPage} à ${endPage} (${maxPages} page${maxPages > 1 ? 's' : ''})`);
    console.log(`[PagesJaunesScraper] Max résultats: ${maxResults}`);
    if (excludeDuplicates) {
      console.log(`[PagesJaunesScraper] Mode excludeDuplicates activé: scraper jusqu'à ${maxResults} NOUVEAUX prospects`);
    }

    const allProspects = [];
    const newProspects = []; // Prospects non-doublons
    let duplicatesCount = 0;
    let pageNum = 0;
    let pagesScraped = 0;

    try {
      // Initialiser Playwright
      await this.playwrightService.initialize();
      const context = await this.playwrightService.createContext();
      const page = await context.newPage();

      // Scraper chaque page
      for (pageNum = startPage; pageNum <= endPage; pageNum++) {
        pagesScraped++;
        console.log(`\n[PagesJaunesScraper] === Page ${pageNum} (${pagesScraped}/${maxPages}) ===`);

        const prospects = await this.scrapePage(page, normalizedQuoiqui, normalizedOu, pageNum);

        // Si excludeDuplicates est activé, filtrer les doublons
        if (excludeDuplicates && isDuplicate) {
          for (const prospect of prospects) {
            const isdup = await isDuplicate(prospect);
            if (isdup) {
              duplicatesCount++;
              console.log(`[PagesJaunesScraper] ⏭️  Doublon ignoré: ${prospect.nom_entreprise}`);
            } else {
              newProspects.push(prospect);
              allProspects.push(prospect);
              console.log(`[PagesJaunesScraper] ✅ Nouveau prospect: ${prospect.nom_entreprise}`);
            }
          }
        } else {
          allProspects.push(...prospects);
        }

        const targetCount = excludeDuplicates ? newProspects.length : allProspects.length;
        console.log(`[PagesJaunesScraper] ${prospects.length} prospects extraits de la page ${pageNum}`);
        if (excludeDuplicates) {
          console.log(`[PagesJaunesScraper] Nouveaux: ${newProspects.length}, Doublons: ${duplicatesCount}`);
        }
        console.log(`[PagesJaunesScraper] Total cumulé: ${targetCount} prospects`);

        // Callback de progression
        if (onProgress) {
          const progress = Math.round((pagesScraped / maxPages) * 100);
          onProgress(progress, {
            prospects: allProspects.slice(0, maxResults),
            pages_scraped: pagesScraped,
            errors: [],
          });
        }

        // Arrêter si on a atteint le maximum
        // En mode excludeDuplicates, on compte les nouveaux prospects uniquement
        if (targetCount >= maxResults) {
          console.log(`[PagesJaunesScraper] Limite de ${maxResults} ${excludeDuplicates ? 'nouveaux ' : ''}résultats atteinte`);
          break;
        }

        // Delay entre les pages
        if (pageNum < endPage) {
          await this.playwrightService.randomDelay(3000, 6000);
        }
      }

      // Fermer le context
      await this.playwrightService.closeContext(context);

      // Limiter au nombre max de résultats
      // En mode excludeDuplicates, on retourne uniquement les nouveaux prospects
      const finalProspects = excludeDuplicates
        ? newProspects.slice(0, maxResults)
        : allProspects.slice(0, maxResults);

      console.log(`\n[PagesJaunesScraper] ✅ Scraping terminé: ${finalProspects.length} prospects récupérés`);
      if (excludeDuplicates) {
        console.log(`[PagesJaunesScraper] 📊 Doublons ignorés: ${duplicatesCount}`);
        console.log(`[PagesJaunesScraper] 📊 Total scrapé (avec doublons): ${allProspects.length + duplicatesCount}`);
      }

      return {
        success: true,
        prospects: finalProspects,
        total: finalProspects.length,
        duplicates_skipped: excludeDuplicates ? duplicatesCount : 0,
        total_scraped: excludeDuplicates ? (allProspects.length + duplicatesCount) : finalProspects.length,
        pages_scraped: pagesScraped,
        search: { quoiqui, ou, startPage, endPage }
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
export { PagesJaunesScraper };
