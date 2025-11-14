import dotenv from 'dotenv';
import { getPlaywrightService, resetPlaywrightService } from '../src/services/playwrightService.js';
import { getStealthService } from '../src/services/stealthService.js';
import { antiBotConfig } from '../src/config/antiBotConfig.js';

dotenv.config();

/**
 * Script de test du Stealth Mode
 * Teste le masquage avancé et les comportements humains
 */

async function testStealthMode() {
  console.log('═'.repeat(80));
  console.log('🔬 TEST STEALTH MODE');
  console.log('═'.repeat(80));
  console.log();

  try {
    // ========================================
    // TEST 1: SANS STEALTH (BASELINE)
    // ========================================
    console.log('📋 TEST 1: Navigation SANS Stealth (baseline)');
    console.log('─'.repeat(80));

    // Désactiver Stealth
    antiBotConfig.stealth.enabled = false;

    const service1 = getPlaywrightService();
    await service1.initialize();
    const context1 = await service1.createContext();
    const page1 = await context1.newPage();

    // Test de détection sur un site anti-bot
    const testUrl = 'https://bot.sannysoft.com/';
    console.log(`\n🌐 Navigation vers: ${testUrl}`);
    await page1.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Attendre que la page charge
    await page1.waitForTimeout(3000);

    // Analyser les résultats de détection
    const detections1 = await page1.evaluate(() => {
      const results = {};
      const rows = document.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const test = cells[0]?.textContent?.trim();
          const result = cells[1]?.textContent?.trim();
          if (test && result) {
            results[test] = result;
          }
        }
      });
      return results;
    });

    console.log('\n📊 Résultats détection SANS Stealth:');
    Object.entries(detections1).forEach(([test, result]) => {
      const icon = result.includes('failed') || result.includes('true') ? '❌' : '✅';
      console.log(`   ${icon} ${test}: ${result}`);
    });

    await page1.close();
    await service1.closeContext(context1);
    await service1.close();
    resetPlaywrightService();

    console.log('\n⏳ Attente de 5 secondes avant le test avec Stealth...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ========================================
    // TEST 2: AVEC STEALTH
    // ========================================
    console.log('═'.repeat(80));
    console.log('📋 TEST 2: Navigation AVEC Stealth Mode');
    console.log('─'.repeat(80));

    // Activer Stealth
    antiBotConfig.stealth.enabled = true;

    const service2 = getPlaywrightService();
    await service2.initialize();
    const context2 = await service2.createContext();
    const page2 = await context2.newPage();

    console.log(`\n🌐 Navigation vers: ${testUrl}`);
    await page2.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Attendre que la page charge
    await page2.waitForTimeout(3000);

    // Simuler comportement humain
    const stealthService = getStealthService();
    await stealthService.simulateHumanBehavior(page2);

    // Analyser les résultats de détection
    const detections2 = await page2.evaluate(() => {
      const results = {};
      const rows = document.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const test = cells[0]?.textContent?.trim();
          const result = cells[1]?.textContent?.trim();
          if (test && result) {
            results[test] = result;
          }
        }
      });
      return results;
    });

    console.log('\n📊 Résultats détection AVEC Stealth:');
    Object.entries(detections2).forEach(([test, result]) => {
      const icon = result.includes('failed') || result.includes('true') ? '❌' : '✅';
      console.log(`   ${icon} ${test}: ${result}`);
    });

    await page2.close();
    await service2.closeContext(context2);
    await service2.close();
    resetPlaywrightService();

    // ========================================
    // COMPARAISON DES RÉSULTATS
    // ========================================
    console.log('\n' + '═'.repeat(80));
    console.log('📈 COMPARAISON DES RÉSULTATS');
    console.log('═'.repeat(80));
    console.log();

    // Compter les détections
    const countDetections = (detections) => {
      let detected = 0;
      let total = 0;
      Object.values(detections).forEach(result => {
        total++;
        if (result.includes('failed') || result.includes('true')) {
          detected++;
        }
      });
      return { detected, total };
    };

    const stats1 = countDetections(detections1);
    const stats2 = countDetections(detections2);

    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                  SANS STEALTH vs AVEC STEALTH               │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Détections:     ${stats1.detected}/${stats1.total}  vs  ${stats2.detected}/${stats2.total}                                │`);
    console.log(`│ Amélioration:   ${stats1.detected - stats2.detected} détection(s) masquée(s)                   │`);
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log();

    // ========================================
    // CONCLUSION
    // ========================================
    console.log('═'.repeat(80));
    console.log('💡 CONCLUSION');
    console.log('═'.repeat(80));
    console.log();

    const improvement = stats1.detected - stats2.detected;

    if (improvement > 0) {
      console.log(`✅ LE STEALTH MODE EST EFFICACE!`);
      console.log(`   → ${improvement} détection(s) masquée(s) avec Stealth`);
      console.log(`   → Taux d'amélioration: ${Math.round((improvement / stats1.detected) * 100)}%`);
    } else {
      console.log('⚠️  LE STEALTH MODE N\'A PAS AMÉLIORÉ LA DÉTECTION');
      console.log('   → Même nombre de détections avec et sans Stealth');
    }

    console.log();
    console.log('📌 Recommandations:');
    console.log('   1. Stealth Mode fonctionne mieux en combinaison avec des proxies');
    console.log('   2. Certains sites nécessitent aussi un CAPTCHA solver');
    console.log('   3. Le mode HYBRID (Proxies + Stealth + CAPTCHA) offre la meilleure protection');
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
    } catch (e) {
      // Ignorer les erreurs de fermeture
    }
  }
}

// Exécuter le test
testStealthMode()
  .then(() => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
