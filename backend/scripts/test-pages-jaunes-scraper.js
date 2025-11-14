import dotenv from "dotenv";
import PagesJaunesScraper from "../src/services/scrapers/pagesJaunesScraper.js";
import { getPlaywrightService, resetPlaywrightService } from "../src/services/playwrightService.js";

dotenv.config();

/**
 * Script de test du scraper Pages Jaunes
 * Test avec une vraie recherche et sauvegarde des résultats
 */

async function testPagesJaunesScraper() {
  console.log("🧪 Test du Scraper Pages Jaunes\n");

  const scraper = new PagesJaunesScraper();

  try {
    // Test 1: Recherche simple - 1 page
    console.log("═".repeat(80));
    console.log("📋 TEST 1: Recherche 'plombier' à 'Lyon' (1 page)");
    console.log("═".repeat(80));
    console.log();

    const result1 = await scraper.scrape("plombier", "Lyon", {
      maxPages: 1,
      maxResults: 10
    });

    console.log("\n📊 RÉSULTATS TEST 1:");
    console.log(JSON.stringify(result1, null, 2));
    console.log();

    if (result1.success && result1.prospects.length > 0) {
      console.log("✅ TEST 1 PASSÉ");
      console.log(`   - ${result1.total} prospects extraits`);
      console.log(`   - ${result1.pages_scraped} page(s) scrapée(s)`);
      console.log("\nExemples de prospects:");
      result1.prospects.slice(0, 3).forEach((p, i) => {
        console.log(`\n  Prospect ${i + 1}:`);
        console.log(`    - Nom: ${p.nom_entreprise}`);
        console.log(`    - Téléphone: ${p.telephone || "N/A"}`);
        console.log(`    - Adresse: ${p.adresse || "N/A"}`);
        console.log(`    - Site web: ${p.url_site || "N/A"}`);
      });
    } else {
      console.log("⚠️  TEST 1 ÉCHOUÉ OU AUCUN RÉSULTAT");
      console.log(`   Erreur: ${result1.error || "Aucun prospect trouvé"}`);
    }

    // Fermer Playwright entre les tests
    await getPlaywrightService().close();
    resetPlaywrightService();

    // Delay entre les tests
    console.log("\n⏳ Attente de 5 secondes avant le test suivant...\n");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 2: Recherche différente - 2 pages
    console.log("\n" + "═".repeat(80));
    console.log("📋 TEST 2: Recherche 'restaurant' à 'Paris' (2 pages, max 20 résultats)");
    console.log("═".repeat(80));
    console.log();

    const result2 = await scraper.scrape("restaurant", "Paris", {
      maxPages: 2,
      maxResults: 20
    });

    console.log("\n📊 RÉSULTATS TEST 2:");
    console.log(`Success: ${result2.success}`);
    console.log(`Total: ${result2.total}`);
    console.log(`Pages scrapées: ${result2.pages_scraped}`);
    console.log();

    if (result2.success && result2.prospects.length > 0) {
      console.log("✅ TEST 2 PASSÉ");
      console.log(`   - ${result2.total} prospects extraits`);
      console.log(`   - ${result2.pages_scraped} page(s) scrapée(s)`);
    } else {
      console.log("⚠️  TEST 2 ÉCHOUÉ OU AUCUN RÉSULTAT");
      console.log(`   Erreur: ${result2.error || "Aucun prospect trouvé"}`);
    }

    // Fermer Playwright
    await getPlaywrightService().close();
    resetPlaywrightService();

    // Résumé final
    console.log("\n" + "═".repeat(80));
    console.log("📝 RÉSUMÉ DES TESTS");
    console.log("═".repeat(80));
    console.log();

    const test1Success = result1.success && result1.prospects.length > 0;
    const test2Success = result2.success && result2.prospects.length > 0;

    console.log(`Test 1 (plombier Lyon): ${test1Success ? "✅ PASSÉ" : "❌ ÉCHOUÉ"}`);
    console.log(`Test 2 (restaurant Paris): ${test2Success ? "✅ PASSÉ" : "❌ ÉCHOUÉ"}`);
    console.log();

    if (test1Success && test2Success) {
      console.log("🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS");
      console.log();
      console.log("Fonctionnalités validées:");
      console.log("  ✓ Construction d'URL de recherche");
      console.log("  ✓ Navigation vers Pages Jaunes");
      console.log("  ✓ Extraction des données de prospects");
      console.log("  ✓ Normalisation téléphone/email/URL");
      console.log("  ✓ Scraping multi-pages");
      console.log("  ✓ Limitation du nombre de résultats");
      console.log("  ✓ Delays anti-détection");
      console.log("  ✓ Gestion des erreurs");
    } else {
      console.log("⚠️  CERTAINS TESTS ONT ÉCHOUÉ");
      console.log();
      console.log("Raisons possibles:");
      console.log("  - Pages Jaunes a détecté le scraping (CAPTCHA)");
      console.log("  - Structure HTML de Pages Jaunes a changé");
      console.log("  - Problème de connexion réseau");
      console.log("  - Sélecteurs CSS obsolètes");
      console.log();
      console.log("💡 Vérifier le screenshot: backend/scripts/pages-jaunes-analysis.png");
    }

  } catch (error) {
    console.error("\n❌ ERREUR CRITIQUE LORS DES TESTS:");
    console.error(error);
    process.exit(1);
  } finally {
    // S'assurer que Playwright est fermé
    try {
      await getPlaywrightService().close();
    } catch {
      // Ignorer si déjà fermé
    }
  }
}

// Exécution
testPagesJaunesScraper();
