/**
 * Script de test pour vérifier l'extraction correcte de l'URL du site web
 * vs l'URL Google Maps
 *
 * Test avec "plombier" à "Cannes"
 */

import { getGoogleMapsService } from '../src/services/googleMapsService.js';

console.log('🧪 Test extraction URL site web vs URL Google Maps\n');
console.log('═'.repeat(80));

async function testWebsiteUrlExtraction() {
  try {
    console.log('📍 Recherche: "plombier" à "Cannes"\n');

    // Créer une instance du service
    const googleMapsService = getGoogleMapsService();

    // Scraper avec limite de 5 résultats pour test rapide
    const results = await googleMapsService.search({
      keyword: 'plombier',
      location: 'Cannes',
      maxResults: 5
    });

    console.log(`\n✅ Extraction terminée: ${results.length} prospects trouvés\n`);
    console.log('═'.repeat(80));

    // Vérifier chaque prospect
    let correctWebsiteUrls = 0;
    let googleMapsUrls = 0;
    let noUrl = 0;

    results.forEach((prospect, index) => {
      console.log(`\n${index + 1}. ${prospect.nom_entreprise}`);
      console.log('─'.repeat(80));

      if (prospect.url_site) {
        // Vérifier si c'est une URL Google Maps (erreur)
        if (prospect.url_site.includes('google.com/maps')) {
          console.log(`   ❌ URL incorrecte (Google Maps): ${prospect.url_site.substring(0, 80)}...`);
          googleMapsUrls++;
        } else {
          // C'est une URL externe (correct)
          console.log(`   ✅ URL du site web: ${prospect.url_site}`);
          correctWebsiteUrls++;
        }
      } else {
        console.log(`   ⚠️  Pas d'URL de site web`);
        noUrl++;
      }

      // Afficher aussi l'URL Google Maps si disponible
      if (prospect.url_maps) {
        console.log(`   🗺️  URL Google Maps: ${prospect.url_maps.substring(0, 80)}...`);
      }
    });

    // Résumé
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RÉSUMÉ:');
    console.log('─'.repeat(80));
    console.log(`   Total prospects: ${results.length}`);
    console.log(`   ✅ URLs correctes (site web externe): ${correctWebsiteUrls}`);
    console.log(`   ❌ URLs incorrectes (Google Maps): ${googleMapsUrls}`);
    console.log(`   ⚠️  Sans URL: ${noUrl}`);
    console.log('═'.repeat(80));

    // Vérification détaillée d'un prospect spécifique
    const elegancePlomberie = results.find(p => p.nom_entreprise.toLowerCase().includes('élégance'));
    if (elegancePlomberie) {
      console.log('\n🔍 VÉRIFICATION DÉTAILLÉE: Élégance plomberie');
      console.log('─'.repeat(80));
      console.log(`   Nom: ${elegancePlomberie.nom_entreprise}`);
      console.log(`   Adresse: ${elegancePlomberie.adresse}`);
      console.log(`   Téléphone: ${elegancePlomberie.telephone}`);
      console.log(`   URL site: ${elegancePlomberie.url_site || 'N/A'}`);
      console.log(`   URL Maps: ${elegancePlomberie.url_maps?.substring(0, 80) || 'N/A'}...`);

      if (elegancePlomberie.url_site === 'https://elegance-plombier.fr/') {
        console.log('\n   ✅ TEST RÉUSSI: URL correcte extraite (https://elegance-plombier.fr/)');
      } else if (elegancePlomberie.url_site?.includes('google.com/maps')) {
        console.log('\n   ❌ TEST ÉCHOUÉ: URL Google Maps au lieu du site web');
      } else if (!elegancePlomberie.url_site) {
        console.log('\n   ⚠️  TEST PARTIEL: Aucune URL de site web trouvée');
      } else {
        console.log(`\n   ⚠️  TEST PARTIEL: URL trouvée mais différente de l'attendue`);
        console.log(`      Attendu: https://elegance-plombier.fr/`);
        console.log(`      Reçu: ${elegancePlomberie.url_site}`);
      }
    }

    // Verdict final
    console.log('\n' + '═'.repeat(80));
    if (googleMapsUrls === 0 && correctWebsiteUrls > 0) {
      console.log('✅ TEST GLOBAL RÉUSSI: Toutes les URLs extraites sont correctes');
      console.log(`   ${correctWebsiteUrls}/${results.length} prospects ont une URL de site web valide`);
      process.exit(0);
    } else if (googleMapsUrls > 0) {
      console.log(`❌ TEST GLOBAL ÉCHOUÉ: ${googleMapsUrls} URL(s) incorrecte(s) (Google Maps au lieu du site web)`);
      process.exit(1);
    } else if (correctWebsiteUrls === 0 && noUrl === results.length) {
      console.log('⚠️  TEST GLOBAL PARTIEL: Aucune URL de site web trouvée (peut être normal)');
      process.exit(0);
    } else {
      console.log(`⚠️  TEST GLOBAL PARTIEL: ${correctWebsiteUrls}/${results.length} URLs correctes`);
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testWebsiteUrlExtraction();
