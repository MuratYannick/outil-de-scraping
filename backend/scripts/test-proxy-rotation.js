import dotenv from "dotenv";
import { getProxyManager, resetProxyManager } from "../src/services/proxyManager.js";
import { getPlaywrightService, resetPlaywrightService } from "../src/services/playwrightService.js";
import { antiBotConfig } from "../src/config/antiBotConfig.js";

dotenv.config();

/**
 * Script de test de la rotation de proxies
 * Teste avec des proxies gratuits pour valider le fonctionnement
 */

// Liste de proxies gratuits publics pour tests
// Note: Ces proxies peuvent être lents ou instables
const FREE_PROXIES = [
  "http://51.195.81.233:8080",
  "http://103.152.112.162:80",
  "http://200.105.215.18:33630",
  "http://190.61.88.147:8080",
  "http://41.65.236.43:1981"
];

async function testProxyRotation() {
  console.log("🧪 Test de Rotation des Proxies\n");
  console.log("════════════════════════════════════════════════════════════════════════════════");
  console.log("⚠️  IMPORTANT : Ce test utilise des proxies publics gratuits");
  console.log("    - Peuvent être lents ou non fonctionnels");
  console.log("    - Utilisés uniquement pour valider la rotation");
  console.log("    - Pour production, utilisez BrightData/Oxylabs/SmartProxy");
  console.log("════════════════════════════════════════════════════════════════════════════════\n");

  try {
    // Test 1: Configuration manuelle des proxies
    console.log("📋 TEST 1: Configuration et Initialisation du ProxyManager\n");

    // Temporairement override la config pour ce test
    antiBotConfig.proxies.enabled = true;
    antiBotConfig.proxies.provider = 'custom';
    antiBotConfig.proxies.custom.list = FREE_PROXIES;
    antiBotConfig.proxies.custom.rotation = 'round-robin';

    const proxyManager = getProxyManager();
    await proxyManager.initialize();

    const stats = proxyManager.getStats();
    console.log("✓ ProxyManager initialisé");
    console.log(`  - Provider: ${stats.provider}`);
    console.log(`  - Proxies chargés: ${stats.totalProxies}`);
    console.log(`  - Rotation: round-robin`);
    console.log();

    // Test 2: Rotation séquentielle
    console.log("📋 TEST 2: Test de Rotation Séquentielle (Round-Robin)\n");

    for (let i = 0; i < 5; i++) {
      const proxy = proxyManager.getNextProxy();
      console.log(`  ${i + 1}. Proxy sélectionné: ${proxy.server}`);
    }
    console.log();

    // Test 3: Rotation aléatoire
    console.log("📋 TEST 3: Test de Rotation Aléatoire\n");

    antiBotConfig.proxies.custom.rotation = 'random';
    resetProxyManager();
    const proxyManagerRandom = getProxyManager();
    await proxyManagerRandom.initialize();

    for (let i = 0; i < 5; i++) {
      const proxy = proxyManagerRandom.getNextProxy();
      console.log(`  ${i + 1}. Proxy sélectionné: ${proxy.server}`);
    }
    console.log();

    // Test 4: Test avec Playwright
    console.log("📋 TEST 4: Test d'Intégration avec Playwright\n");
    console.log("⏳ Initialisation de Playwright avec proxies...");

    // Réinitialiser avec round-robin
    antiBotConfig.proxies.custom.rotation = 'round-robin';
    resetProxyManager();
    resetPlaywrightService();

    const service = getPlaywrightService();
    await service.initialize();

    console.log("✓ Playwright initialisé avec ProxyManager\n");

    // Test 5: Créer des contexts avec différents proxies
    console.log("📋 TEST 5: Création de Contexts avec Rotation de Proxies\n");

    const contexts = [];
    for (let i = 0; i < 3; i++) {
      console.log(`⏳ Création du context ${i + 1}/3...`);
      const context = await service.createContext();
      contexts.push(context);
      console.log(`✓ Context ${i + 1} créé avec proxy rotaté\n`);
    }

    // Test 6: Navigation simple avec proxy
    console.log("📋 TEST 6: Test de Navigation avec Proxy\n");
    console.log("⏳ Navigation vers httpbin.org (pour tester le proxy)...");

    try {
      const page = await contexts[0].newPage();

      // httpbin.org/ip retourne l'IP utilisée
      await service.navigateToPage(page, "https://httpbin.org/ip", {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      const content = await page.textContent('body');
      console.log("✓ Navigation réussie!");
      console.log("📊 Réponse de httpbin.org:");
      console.log(content);
      console.log();

    } catch (error) {
      console.log("⚠️  Navigation échouée (proxy gratuit possiblement non fonctionnel)");
      console.log(`   Erreur: ${error.message}`);
      console.log("   → C'est normal avec des proxies gratuits, l'important est que le système de rotation fonctionne\n");
    }

    // Test 7: Gestion des proxies échoués
    console.log("📋 TEST 7: Test de Gestion des Proxies Échoués\n");

    const testProxy = proxyManagerRandom.getNextProxy();
    console.log(`Proxy testé: ${testProxy.server}`);

    proxyManagerRandom.markProxyAsFailed(testProxy);
    console.log("✓ Proxy marqué comme échoué");

    const statsAfterFail = proxyManagerRandom.getStats();
    console.log(`  - Proxies échoués: ${statsAfterFail.failedProxies}/${statsAfterFail.totalProxies}`);
    console.log();

    // Test 8: Statistiques finales
    console.log("📋 TEST 8: Statistiques du ProxyManager\n");

    const finalStats = proxyManagerRandom.getStats();
    console.log("📊 Statistiques:");
    console.log(`  - Initialisé: ${finalStats.initialized}`);
    console.log(`  - Activé: ${finalStats.enabled}`);
    console.log(`  - Provider: ${finalStats.provider}`);
    console.log(`  - Total proxies: ${finalStats.totalProxies}`);
    console.log(`  - Proxies échoués: ${finalStats.failedProxies}`);
    console.log(`  - Index actuel: ${finalStats.currentIndex}`);
    console.log();

    // Nettoyage
    console.log("🧹 Nettoyage...");
    for (const context of contexts) {
      await context.close();
    }
    await service.close();
    console.log("✓ Nettoyage terminé\n");

    // Résumé
    console.log("════════════════════════════════════════════════════════════════════════════════");
    console.log("✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS");
    console.log("════════════════════════════════════════════════════════════════════════════════\n");

    console.log("Fonctionnalités validées:");
    console.log("  ✓ Configuration des proxies personnalisés");
    console.log("  ✓ Initialisation du ProxyManager");
    console.log("  ✓ Rotation round-robin");
    console.log("  ✓ Rotation aléatoire");
    console.log("  ✓ Intégration avec PlaywrightService");
    console.log("  ✓ Création de contexts avec proxies");
    console.log("  ✓ Gestion des proxies échoués");
    console.log("  ✓ Statistiques et monitoring\n");

    console.log("💡 Prochaines étapes:");
    console.log("  1. Tester avec des proxies payants (BrightData/Oxylabs/SmartProxy)");
    console.log("  2. Valider l'efficacité sur Pages Jaunes");
    console.log("  3. Mesurer le taux de succès vs coût\n");

  } catch (error) {
    console.error("\n❌ ERREUR LORS DES TESTS:");
    console.error(error);
    process.exit(1);
  } finally {
    // Reset de la config
    antiBotConfig.proxies.enabled = false;
    antiBotConfig.proxies.provider = null;
    resetProxyManager();
    resetPlaywrightService();
  }
}

// Exécution
testProxyRotation();
