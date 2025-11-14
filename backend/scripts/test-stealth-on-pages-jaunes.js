import dotenv from 'dotenv';
import { getPlaywrightService, resetPlaywrightService } from '../src/services/playwrightService.js';
import { getStealthService } from '../src/services/stealthService.js';
import { antiBotConfig } from '../src/config/antiBotConfig.js';

dotenv.config();

/**
 * Script de test du Stealth Mode sur Pages Jaunes
 * Compare les résultats SANS Stealth vs AVEC Stealth
 */

async function testStealthOnPagesJaunes() {
  console.log('═'.repeat(80));
  console.log('🧪 TEST STEALTH MODE SUR PAGES JAUNES');
  console.log('═'.repeat(80));
  console.log();

  const testUrl = 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier&ou=75001&proximite=0';

  try {
    // ========================================
    // TEST 1: SANS STEALTH (BASELINE)
    // ========================================
    console.log('📋 TEST 1: Scraping SANS Stealth Mode (baseline)');
    console.log('─'.repeat(80));

    // Désactiver Stealth temporairement
    const originalStealthEnabled = antiBotConfig.stealth.enabled;
    antiBotConfig.stealth.enabled = false;

    const service1 = getPlaywrightService();
    await service1.initialize();
    const context1 = await service1.createContext();
    const page1 = await context1.newPage();

    console.log(`\n🌐 Navigation vers: ${testUrl}`);
    await page1.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Attendre que la page charge
    await page1.waitForTimeout(3000);

    // Vérifier si on a la page d'erreur anti-bot
    const hasErrorPage1 = await page1.evaluate(() => {
      const pageTemporaire = document.querySelector('.page-temporaire');
      const errorName = document.querySelector('.error-name');
      const noResponse = document.querySelector('.no-response');

      return {
        hasPageTemporaire: !!pageTemporaire,
        hasErrorName: !!errorName,
        hasNoResponse: !!noResponse,
        isBlocked: !!(pageTemporaire || errorName || noResponse),
        pageTitle: document.title,
        bodyText: document.body?.textContent?.substring(0, 200) || ''
      };
    });

    console.log('\n📊 Résultats SANS Stealth:');
    console.log(`   Page Title: ${hasErrorPage1.pageTitle}`);
    console.log(`   Page temporaire détectée: ${hasErrorPage1.hasPageTemporaire ? '❌ OUI' : '✅ NON'}`);
    console.log(`   Error name détectée: ${hasErrorPage1.hasErrorName ? '❌ OUI' : '✅ NON'}`);
    console.log(`   No response détectée: ${hasErrorPage1.hasNoResponse ? '❌ OUI' : '✅ NON'}`);
    console.log(`   BLOQUÉ: ${hasErrorPage1.isBlocked ? '❌ OUI' : '✅ NON'}`);

    // Essayer d'extraire des prospects
    const prospects1 = await page1.evaluate(() => {
      const cards = document.querySelectorAll('[data-pjid], .bi-bloc, .bi-list-content');
      const results = [];

      cards.forEach((card, index) => {
        const name = card.querySelector('.bi-denomination, .bi-nom, h2, h3')?.textContent?.trim();
        const address = card.querySelector('.bi-adresse, .adresse')?.textContent?.trim();
        const phone = card.querySelector('.bi-phone, .bi-numero, [data-store-phone]')?.textContent?.trim();

        if (name || address || phone) {
          results.push({ index, name, address, phone });
        }
      });

      return results;
    });

    console.log(`\n   Prospects extraits: ${prospects1.length}`);
    if (prospects1.length > 0) {
      console.log('   Exemples:');
      prospects1.slice(0, 3).forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.name || 'N/A'}`);
      });
    }

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
    console.log('📋 TEST 2: Scraping AVEC Stealth Mode');
    console.log('─'.repeat(80));

    // Réactiver Stealth
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

    // Vérifier si on a la page d'erreur anti-bot
    const hasErrorPage2 = await page2.evaluate(() => {
      const pageTemporaire = document.querySelector('.page-temporaire');
      const errorName = document.querySelector('.error-name');
      const noResponse = document.querySelector('.no-response');

      return {
        hasPageTemporaire: !!pageTemporaire,
        hasErrorName: !!errorName,
        hasNoResponse: !!noResponse,
        isBlocked: !!(pageTemporaire || errorName || noResponse),
        pageTitle: document.title,
        bodyText: document.body?.textContent?.substring(0, 200) || ''
      };
    });

    console.log('\n📊 Résultats AVEC Stealth:');
    console.log(`   Page Title: ${hasErrorPage2.pageTitle}`);
    console.log(`   Page temporaire détectée: ${hasErrorPage2.hasPageTemporaire ? '❌ OUI' : '✅ NON'}`);
    console.log(`   Error name détectée: ${hasErrorPage2.hasErrorName ? '❌ OUI' : '✅ NON'}`);
    console.log(`   No response détectée: ${hasErrorPage2.hasNoResponse ? '❌ OUI' : '✅ NON'}`);
    console.log(`   BLOQUÉ: ${hasErrorPage2.isBlocked ? '❌ OUI' : '✅ NON'}`);

    // Essayer d'extraire des prospects
    const prospects2 = await page2.evaluate(() => {
      const cards = document.querySelectorAll('[data-pjid], .bi-bloc, .bi-list-content');
      const results = [];

      cards.forEach((card, index) => {
        const name = card.querySelector('.bi-denomination, .bi-nom, h2, h3')?.textContent?.trim();
        const address = card.querySelector('.bi-adresse, .adresse')?.textContent?.trim();
        const phone = card.querySelector('.bi-phone, .bi-numero, [data-store-phone]')?.textContent?.trim();

        if (name || address || phone) {
          results.push({ index, name, address, phone });
        }
      });

      return results;
    });

    console.log(`\n   Prospects extraits: ${prospects2.length}`);
    if (prospects2.length > 0) {
      console.log('   Exemples:');
      prospects2.slice(0, 3).forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.name || 'N/A'}`);
      });
    }

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

    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                  SANS STEALTH vs AVEC STEALTH               │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Bloqué:         ${hasErrorPage1.isBlocked ? '❌ OUI' : '✅ NON'}  vs  ${hasErrorPage2.isBlocked ? '❌ OUI' : '✅ NON'}                                │`);
    console.log(`│ Prospects:      ${String(prospects1.length).padEnd(3)}  vs  ${String(prospects2.length).padEnd(3)}                                 │`);
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log();

    // ========================================
    // CONCLUSION
    // ========================================
    console.log('═'.repeat(80));
    console.log('💡 CONCLUSION');
    console.log('═'.repeat(80));
    console.log();

    const improvement = !hasErrorPage2.isBlocked && hasErrorPage1.isBlocked;
    const prospectsGained = prospects2.length - prospects1.length;

    if (improvement && prospects2.length > 0) {
      console.log('✅ LE STEALTH MODE FONCTIONNE SUR PAGES JAUNES!');
      console.log(`   → Page non bloquée avec Stealth (bloquée sans)`);
      console.log(`   → ${prospects2.length} prospects extraits avec Stealth`);
      console.log(`   → Gain: +${prospectsGained} prospects`);
      console.log();
      console.log('🎯 RECOMMANDATION: Utiliser le Stealth Mode (GRATUIT)');
    } else if (!hasErrorPage1.isBlocked && !hasErrorPage2.isBlocked) {
      console.log('⚠️  AUCUN BLOCAGE DÉTECTÉ (avec ou sans Stealth)');
      console.log('   → Pages Jaunes ne bloque peut-être plus le scraping');
      console.log('   → Ou le blocage est intermittent');
      console.log();
      console.log('🎯 RECOMMANDATION: Tester plusieurs fois pour confirmer');
    } else if (hasErrorPage2.isBlocked) {
      console.log('❌ LE STEALTH MODE SEUL NE SUFFIT PAS');
      console.log('   → Pages Jaunes détecte toujours l\'automatisation');
      console.log('   → Protection anti-bot trop avancée pour Stealth seul');
      console.log();
      console.log('🎯 RECOMMANDATIONS:');
      console.log('   1. Combiner Stealth + Proxies résidentiels (mode HYBRID)');
      console.log('   2. OU utiliser CAPTCHA solver en complément');
      console.log('   3. OU tester avec des proxies résidentiels payants');
    } else {
      console.log('⚠️  RÉSULTATS MITIGÉS');
      console.log(`   → Sans Stealth: ${hasErrorPage1.isBlocked ? 'Bloqué' : 'OK'} (${prospects1.length} prospects)`);
      console.log(`   → Avec Stealth: ${hasErrorPage2.isBlocked ? 'Bloqué' : 'OK'} (${prospects2.length} prospects)`);
      console.log();
      console.log('🎯 RECOMMANDATION: Analyser les logs et tester plusieurs fois');
    }

    console.log();
    console.log('═'.repeat(80));

    // Restaurer la config originale
    antiBotConfig.stealth.enabled = originalStealthEnabled;

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
testStealthOnPagesJaunes()
  .then(() => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
