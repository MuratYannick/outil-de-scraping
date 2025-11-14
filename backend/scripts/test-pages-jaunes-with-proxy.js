import dotenv from "dotenv";
import PagesJaunesScraper from "../src/services/scrapers/pagesJaunesScraper.js";
import { getPlaywrightService, resetPlaywrightService } from "../src/services/playwrightService.js";
import { antiBotConfig } from "../src/config/antiBotConfig.js";

dotenv.config();

/**
 * Script de test du scraper Pages Jaunes AVEC proxies
 * Compare les résultats avec et sans proxies pour valider l'efficacité
 */

async function testPagesJaunesWithProxy() {
  console.log("═".repeat(80));
  console.log("🔬 TEST PAGES JAUNES AVEC PROXIES");
  console.log("═".repeat(80));
  console.log();

  const FREE_PROXIES = [
    "http://51.195.81.233:8080",
    "http://103.152.112.162:80",
    "http://200.105.215.18:33630",
    "http://190.61.88.147:8080",
    "http://41.65.236.43:1981"
  ];

  try {
    // ========================================
    // TEST 1: SANS PROXY (BASELINE)
    // ========================================
    console.log("📋 TEST 1: Pages Jaunes SANS proxy (baseline)");
    console.log("─".repeat(80));

    // Configuration: désactiver les proxies
    antiBotConfig.proxies.enabled = false;
    process.env.PROXY_ENABLED = "false";

    const scraper1 = new PagesJaunesScraper();
    const result1 = await scraper1.scrape("plombier", "Lyon", {
      maxPages: 1,
      maxResults: 5
    });

    console.log("\n📊 Résultat TEST 1 (SANS proxy):");
    console.log(`   - Succès: ${result1.success ? "✅" : "❌"}`);
    console.log(`   - Prospects extraits: ${result1.prospects.length}`);
    console.log(`   - Pages scrapées: ${result1.pages_scraped}`);

    if (result1.error) {
      console.log(`   - Erreur: ${result1.error}`);
    }

    if (result1.prospects.length > 0) {
      console.log("\n   Exemple de prospect:");
      console.log(`   - Nom: ${result1.prospects[0].nom}`);
      console.log(`   - Adresse: ${result1.prospects[0].adresse}`);
    }

    // Fermer Playwright
    await getPlaywrightService().close();
    resetPlaywrightService();

    console.log("\n⏳ Attente de 10 secondes avant le test avec proxy...\n");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // ========================================
    // TEST 2: AVEC PROXIES
    // ========================================
    console.log("═".repeat(80));
    console.log("📋 TEST 2: Pages Jaunes AVEC proxies (rotation)");
    console.log("─".repeat(80));

    // Configuration: activer les proxies
    antiBotConfig.proxies.enabled = true;
    antiBotConfig.proxies.provider = 'custom';
    antiBotConfig.proxies.custom.list = FREE_PROXIES;
    antiBotConfig.proxies.custom.rotation = 'random';
    process.env.PROXY_ENABLED = "true";
    process.env.PROXY_PROVIDER = "custom";
    process.env.PROXY_ROTATION = "random";

    console.log(`\n🔧 Configuration proxies:`);
    console.log(`   - Provider: custom`);
    console.log(`   - Rotation: random`);
    console.log(`   - Nombre de proxies: ${FREE_PROXIES.length}`);

    const scraper2 = new PagesJaunesScraper();
    const result2 = await scraper2.scrape("plombier", "Lyon", {
      maxPages: 1,
      maxResults: 5
    });

    console.log("\n📊 Résultat TEST 2 (AVEC proxy):");
    console.log(`   - Succès: ${result2.success ? "✅" : "❌"}`);
    console.log(`   - Prospects extraits: ${result2.prospects.length}`);
    console.log(`   - Pages scrapées: ${result2.pages_scraped}`);

    if (result2.error) {
      console.log(`   - Erreur: ${result2.error}`);
    }

    if (result2.prospects.length > 0) {
      console.log("\n   Exemple de prospect:");
      console.log(`   - Nom: ${result2.prospects[0].nom}`);
      console.log(`   - Adresse: ${result2.prospects[0].adresse}`);
    }

    // Fermer Playwright
    await getPlaywrightService().close();
    resetPlaywrightService();

    // ========================================
    // COMPARAISON DES RÉSULTATS
    // ========================================
    console.log("\n" + "═".repeat(80));
    console.log("📈 COMPARAISON DES RÉSULTATS");
    console.log("═".repeat(80));
    console.log();

    const comparison = {
      sansProxy: {
        success: result1.success,
        prospects: result1.prospects.length,
        blocked: !result1.success || result1.prospects.length === 0
      },
      avecProxy: {
        success: result2.success,
        prospects: result2.prospects.length,
        blocked: !result2.success || result2.prospects.length === 0
      }
    };

    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log("│                      SANS PROXY vs AVEC PROXY               │");
    console.log("├─────────────────────────────────────────────────────────────┤");
    console.log(`│ Succès:         ${comparison.sansProxy.success ? "✅" : "❌"}  vs  ${comparison.avecProxy.success ? "✅" : "❌"}                           │`);
    console.log(`│ Prospects:      ${String(comparison.sansProxy.prospects).padEnd(2)} vs  ${String(comparison.avecProxy.prospects).padEnd(2)}                                │`);
    console.log(`│ Bloqué:         ${comparison.sansProxy.blocked ? "✅" : "❌"}  vs  ${comparison.avecProxy.blocked ? "✅" : "❌"}                           │`);
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log();

    // ========================================
    // CONCLUSION
    // ========================================
    console.log("═".repeat(80));
    console.log("💡 CONCLUSION");
    console.log("═".repeat(80));
    console.log();

    if (comparison.avecProxy.prospects > comparison.sansProxy.prospects) {
      console.log("✅ LES PROXIES SONT EFFICACES !");
      console.log(`   → ${comparison.avecProxy.prospects - comparison.sansProxy.prospects} prospects de plus avec les proxies`);
      console.log();
      console.log("📌 Recommandations:");
      console.log("   1. Tester avec des proxies PAYANTS pour de meilleurs résultats");
      console.log("      - BrightData: ~$500-1000/mois (le plus fiable)");
      console.log("      - Oxylabs: ~$300-600/mois");
      console.log("      - SmartProxy: ~$75-200/mois (plus abordable)");
      console.log("   2. Combiner avec la stratégie STEALTH pour maximiser l'efficacité");
      console.log("   3. Considérer le mode HYBRID (proxies + stealth + captcha solver)");
    } else if (comparison.avecProxy.prospects === comparison.sansProxy.prospects && comparison.avecProxy.prospects > 0) {
      console.log("⚠️  LES PROXIES N'APPORTENT PAS D'AMÉLIORATION SIGNIFICATIVE");
      console.log("   → Même nombre de prospects extraits avec et sans proxies");
      console.log();
      console.log("📌 Recommandations:");
      console.log("   1. Tester avec des proxies RÉSIDENTIELS payants (IPs de meilleure qualité)");
      console.log("   2. Essayer la stratégie STEALTH ou HYBRID");
      console.log("   3. Considérer l'Option 2 (CAPTCHA Solver) ou Option 3 (Masquage amélioré)");
    } else {
      console.log("❌ BLOCAGE PERSISTANT MALGRÉ LES PROXIES");
      console.log("   → Pages Jaunes bloque toujours l'accès même avec rotation de proxies");
      console.log();
      console.log("📌 Recommandations:");
      console.log("   1. Les proxies GRATUITS sont souvent blacklistés");
      console.log("   2. TESTER AVEC DES PROXIES PAYANTS (nécessaire pour Pages Jaunes)");
      console.log("   3. Combiner proxies + stealth + captcha solver (mode HYBRID)");
      console.log("   4. Alternative: chercher une API officielle ou scraper un site concurrent");
    }

    console.log();
    console.log("═".repeat(80));

  } catch (error) {
    console.error("\n❌ ERREUR DURANT LES TESTS:", error.message);
    console.error(error.stack);
  } finally {
    // Nettoyage final
    try {
      await getPlaywrightService().close();
      resetPlaywrightService();
    } catch (e) {
      // Ignorer les erreurs de fermeture
    }
  }
}

// Exécuter le test
testPagesJaunesWithProxy()
  .then(() => {
    console.log("\n✅ Tests terminés");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exit(1);
  });
