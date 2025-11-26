/**
 * Script de test pour vérifier l'extraction des numéros de téléphone
 * Test avec des électriciens qui affichent généralement leur téléphone
 */

import { getGoogleMapsService } from '../src/services/googleMapsService.js';
import { Prospect, Tag } from '../src/models/index.js';
import { Op } from 'sequelize';

async function testTelephoneExtraction() {
  console.log('🧪 Test extraction téléphones avec électriciens\n');

  try {
    // Étape 1: Extraire avec électriciens (plus de chances d'avoir des tél)
    console.log('1️⃣ Scraping Google Maps: "electricien Paris"...');
    const googleMapsService = getGoogleMapsService();

    const prospects = await googleMapsService.search(
      {
        keyword: 'electricien',
        location: 'Paris',
        maxResults: 5 // 5 prospects pour augmenter les chances
      },
      (progress, message) => {
        console.log(`   📊 ${progress}% - ${message}`);
      }
    );

    console.log(`\n✅ ${prospects.length} prospects extraits\n`);

    // Étape 2: Afficher les données extraites
    console.log('2️⃣ Données extraites (focus téléphones):');
    let countWithPhone = 0;
    prospects.forEach((p, i) => {
      console.log(`\nProspect ${i + 1}: ${p.nom_entreprise}`);
      console.log(`  Téléphone: ${p.telephone || '❌ Non trouvé'}`);
      console.log(`  Adresse: ${p.adresse?.substring(0, 40)}...`);
      console.log(`  Note: ${p.note || 'N/A'}`);
      if (p.telephone) countWithPhone++;
    });

    console.log(`\n📊 ${countWithPhone}/${prospects.length} prospects avec téléphone avant sauvegarde`);

    // Étape 3: Sauvegarder
    console.log('\n3️⃣ Sauvegarde en base de données...');
    const savedProspects = await saveProspects(prospects, 'électricien');
    console.log(`✅ ${savedProspects.length} prospects sauvegardés\n`);

    // Étape 4: Vérifier en base
    console.log('4️⃣ Vérification en base de données:');
    let dbCountWithPhone = 0;
    for (const savedProspect of savedProspects) {
      const dbProspect = await Prospect.findByPk(savedProspect.id);
      console.log(`\n✓ ${dbProspect.nom_entreprise}`);
      console.log(`  Téléphone DB: ${dbProspect.telephone || '❌ Non trouvé'}`);
      if (dbProspect.telephone) dbCountWithPhone++;
    }

    console.log(`\n📊 ${dbCountWithPhone}/${savedProspects.length} prospects avec téléphone en DB`);

    // Résultat
    if (countWithPhone > 0 && dbCountWithPhone === countWithPhone) {
      console.log('\n✅ TEST RÉUSSI: Les téléphones extraits sont bien sauvegardés !');
      console.log(`   ${countWithPhone} téléphone(s) extrait(s) = ${dbCountWithPhone} téléphone(s) en DB`);
      process.exit(0);
    } else if (countWithPhone === 0) {
      console.log('\n⚠️ TEST INCONCLUSIF: Aucun téléphone trouvé (normal selon les résultats Google Maps)');
      console.log('   Conseil: Réessayer avec "plombier", "serrurier" ou autre métier de service');
      process.exit(0);
    } else {
      console.log('\n❌ TEST ÉCHOUÉ: Perte de téléphones entre extraction et sauvegarde');
      console.log(`   Extraits: ${countWithPhone}, En DB: ${dbCountWithPhone}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Fonction de sauvegarde (copie de scrapingController.js)
 */
async function saveProspects(prospects, keyword) {
  const savedProspects = [];

  const [tag] = await Tag.findOrCreate({
    where: { nom: 'Electricien' },
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

      // Créer avec TOUS les champs (y compris téléphone)
      const prospect = await Prospect.create({
        nom_entreprise: prospectData.nom_entreprise,
        nom_contact: prospectData.nom_contact || null,
        email: prospectData.email || null,
        telephone: prospectData.telephone || null, // IMPORTANT
        adresse: prospectData.adresse || null,
        url_site: prospectData.url_site || null,
        source_scraping: prospectData.source_scraping || 'Google Maps',
        latitude: prospectData.latitude || null,
        longitude: prospectData.longitude || null,
        note: prospectData.note || null,
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

// Lancer le test
testTelephoneExtraction();
