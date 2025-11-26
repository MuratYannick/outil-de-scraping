/**
 * Script de test pour le service de geocoding inversé
 * Teste les 2 APIs (Gouv FR + Nominatim) et le système de cache
 */

import geocodingService from '../src/services/geocodingService.js';

async function testGeocodingService() {
  console.log('🧪 Test du service de geocoding inversé\n');

  try {
    // Coordonnées de test (lieux connus en France)
    const testLocations = [
      {
        name: 'Tour Eiffel, Paris',
        lat: 48.8584,
        lng: 2.2945,
        expectedVille: 'Paris',
        expectedCP: '75007',
      },
      {
        name: 'Vieux-Port, Marseille',
        lat: 43.2965,
        lng: 5.3698,
        expectedVille: 'Marseille',
        expectedCP: '13002',
      },
      {
        name: 'Place Bellecour, Lyon',
        lat: 45.7578,
        lng: 4.8320,
        expectedVille: 'Lyon',
        expectedCP: '69002',
      },
    ];

    console.log('1️⃣ Test API Gouvernementale française\n');

    for (const location of testLocations) {
      console.log(`📍 Test: ${location.name}`);
      console.log(`   Coordonnées: ${location.lat}, ${location.lng}`);

      const result = await geocodingService.reverseGeocode(location.lat, location.lng);

      console.log(`   Résultat: ${result.ville} (${result.code_postal}) [${result.source}]`);

      // Vérification basique
      if (result.ville && result.code_postal) {
        console.log(`   ✅ Ville et code postal récupérés`);
      } else {
        console.log(`   ⚠️ Données incomplètes`);
      }

      console.log();
    }

    // Test du cache
    console.log('2️⃣ Test du système de cache\n');

    console.log('📍 Requête 1 (sans cache): Tour Eiffel');
    await geocodingService.reverseGeocode(48.8584, 2.2945);

    console.log('\n📍 Requête 2 (avec cache): Tour Eiffel (même coordonnées)');
    await geocodingService.reverseGeocode(48.8584, 2.2945);

    console.log('\n📍 Requête 3 (avec cache): Tour Eiffel (coordonnées arrondies)');
    await geocodingService.reverseGeocode(48.8583, 2.2946); // Très proche, devrait utiliser le cache

    // Statistiques
    console.log('\n3️⃣ Statistiques du service\n');

    const stats = geocodingService.getStats();
    console.log(`📊 Statistiques:`);
    console.log(`   Total requêtes: ${stats.totalRequests}`);
    console.log(`   Cache hits: ${stats.cacheHits} (${stats.cacheHitRate}%)`);
    console.log(`   Succès API Gouv: ${stats.gouvApiSuccess}`);
    console.log(`   Succès Nominatim: ${stats.nominatimSuccess}`);
    console.log(`   Échecs: ${stats.failures}`);
    console.log(`   Taille cache: ${stats.cacheSize} entrées`);

    // Test avec coordonnées invalides
    console.log('\n4️⃣ Test avec données invalides\n');

    console.log('📍 Test avec coordonnées nulles');
    const invalidResult = await geocodingService.reverseGeocode(null, null);
    console.log(`   Résultat: ${JSON.stringify(invalidResult)}`);

    if (invalidResult.ville === null && invalidResult.code_postal === null) {
      console.log('   ✅ Gestion correcte des données invalides');
    } else {
      console.log('   ❌ Gestion incorrecte des données invalides');
    }

    // Test fallback Nominatim (avec coordonnées hors France)
    console.log('\n5️⃣ Test fallback Nominatim (coordonnées hors France)\n');

    console.log('📍 Test: Big Ben, Londres');
    const londonResult = await geocodingService.reverseGeocode(51.5007, -0.1246);
    console.log(`   Résultat: ${londonResult.ville} [${londonResult.source}]`);

    if (londonResult.source === 'nominatim') {
      console.log('   ✅ Fallback Nominatim fonctionnel');
    }

    // Résultat global
    console.log('\n' + '═'.repeat(60));

    const finalStats = geocodingService.getStats();
    const successRate = finalStats.totalRequests > 0
      ? Math.round(((finalStats.gouvApiSuccess + finalStats.nominatimSuccess) / finalStats.totalRequests) * 100)
      : 0;

    console.log(`📊 RÉSULTAT GLOBAL:`);
    console.log(`   Taux de succès: ${successRate}%`);
    console.log(`   Cache hit rate: ${finalStats.cacheHitRate}%`);
    console.log('═'.repeat(60));

    if (successRate >= 75) {
      console.log('\n✅ TEST RÉUSSI: Le service de geocoding fonctionne correctement !');
      process.exit(0);
    } else {
      console.log(`\n⚠️ TEST PARTIEL: Taux de succès faible (${successRate}%)`);
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testGeocodingService();
