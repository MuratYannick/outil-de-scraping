/**
 * Test d'intégration complet : Scraping Google Maps + Geocoding inversé
 * Vérifie que ville et code postal sont extraits et sauvegardés en DB
 */

import { getGoogleMapsService } from '../src/services/googleMapsService.js';
import { Prospect, Tag } from '../src/models/index.js';
import { Op } from 'sequelize';
import geocodingService from '../src/services/geocodingService.js';

async function testGoogleMapsWithGeocoding() {
  console.log('🧪 Test intégration Google Maps + Geocoding\n');

  try {
    // Nettoyer les anciens prospects de test
    console.log('1️⃣ Nettoyage des prospects de test...');
    await Prospect.destroy({
      where: {
        source_scraping: 'Google Maps'
      }
    });
    console.log('✅ Prospects de test supprimés\n');

    // Réinitialiser les stats geocoding
    geocodingService.resetStats();

    // Scraping Google Maps
    console.log('2️⃣ Lancement scraping Google Maps avec geocoding...');
    const googleMapsService = getGoogleMapsService();

    const prospects = await googleMapsService.search(
      {
        keyword: 'restaurant',
        location: 'Paris',
        maxResults: 3 // Seulement 3 pour le test
      },
      (progress, message) => {
        console.log(`   📊 ${progress}% - ${message}`);
      }
    );

    console.log(`\n✅ ${prospects.length} prospects extraits\n`);

    // Vérifier les données extraites
    console.log('3️⃣ Vérification données extraites (AVANT sauvegarde):');
    let withGPS = 0;
    let withVille = 0;
    let withCP = 0;

    prospects.forEach((p, i) => {
      console.log(`\nProspect ${i + 1}: ${p.nom_entreprise}`);
      console.log(`  GPS: ${p.latitude && p.longitude ? `${p.latitude}, ${p.longitude}` : '❌'}`);
      console.log(`  Ville: ${p.ville || '❌'}`);
      console.log(`  Code Postal: ${p.code_postal || '❌'}`);

      if (p.latitude && p.longitude) withGPS++;
      if (p.ville) withVille++;
      if (p.code_postal) withCP++;
    });

    console.log(`\n📊 Avant sauvegarde:`);
    console.log(`   GPS: ${withGPS}/${prospects.length} (${Math.round(withGPS/prospects.length*100)}%)`);
    console.log(`   Ville: ${withVille}/${prospects.length} (${Math.round(withVille/prospects.length*100)}%)`);
    console.log(`   Code Postal: ${withCP}/${prospects.length} (${Math.round(withCP/prospects.length*100)}%)`);

    // Sauvegarder en base
    console.log('\n4️⃣ Sauvegarde en base de données...');
    const savedProspects = await saveProspects(prospects, 'restaurant');
    console.log(`✅ ${savedProspects.length} prospects sauvegardés\n`);

    // Vérifier en base de données
    console.log('5️⃣ Vérification en base de données:');
    let dbWithGPS = 0;
    let dbWithVille = 0;
    let dbWithCP = 0;

    for (const savedProspect of savedProspects) {
      const dbProspect = await Prospect.findByPk(savedProspect.id);
      console.log(`\n✓ ${dbProspect.nom_entreprise}`);
      console.log(`  GPS: ${dbProspect.latitude && dbProspect.longitude ? `${dbProspect.latitude}, ${dbProspect.longitude}` : '❌'}`);
      console.log(`  Ville: ${dbProspect.ville || '❌'}`);
      console.log(`  Code Postal: ${dbProspect.code_postal || '❌'}`);

      if (dbProspect.latitude && dbProspect.longitude) dbWithGPS++;
      if (dbProspect.ville) dbWithVille++;
      if (dbProspect.code_postal) dbWithCP++;
    }

    console.log(`\n📊 Après sauvegarde (DB):`);
    console.log(`   GPS: ${dbWithGPS}/${savedProspects.length} (${Math.round(dbWithGPS/savedProspects.length*100)}%)`);
    console.log(`   Ville: ${dbWithVille}/${savedProspects.length} (${Math.round(dbWithVille/savedProspects.length*100)}%)`);
    console.log(`   Code Postal: ${dbWithCP}/${savedProspects.length} (${Math.round(dbWithCP/savedProspects.length*100)}%)`);

    // Stats geocoding
    console.log('\n6️⃣ Statistiques geocoding:');
    const stats = geocodingService.getStats();
    console.log(`   Requêtes totales: ${stats.totalRequests}`);
    console.log(`   Cache hits: ${stats.cacheHits} (${stats.cacheHitRate}%)`);
    console.log(`   Succès API Gouv: ${stats.gouvApiSuccess}`);
    console.log(`   Succès Nominatim: ${stats.nominatimSuccess}`);

    // Résultat
    console.log('\n' + '═'.repeat(60));

    const successRate = savedProspects.length > 0
      ? Math.round((dbWithVille / savedProspects.length) * 100)
      : 0;

    console.log(`📊 RÉSULTAT:`);
    console.log(`   Taux complétion ville: ${successRate}%`);
    console.log(`   Taux complétion CP: ${Math.round((dbWithCP / savedProspects.length) * 100)}%`);
    console.log('═'.repeat(60));

    if (successRate >= 80) {
      console.log('\n✅ TEST RÉUSSI: Geocoding intégré et fonctionnel !');
      console.log(`   ${dbWithVille}/${savedProspects.length} prospects avec ville et code postal`);
      process.exit(0);
    } else if (successRate >= 50) {
      console.log(`\n⚠️ TEST PARTIEL: Taux de complétion moyen (${successRate}%)`);
      process.exit(0);
    } else {
      console.log(`\n❌ TEST ÉCHOUÉ: Taux de complétion trop faible (${successRate}%)`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Fonction de sauvegarde (identique à scrapingController.js)
 */
async function saveProspects(prospects, keyword) {
  const savedProspects = [];

  const [tag] = await Tag.findOrCreate({
    where: { nom: keyword.charAt(0).toUpperCase() + keyword.slice(1) },
  });

  for (const prospectData of prospects) {
    try {
      const existingProspect = await Prospect.findOne({
        where: {
          [Op.or]: [
            prospectData.email ? { email: prospectData.email } : null,
            prospectData.url_site ? { url_site: prospectData.url_site } : null,
          ].filter(Boolean),
        },
      });

      if (existingProspect) {
        console.log(`   ⚠️ Doublon: ${prospectData.nom_entreprise}`);
        continue;
      }

      const prospect = await Prospect.create({
        nom_entreprise: prospectData.nom_entreprise,
        nom_contact: prospectData.nom_contact || null,
        email: prospectData.email || null,
        telephone: prospectData.telephone || null,
        adresse: prospectData.adresse || null,
        url_site: prospectData.url_site || null,
        source_scraping: prospectData.source_scraping || 'Google Maps',
        latitude: prospectData.latitude || null,
        longitude: prospectData.longitude || null,
        note: prospectData.note || null,
        ville: prospectData.ville || null,
        code_postal: prospectData.code_postal || null,
      });

      await prospect.addTag(tag);
      savedProspects.push(prospect);
      console.log(`   ✅ Sauvegardé: ${prospect.nom_entreprise}`);
    } catch (error) {
      console.error(`   ❌ Erreur: ${prospectData.nom_entreprise} - ${error.message}`);
    }
  }

  return savedProspects;
}

testGoogleMapsWithGeocoding();
