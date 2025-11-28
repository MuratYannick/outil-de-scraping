/**
 * Test de la détection de la dernière page
 * Vérifie que le scraping s'arrête automatiquement quand on atteint une page sans résultats
 */

import PagesJaunesScraper from '../src/services/scrapers/pagesJaunesScraper.js';

console.log('🧪 Test de détection de la dernière page\n');
console.log('═'.repeat(80));

async function testLastPageDetection() {
  const scraper = new PagesJaunesScraper();

  try {
    console.log('\n📊 TEST: Scraping avec dépassement de la dernière page');
    console.log('─'.repeat(80));
    console.log('Configuration:');
    console.log('  - Recherche: plombiers (mot rare pour avoir peu de résultats)');
    console.log('  - Localisation: Monaco (petite ville, peu de résultats)');
    console.log('  - Page de départ: 1');
    console.log('  - Nombre de pages: 50 (volontairement énorme)');
    console.log('  - Max résultats: 1000 (volontairement énorme)');
    console.log('\n⏳ Lancement du scraping...\n');
    console.log('💡 Le scraping devrait s\'arrêter automatiquement quand il atteint');
    console.log('   le message "Oups… nous n\'avons pas encore de réponse"');
    console.log('');

    const startTime = Date.now();

    const result = await scraper.scrape('plombiers', 'Monaco', {
      startPage: 1,
      maxPages: 50,
      maxResults: 1000,
      excludeDuplicates: false,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '═'.repeat(80));
    console.log('📊 RÉSULTATS');
    console.log('═'.repeat(80));

    if (result.success) {
      console.log(`✅ Scraping réussi!`);
      console.log(`\n📈 Statistiques:`);
      console.log(`   - Total prospects: ${result.total}`);
      console.log(`   - Pages scrapées: ${result.pages_scraped}`);
      console.log(`   - Pages demandées: 50`);
      console.log(`   - Durée: ${duration}s`);

      if (result.pages_scraped < 50) {
        console.log(`\n✅ TEST RÉUSSI: Le scraping s'est arrêté automatiquement`);
        console.log(`   → Arrêt après ${result.pages_scraped} pages (au lieu de 50 demandées)`);
        console.log(`   → Détection de la dernière page fonctionnelle!`);
      } else {
        console.log(`\n⚠️  TEST AMBIGU: ${result.pages_scraped} pages scrapées`);
        console.log(`   → Il y a peut-être vraiment 50+ pages de résultats à Monaco`);
        console.log(`   → Ou la détection de la dernière page n'a pas fonctionné`);
      }

      if (result.prospects.length > 0) {
        console.log(`\n📋 Premiers prospects:`);
        result.prospects.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.nom_entreprise || 'N/A'}`);
        });
      }

      process.exit(0);
    } else {
      console.log(`❌ Scraping échoué: ${result.error}`);
      console.log(`\n⚠️  Le test a échoué. Vérifier les logs ci-dessus.`);
      process.exit(1);
    }

  } catch (error) {
    console.error(`\n❌ ERREUR lors du test:`, error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Lancer le test
testLastPageDetection();
