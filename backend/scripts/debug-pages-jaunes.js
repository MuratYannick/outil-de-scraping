import dotenv from "dotenv";
import { getPlaywrightService } from "../src/services/playwrightService.js";

dotenv.config();

/**
 * Script de debug pour analyser la structure HTML de Pages Jaunes
 * Prend un screenshot et affiche la structure des éléments trouvés
 */

async function debugPagesJaunes() {
  console.log("🔍 Debug Pages Jaunes - Analyse de la structure HTML\n");

  const service = getPlaywrightService();

  try {
    await service.initialize();
    const context = await service.createContext();
    const page = await context.newPage();

    // Navigation
    const searchUrl = "https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier&ou=Lyon&univers=pagesjaunes";
    console.log(`Navigation vers: ${searchUrl}\n`);

    await service.navigateToPage(page, searchUrl, {
      waitUntil: "domcontentloaded"
    });

    // Attendre que la page se charge (contenu dynamique)
    await service.delay(8000);

    // Screenshot complet
    console.log("📸 Prise de screenshot...");
    await page.screenshot({
      path: "backend/scripts/pages-jaunes-debug.png",
      fullPage: true
    });
    console.log("✓ Screenshot sauvegardé: backend/scripts/pages-jaunes-debug.png\n");

    // Tester différents sélecteurs
    const selectorsToTest = [
      '.bi-product',
      '[class*="result-item"]',
      '[class*="search-item"]',
      'li[itemtype*="LocalBusiness"]',
      'article[class*="item"]',
      'article',
      'li',
      '.item',
      '[data-pj-item]',
      '[class*="bi"]'
    ];

    console.log("🔍 Test des sélecteurs:\n");
    for (const selector of selectorsToTest) {
      const count = await page.$$eval(selector, elements => elements.length);
      console.log(`  ${selector.padEnd(40)} → ${count} éléments trouvés`);
    }

    // Analyser les classes présentes sur la page
    console.log("\n📋 Classes CSS présentes sur la page (échantillon):");
    const classes = await page.$$eval('[class]', elements => {
      const allClasses = new Set();
      elements.slice(0, 100).forEach(el => {
        el.className.split(' ').forEach(cls => {
          if (cls && cls.trim()) allClasses.add(cls.trim());
        });
      });
      return Array.from(allClasses).sort();
    });

    console.log(classes.slice(0, 50).join('\n'));
    console.log(`\n... (${classes.length} classes au total)\n`);

    // Extraire le HTML d'un échantillon
    console.log("📄 HTML d'échantillon (premiers éléments <article> ou <li>):");
    const sampleHTML = await page.$$eval('article, li', elements => {
      return elements.slice(0, 3).map(el => el.outerHTML.substring(0, 500));
    });

    sampleHTML.forEach((html, i) => {
      console.log(`\n--- Élément ${i + 1} ---`);
      console.log(html);
    });

    // Vérifier si CAPTCHA
    const captchaFound = await page.$$eval('[id*="captcha"], [class*="captcha"], iframe[src*="captcha"]', elements => elements.length > 0);
    if (captchaFound) {
      console.log("\n⚠️  CAPTCHA DÉTECTÉ sur la page!");
    } else {
      console.log("\n✓ Pas de CAPTCHA visible");
    }

    await service.closeContext(context);

    console.log("\n✅ Analyse terminée");
    console.log("💡 Vérifiez le screenshot pour voir ce qui est chargé");

  } catch (error) {
    console.error("\n❌ ERREUR lors du debug:", error);
    process.exit(1);
  } finally {
    await service.close();
  }
}

// Exécution
debugPagesJaunes();
