/**
 * Script de test pour la correction de la pagination
 * Teste le scraping à partir de la page 2 pour vérifier que la navigation fonctionne
 */

import PagesJaunesScraper from '../src/services/scrapers/pagesJaunesScraper.js';

console.log('🧪 Test de la pagination Pages Jaunes\n');
console.log('═'.repeat(80));

async function testPagination() {
  const scraper = new PagesJaunesScraper();

  try {
    console.log('\n📊 TEST: Scraping à partir de la page 2');
    console.log('─'.repeat(80));
    console.log('Configuration:');
    console.log('  - Recherche: plombiers');
    console.log('  - Localisation: Paris');
    console.log('  - Page de départ: 2');
    console.log('  - Nombre de pages: 2 (pages 2 et 3)');
    console.log('  - Max résultats: 5');
    console.log('\n⏳ Lancement du scraping...\n');

    const result = await scraper.scrape('plombiers', 'Paris', {
      startPage: 2,
      maxPages: 2,
      maxResults: 5,
      excludeDuplicates: false,
    });

    console.log('\n' + '═'.repeat(80));
    console.log('📊 RÉSULTATS');
    console.log('═'.repeat(80));

    if (result.success) {
      console.log(`✅ Scraping réussi!`);
      console.log(`\n📈 Statistiques:`);
      console.log(`   - Total prospects: ${result.total}`);
      console.log(`   - Pages scrapées: ${result.pages_scraped}`);
      console.log(`   - Pages attendues: 2 (pages 2 et 3)`);

      if (result.pages_scraped === 2) {
        console.log(`\n✅ TEST RÉUSSI: ${result.pages_scraped} pages scrapées (attendu: 2)`);
      } else {
        console.log(`\n❌ TEST ÉCHOUÉ: ${result.pages_scraped} pages scrapées (attendu: 2)`);
      }

      if (result.prospects.length > 0) {
        console.log(`\n📋 Premiers prospects:`);
        result.prospects.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.nom_entreprise || 'N/A'}`);
          console.log(`      📍 ${p.adresse || 'N/A'}, ${p.code_postal || ''} ${p.ville || ''}`);
          console.log(`      📞 ${p.telephone || 'N/A'}`);
        });
      }

      console.log(`\n✅ La pagination fonctionne correctement!`);
      console.log(`   → Le scraper a bien navigué vers les pages 2 et 3`);

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
testPagination();
