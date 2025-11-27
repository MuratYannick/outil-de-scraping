/**
 * Script de diagnostic pour Pages Jaunes
 * Teste le scraping et affiche ce qui est réellement récupéré
 */

import PagesJaunesScraper from '../src/services/scrapers/pagesJaunesScraper.js';

console.log('🔍 Diagnostic Pages Jaunes - Analyse du DOM\n');
console.log('═'.repeat(80));

async function testPagesJaunesDebug() {
  const scraper = new PagesJaunesScraper();

  const config = {
    quoiqui: 'plombier',
    ou: 'Paris',
    maxPages: 1,
    maxResults: 5,
  };

  console.log('\n📋 Configuration du test:');
  console.log(`   Recherche: ${config.quoiqui} à ${config.ou}`);
  console.log(`   Max pages: ${config.maxPages}`);
  console.log(`   Max résultats: ${config.maxResults}\n`);

  try {
    console.log('🚀 Lancement du scraping...\n');

    const result = await scraper.scrape(config.quoiqui, config.ou, {
      maxPages: config.maxPages,
      maxResults: config.maxResults,
      onProgress: (progress, data) => {
        console.log(`📊 Progression: ${progress}% - ${data.prospects.length} prospects`);
      }
    });

    console.log('\n📊 RÉSULTAT DU SCRAPING:');
    console.log('─'.repeat(80));
    console.log(JSON.stringify(result, null, 2));

    if (result.prospects && result.prospects.length > 0) {
      console.log('\n✅ Prospects récupérés:');
      result.prospects.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.nom_entreprise || 'N/A'}`);
        console.log(`   Téléphone: ${p.telephone || 'N/A'}`);
        console.log(`   Adresse: ${p.adresse || 'N/A'}`);
        console.log(`   Email: ${p.email || 'N/A'}`);
        console.log(`   Site: ${p.url_site || 'N/A'}`);
      });
    } else {
      console.log('\n⚠️  Aucun prospect récupéré');
    }

    console.log('\n═'.repeat(80));
    console.log(`Total prospects: ${result.total || 0}`);
    console.log(`Pages scrapées: ${result.pages_scraped || 0}`);
    console.log(`Succès: ${result.success ? 'Oui' : 'Non'}`);

    if (result.error) {
      console.log(`Erreur: ${result.error}`);
    }

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);

    // Afficher les détails de l'erreur si disponibles
    if (error.cause) {
      console.error('\nCause:', error.cause);
    }

    process.exit(1);
  }
}

testPagesJaunesDebug();
