/**
 * Test du nouveau format d'URL pour la pagination
 */

import PagesJaunesScraper from '../src/services/scrapers/pagesJaunesScraper.js';

console.log('🧪 Test du nouveau format d\'URL Pages Jaunes\n');
console.log('═'.repeat(80));

async function testNewUrlFormat() {
  const scraper = new PagesJaunesScraper();

  // Test 1: URL pour page 1 (doit utiliser le format de recherche classique)
  const url1 = scraper.buildSearchUrl('restaurant', 'cannes', 1);
  console.log('\n📍 Test 1 - Page 1 (format search):');
  console.log(`   URL générée: ${url1}`);
  console.log(`   Attendu: https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=restaurant&ou=cannes&univers=pagesjaunes`);
  console.log(`   ✓ ${url1 === 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=restaurant&ou=cannes&univers=pagesjaunes' ? 'OK' : 'ERREUR'}`);

  // Test 2: URL pour page 2
  const url2 = scraper.buildSearchUrl('restaurant', 'cannes', 2);
  console.log('\n📍 Test 2 - Page 2:');
  console.log(`   URL générée: ${url2}`);
  console.log(`   Attendu: https://www.pagesjaunes.fr/annuaire/cannes/restaurant?page=2`);
  console.log(`   ✓ ${url2 === 'https://www.pagesjaunes.fr/annuaire/cannes/restaurant?page=2' ? 'OK' : 'ERREUR'}`);

  // Test 3: Avec espaces (page 1 = format search)
  const url3 = scraper.buildSearchUrl('plombier chauffagiste', 'paris 15', 1);
  console.log('\n📍 Test 3 - Avec espaces (page 1, format search):');
  console.log(`   URL générée: ${url3}`);
  console.log(`   Attendu: https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier+chauffagiste&ou=paris+15&univers=pagesjaunes`);
  console.log(`   ✓ ${url3 === 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier+chauffagiste&ou=paris+15&univers=pagesjaunes' ? 'OK' : 'ERREUR'}`);

  // Test 4: Format directory avec espaces (page > 1)
  const url4 = scraper.buildSearchUrl('plombier chauffagiste', 'paris 15', 3);
  console.log('\n📍 Test 4 - Avec espaces (page 3, format directory):');
  console.log(`   URL générée: ${url4}`);
  console.log(`   Attendu: https://www.pagesjaunes.fr/annuaire/paris-15/plombier-chauffagiste?page=3`);
  console.log(`   ✓ ${url4 === 'https://www.pagesjaunes.fr/annuaire/paris-15/plombier-chauffagiste?page=3' ? 'OK' : 'ERREUR'}`);

  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Tests de construction d\'URL terminés!\n');

  // Test 4: Scraping réel depuis page 2
  console.log('═'.repeat(80));
  console.log('📊 Test de scraping réel depuis page 2');
  console.log('═'.repeat(80));
  console.log('\nConfiguration:');
  console.log('  - Recherche: restaurant à Cannes');
  console.log('  - Page de départ: 2');
  console.log('  - Nombre de pages: 1');
  console.log('  - Max résultats: 3');
  console.log('\n⏳ Lancement du scraping...\n');

  try {
    const result = await scraper.scrape('restaurant', 'Cannes', {
      startPage: 2,
      maxPages: 1,
      maxResults: 3,
    });

    console.log('\n📊 RÉSULTAT:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Total prospects: ${result.total}`);
    console.log(`   Pages scrapées: ${result.pages_scraped}`);
    console.log(`   Page attendue: 2`);

    if (result.prospects && result.prospects.length > 0) {
      console.log('\n📋 Premiers prospects:');
      result.prospects.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.nom_entreprise}`);
      });
    }

    if (result.success && result.pages_scraped === 1) {
      console.log('\n✅ TEST RÉUSSI: La pagination fonctionne!');
      process.exit(0);
    } else {
      console.log('\n❌ TEST ÉCHOUÉ');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testNewUrlFormat();
