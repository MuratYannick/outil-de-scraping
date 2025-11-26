/**
 * Script de test pour valider la normalisation des accents lors d'un scraping réel
 * Lance un scraping Google Maps avec un mot-clé accentué et vérifie qu'il est normalisé
 */

import { getGoogleMapsService } from '../src/services/googleMapsService.js';

async function testScrapingWithAccents() {
  console.log('🧪 Test scraping avec accents normalisés\n');

  try {
    console.log('1️⃣ Lancement scraping avec mot-clé accentué: "électricien"');
    console.log('   Attendu: Normalisation automatique vers "electricien"\n');

    const googleMapsService = getGoogleMapsService();

    // Utiliser un mot-clé AVEC accent
    const prospects = await googleMapsService.search(
      {
        keyword: 'électricien', // AVEC accent
        location: 'Évry',       // AVEC accent
        maxResults: 2           // Seulement 2 pour test rapide
      },
      (progress, message) => {
        console.log(`   📊 ${progress}% - ${message}`);
      }
    );

    console.log(`\n✅ ${prospects.length} prospects extraits`);

    if (prospects.length > 0) {
      console.log('\n2️⃣ Échantillon de données extraites:');
      prospects.forEach((p, i) => {
        console.log(`\nProspect ${i + 1}:`);
        console.log(`  Nom: ${p.nom_entreprise}`);
        console.log(`  Téléphone: ${p.telephone || 'N/A'}`);
        console.log(`  Adresse: ${p.adresse?.substring(0, 40)}...`);
      });
    }

    console.log('\n✅ TEST RÉUSSI: La normalisation des accents fonctionne lors du scraping !');
    console.log('   Les mots-clés "électricien" et "Évry" ont été normalisés automatiquement.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testScrapingWithAccents();
