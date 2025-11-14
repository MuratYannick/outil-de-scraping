import dotenv from "dotenv";
import { getPlaywrightService } from "../src/services/playwrightService.js";

dotenv.config();

/**
 * Script d'analyse de la structure HTML de Pages Jaunes
 * Pour comprendre comment extraire les données des résultats de recherche
 */

async function analyzePagesJaunes() {
  console.log("🔍 Analyse de la structure HTML de Pages Jaunes\n");

  const service = getPlaywrightService();

  try {
    // Initialiser le service
    await service.initialize();

    // Créer un context
    const context = await service.createContext();
    const page = await context.newPage();

    // URL de test: recherche "plombier" à "Lyon"
    const searchUrl = "https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier&ou=Lyon&univers=pagesjaunes";

    console.log(`📋 Navigation vers : ${searchUrl}\n`);
    await service.navigateToPage(page, searchUrl, { waitUntil: "domcontentloaded" });

    // Attendre que les résultats se chargent
    console.log("⏳ Attente du chargement des résultats...\n");
    await service.delay(3000);

    // Analyser la structure
    console.log("═".repeat(80));
    console.log("📊 ANALYSE DE LA STRUCTURE HTML");
    console.log("═".repeat(80));
    console.log();

    // 1. Trouver le conteneur des résultats
    console.log("1️⃣ Conteneur des résultats de recherche:");
    const containers = await page.$$eval('[class*="bi-list"], [class*="result"], [class*="item"]', (elements) => {
      return elements.slice(0, 3).map((el, index) => ({
        index,
        classes: el.className,
        tag: el.tagName,
        childrenCount: el.children.length
      }));
    });
    console.log(JSON.stringify(containers, null, 2));
    console.log();

    // 2. Analyser un résultat individuel
    console.log("2️⃣ Structure d'un résultat individuel:");
    const firstResult = await page.evaluate(() => {
      // Chercher différents sélecteurs possibles
      const selectors = [
        '[class*="bi-product"]',
        '[class*="result-item"]',
        '[class*="search-result"]',
        'li[itemtype*="LocalBusiness"]',
        'article',
      ];

      let element = null;
      for (const selector of selectors) {
        element = document.querySelector(selector);
        if (element) break;
      }

      if (!element) {
        return { error: "Aucun résultat trouvé" };
      }

      return {
        tag: element.tagName,
        classes: element.className,
        attributes: Array.from(element.attributes).map(attr => ({
          name: attr.name,
          value: attr.value.substring(0, 50)
        })),
        innerHTML: element.innerHTML.substring(0, 500) + "..."
      };
    });
    console.log(JSON.stringify(firstResult, null, 2));
    console.log();

    // 3. Extraire les informations d'un résultat
    console.log("3️⃣ Extraction des données du premier résultat:");
    const extractedData = await page.evaluate(() => {
      const result = {};

      // Nom de l'entreprise
      const nameSelectors = [
        'a[class*="denomination"]',
        'h2 a',
        'h3 a',
        '[itemprop="name"]',
        '.bi-denomination'
      ];
      for (const selector of nameSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          result.nom = el.textContent.trim();
          result.nomSelector = selector;
          break;
        }
      }

      // Adresse
      const addressSelectors = [
        '[itemprop="address"]',
        '[class*="address"]',
        '.bi-address'
      ];
      for (const selector of addressSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          result.adresse = el.textContent.trim();
          result.adresseSelector = selector;
          break;
        }
      }

      // Téléphone
      const phoneSelectors = [
        '[itemprop="telephone"]',
        'a[href^="tel:"]',
        '[class*="phone"]',
        '.bi-phone'
      ];
      for (const selector of phoneSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          result.telephone = el.textContent.trim() || el.getAttribute('href');
          result.telephoneSelector = selector;
          break;
        }
      }

      // Site web
      const websiteSelectors = [
        '[itemprop="url"]',
        'a[data-pjl="1"]',
        'a[class*="website"]',
        '.bi-website a'
      ];
      for (const selector of websiteSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          result.siteweb = el.getAttribute('href');
          result.sitewebSelector = selector;
          break;
        }
      }

      return result;
    });
    console.log(JSON.stringify(extractedData, null, 2));
    console.log();

    // 4. Compter le nombre de résultats
    console.log("4️⃣ Nombre de résultats sur la page:");
    const resultsCount = await page.evaluate(() => {
      const selectors = [
        '[class*="bi-product"]',
        '[class*="result-item"]',
        'li[itemtype*="LocalBusiness"]'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          return {
            selector,
            count: elements.length
          };
        }
      }
      return { count: 0 };
    });
    console.log(JSON.stringify(resultsCount, null, 2));
    console.log();

    // 5. Vérifier la pagination
    console.log("5️⃣ Boutons de pagination:");
    const pagination = await page.evaluate(() => {
      const paginationSelectors = [
        '.pagination',
        '[class*="pager"]',
        'nav[aria-label*="pagination"]'
      ];

      for (const selector of paginationSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const links = el.querySelectorAll('a');
          return {
            selector,
            linksCount: links.length,
            hasNext: !!el.querySelector('a[rel="next"]') || !!el.querySelector('[aria-label*="suivant"]')
          };
        }
      }
      return { found: false };
    });
    console.log(JSON.stringify(pagination, null, 2));
    console.log();

    // 6. Screenshot pour référence
    console.log("6️⃣ Capture d'écran de la page:");
    await page.screenshot({
      path: "backend/scripts/pages-jaunes-analysis.png",
      fullPage: true
    });
    console.log("✓ Screenshot sauvegardé: backend/scripts/pages-jaunes-analysis.png");
    console.log();

    // Résumé
    console.log("═".repeat(80));
    console.log("📝 RÉSUMÉ DE L'ANALYSE");
    console.log("═".repeat(80));
    console.log();
    console.log("Sélecteurs identifiés:");
    console.log(`  - Nom entreprise: ${extractedData.nomSelector || "NON TROUVÉ"}`);
    console.log(`  - Adresse: ${extractedData.adresseSelector || "NON TROUVÉ"}`);
    console.log(`  - Téléphone: ${extractedData.telephoneSelector || "NON TROUVÉ"}`);
    console.log(`  - Site web: ${extractedData.sitewebSelector || "NON TROUVÉ"}`);
    console.log();
    console.log("Données extraites (premier résultat):");
    console.log(`  - Nom: ${extractedData.nom || "N/A"}`);
    console.log(`  - Adresse: ${extractedData.adresse || "N/A"}`);
    console.log(`  - Téléphone: ${extractedData.telephone || "N/A"}`);
    console.log(`  - Site web: ${extractedData.siteweb || "N/A"}`);
    console.log();
    console.log(`Total résultats trouvés: ${resultsCount.count || 0}`);
    console.log(`Pagination disponible: ${pagination.hasNext ? "OUI" : "NON"}`);
    console.log();

    // Fermer le context
    await service.closeContext(context);

    console.log("✅ Analyse terminée avec succès!");

  } catch (error) {
    console.error("\n❌ ERREUR lors de l'analyse:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await service.close();
  }
}

// Exécution
analyzePagesJaunes();
