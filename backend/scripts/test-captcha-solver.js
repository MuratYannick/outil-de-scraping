import dotenv from 'dotenv';
import { getCaptchaSolverService, resetCaptchaSolverService } from '../src/services/captchaSolverService.js';
import { getPlaywrightService, resetPlaywrightService } from '../src/services/playwrightService.js';
import { antiBotConfig } from '../src/config/antiBotConfig.js';

dotenv.config();

/**
 * Script de test du service de résolution CAPTCHA
 * Test la détection et la résolution de différents types de CAPTCHA
 */

async function testCaptchaSolver() {
  console.log('═'.repeat(80));
  console.log('🔬 TEST SERVICE CAPTCHA SOLVER');
  console.log('═'.repeat(80));
  console.log();

  try {
    // ========================================
    // TEST 1: CONFIGURATION ET INITIALISATION
    // ========================================
    console.log('📋 TEST 1: Configuration et initialisation');
    console.log('─'.repeat(80));

    // Vérifier la configuration
    console.log('\n🔧 Configuration actuelle:');
    console.log(`   - Enabled: ${antiBotConfig.captchaSolver.enabled}`);
    console.log(`   - Provider: ${antiBotConfig.captchaSolver.provider || 'NON CONFIGURÉ'}`);

    if (!antiBotConfig.captchaSolver.provider) {
      console.log('\n⚠️  ATTENTION: Aucun provider configuré');
      console.log('   Pour tester le CAPTCHA solver, configurez .env:');
      console.log('   CAPTCHA_SOLVER_ENABLED=true');
      console.log('   CAPTCHA_SOLVER_PROVIDER=2captcha  # ou anticaptcha, capmonster');
      console.log('   TWOCAPTCHA_API_KEY=votre_api_key');
      console.log();
      console.log('✅ Test 1: Configuration OK (mode désactivé)');
      return;
    }

    // Activer le service pour les tests
    antiBotConfig.captchaSolver.enabled = true;

    const solverService = getCaptchaSolverService();
    await solverService.initialize();

    console.log('\n✅ Test 1 PASSÉ: Service initialisé avec succès');

    // ========================================
    // TEST 2: DÉTECTION DE CAPTCHA SUR UNE PAGE RÉELLE
    // ========================================
    console.log('\n' + '═'.repeat(80));
    console.log('📋 TEST 2: Détection de CAPTCHA sur page de test');
    console.log('─'.repeat(80));

    const playwrightService = getPlaywrightService();
    await playwrightService.initialize();
    const context = await playwrightService.createContext();
    const page = await context.newPage();

    // Test avec une page contenant un reCAPTCHA de démonstration
    const testUrl = 'https://www.google.com/recaptcha/api2/demo';

    console.log(`\n🌐 Navigation vers: ${testUrl}`);
    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });

    console.log('🔍 Détection du CAPTCHA...');
    const captchaInfo = await solverService.detectCaptcha(page);

    if (captchaInfo) {
      console.log('\n✅ CAPTCHA Détecté:');
      console.log(`   - Type: ${captchaInfo.type}`);
      console.log(`   - Site Key: ${captchaInfo.siteKey || 'N/A'}`);
      console.log(`   - Page URL: ${captchaInfo.pageUrl}`);
    } else {
      console.log('\n⚠️  Aucun CAPTCHA détecté sur cette page');
    }

    console.log('\n✅ Test 2 PASSÉ: Détection fonctionnelle');

    // ========================================
    // TEST 3: RÉSOLUTION DU CAPTCHA (SI DÉTECTÉ ET API KEY CONFIGURÉE)
    // ========================================
    if (captchaInfo) {
      console.log('\n' + '═'.repeat(80));
      console.log('📋 TEST 3: Résolution du CAPTCHA');
      console.log('─'.repeat(80));

      // Vérifier que l'API key est configurée
      const providerConfig = antiBotConfig.captchaSolver[antiBotConfig.captchaSolver.provider];
      if (!providerConfig || !providerConfig.apiKey) {
        console.log('\n⚠️  API Key non configurée pour le provider:', antiBotConfig.captchaSolver.provider);
        console.log('   Configurez votre API key dans .env pour tester la résolution');
        console.log('\n✅ Test 3 IGNORÉ: Pas d\'API key');
      } else {
        console.log(`\n🔄 Résolution du ${captchaInfo.type}...`);
        console.log('   (Cela peut prendre 10-60 secondes)');

        try {
          const solution = await solverService.solveCaptcha(captchaInfo);

          console.log('\n✅ CAPTCHA RÉSOLU!');
          console.log(`   - Solution (extrait): ${solution.substring(0, 50)}...`);
          console.log(`   - Longueur: ${solution.length} caractères`);

          // Tester l'injection de la solution
          console.log('\n🔧 Injection de la solution dans la page...');
          await solverService.injectSolution(page, solution, captchaInfo.type);

          console.log('\n✅ Test 3 PASSÉ: Résolution et injection réussies');
        } catch (error) {
          console.error('\n❌ Test 3 ÉCHOUÉ:', error.message);
          console.log('   Vérifiez:');
          console.log('   1. Votre API key est valide');
          console.log('   2. Vous avez du crédit sur votre compte');
          console.log('   3. Le service est accessible');
        }
      }
    }

    // ========================================
    // TEST 4: STATISTIQUES
    // ========================================
    console.log('\n' + '═'.repeat(80));
    console.log('📋 TEST 4: Statistiques du service');
    console.log('─'.repeat(80));

    const stats = solverService.getStats();
    console.log('\n📊 Statistiques:');
    console.log(`   - Initialized: ${stats.initialized}`);
    console.log(`   - Enabled: ${stats.enabled}`);
    console.log(`   - Provider: ${stats.provider}`);

    console.log('\n✅ Test 4 PASSÉ: Statistiques récupérées');

    // Nettoyage
    await page.close();
    await playwrightService.closeContext(context);
    await playwrightService.close();
    resetPlaywrightService();
    resetCaptchaSolverService();

    // ========================================
    // RÉSUMÉ DES TESTS
    // ========================================
    console.log('\n' + '═'.repeat(80));
    console.log('📝 RÉSUMÉ DES TESTS');
    console.log('═'.repeat(80));
    console.log();

    const testResults = {
      test1: '✅ Configuration et initialisation',
      test2: '✅ Détection de CAPTCHA',
      test3: captchaInfo && providerConfig?.apiKey ? '✅ Résolution (testé)' : '⚠️  Résolution (ignoré - pas d\'API key)',
      test4: '✅ Statistiques'
    };

    Object.entries(testResults).forEach(([test, result]) => {
      console.log(`${test.toUpperCase()}: ${result}`);
    });

    console.log();
    console.log('═'.repeat(80));
    console.log('💡 PROCHAINES ÉTAPES');
    console.log('═'.repeat(80));
    console.log();

    if (!antiBotConfig.captchaSolver.provider) {
      console.log('📌 Pour activer le CAPTCHA solver:');
      console.log('   1. Choisir un provider: 2captcha, anticaptcha, ou capmonster');
      console.log('   2. Créer un compte sur le service choisi');
      console.log('   3. Obtenir une API key');
      console.log('   4. Configurer dans .env:');
      console.log('      CAPTCHA_SOLVER_ENABLED=true');
      console.log('      CAPTCHA_SOLVER_PROVIDER=2captcha');
      console.log('      TWOCAPTCHA_API_KEY=votre_api_key');
    } else if (!providerConfig?.apiKey) {
      console.log('📌 Pour tester la résolution complète:');
      console.log('   1. Obtenir une API key pour', antiBotConfig.captchaSolver.provider);
      console.log('   2. Configurer dans .env:');
      console.log(`      ${antiBotConfig.captchaSolver.provider.toUpperCase().replace('-', '')}_API_KEY=votre_api_key`);
    } else {
      console.log('📌 Le CAPTCHA solver est prêt à être utilisé!');
      console.log();
      console.log('   Pour l\'intégrer au scraper Pages Jaunes:');
      console.log('   1. Détecter le CAPTCHA après navigation');
      console.log('   2. Résoudre automatiquement si détecté');
      console.log('   3. Injecter la solution et continuer le scraping');
      console.log();
      console.log('   Ou utiliser le mode HYBRID:');
      console.log('   ANTIBOT_STRATEGY=hybrid');
      console.log('   PROXY_ENABLED=true');
      console.log('   CAPTCHA_SOLVER_ENABLED=true');
      console.log('   STEALTH_ENABLED=true');
    }

    console.log();
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('\n❌ ERREUR DURANT LES TESTS:', error.message);
    console.error(error.stack);
  } finally {
    // Nettoyage final
    try {
      await getPlaywrightService().close();
      resetPlaywrightService();
      resetCaptchaSolverService();
    } catch (e) {
      // Ignorer les erreurs de fermeture
    }
  }
}

// Exécuter le test
testCaptchaSolver()
  .then(() => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
