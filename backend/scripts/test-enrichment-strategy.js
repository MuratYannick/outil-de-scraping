/**
 * Script de test complet pour valider la stratégie d'enrichissement
 *
 * Scénarios testés:
 * 1. Enrichissement des champs null (adresse, coordonnées GPS)
 * 2. Mise à jour des champs changeants (nom_contact, email, telephone, url_site, note)
 * 3. Conservation des champs stables non fournis
 *
 * À exécuter avec: node scripts/test-enrichment-strategy.js
 */

import { Prospect, Tag } from '../src/models/index.js';
import { Op } from 'sequelize';

console.log('🧪 Test complet de la stratégie d\'enrichissement\n');
console.log('═'.repeat(80));

async function testCompleteEnrichmentStrategy() {
  try {
    const testCompanyName = 'TEST STRATEGIE ENRICHISSEMENT';
    const testAddress = '789 Rue de Test, 75001 Paris';

    // 1. Nettoyer les données de test précédentes
    console.log('\n1️⃣ Nettoyage des données de test précédentes...');
    await Prospect.destroy({
      where: { nom_entreprise: testCompanyName }
    });
    console.log('✅ Nettoyage terminé\n');

    // 2. Créer un prospect initial (version partielle)
    console.log('2️⃣ Création du prospect initial (partiel)...');
    const initialProspect = await Prospect.create({
      nom_entreprise: testCompanyName,
      adresse: testAddress,
      nom_contact: 'Jean Dupont',
      email: 'ancien@test-plomberie.fr',
      telephone: '01 11 11 11 11',
      url_site: 'https://ancien-site.fr',
      note: 4.0,
      ville: 'Paris',
      code_postal: '75001',
      // Pas de coordonnées GPS
    });

    console.log('✅ Prospect initial créé:');
    console.log(`   Nom contact: ${initialProspect.nom_contact}`);
    console.log(`   Email: ${initialProspect.email}`);
    console.log(`   Téléphone: ${initialProspect.telephone}`);
    console.log(`   URL site: ${initialProspect.url_site}`);
    console.log(`   Note: ${initialProspect.note}`);
    console.log(`   Latitude: ${initialProspect.latitude || 'N/A'}`);
    console.log(`   Longitude: ${initialProspect.longitude || 'N/A'}\n`);

    // 3. Simuler un nouveau scraping avec:
    //    - Champs changeants différents (nom_contact, email, telephone, url_site, note)
    //    - Nouveaux champs (latitude, longitude)
    console.log('3️⃣ Simulation d\'un nouveau scraping...');
    console.log('   - Nouveaux: nom_contact, email, telephone, url_site, note');
    console.log('   - Ajout: latitude, longitude\n');

    const newScrapedData = {
      nom_entreprise: testCompanyName,
      adresse: testAddress,
      nom_contact: 'Marie Martin',        // CHANGÉ
      email: 'nouveau@test-plomberie.fr', // CHANGÉ
      telephone: '02 22 22 22 22',        // CHANGÉ
      url_site: 'https://nouveau-site.fr', // CHANGÉ
      note: 4.8,                           // CHANGÉ
      latitude: 48.8566,                   // NOUVEAU
      longitude: 2.3522,                   // NOUVEAU
      ville: 'Paris',
      code_postal: '75001',
    };

    // Vérifier si le prospect existe déjà
    const existingProspect = await Prospect.findOne({
      where: {
        [Op.or]: [
          {
            nom_entreprise: newScrapedData.nom_entreprise,
            adresse: newScrapedData.adresse
          }
        ]
      }
    });

    if (!existingProspect) {
      console.log('❌ ERREUR: Prospect non trouvé (devrait exister)');
      process.exit(1);
    }

    console.log('✅ Doublon détecté, enrichissement en cours...\n');

    // Logique d'enrichissement (même que dans scrapingController)
    const updatedFields = {};
    let hasUpdates = false;

    // Champs à enrichir uniquement si null/vide
    const fieldsToEnrichIfNull = [
      'adresse', 'latitude', 'longitude', 'ville', 'code_postal', 'url_maps', 'url_linkedin'
    ];

    // Champs à toujours mettre à jour si différents
    const fieldsToAlwaysUpdate = ['nom_contact', 'email', 'telephone', 'url_site', 'note'];

    // 1. Enrichir les champs null/vides
    fieldsToEnrichIfNull.forEach(field => {
      const existingValue = existingProspect[field];
      const newValue = newScrapedData[field];

      if ((existingValue === null || existingValue === undefined || existingValue === '') &&
          newValue !== null && newValue !== undefined && newValue !== '') {
        updatedFields[field] = newValue;
        hasUpdates = true;
      }
    });

    // 2. Mettre à jour les champs qui peuvent changer
    fieldsToAlwaysUpdate.forEach(field => {
      const existingValue = existingProspect[field];
      const newValue = newScrapedData[field];

      if (newValue !== null && newValue !== undefined && newValue !== '' &&
          existingValue !== newValue) {
        updatedFields[field] = newValue;
        hasUpdates = true;
        console.log(`   🔄 Mise à jour de ${field}: "${existingValue}" → "${newValue}"`);
      }
    });

    if (hasUpdates) {
      await existingProspect.update(updatedFields);
      console.log(`\n✅ Champs mis à jour: ${Object.keys(updatedFields).join(', ')}`);
    }

    // 4. Récupérer le prospect mis à jour
    console.log('\n4️⃣ Vérification du prospect après enrichissement...');
    const updatedProspect = await Prospect.findByPk(existingProspect.id);

    console.log('✅ Prospect après enrichissement:');
    console.log(`   Nom contact: ${updatedProspect.nom_contact}`);
    console.log(`   Email: ${updatedProspect.email}`);
    console.log(`   Téléphone: ${updatedProspect.telephone}`);
    console.log(`   URL site: ${updatedProspect.url_site}`);
    console.log(`   Note: ${updatedProspect.note}`);
    console.log(`   Latitude: ${updatedProspect.latitude || 'N/A'}`);
    console.log(`   Longitude: ${updatedProspect.longitude || 'N/A'}`);
    console.log(`   Adresse: ${updatedProspect.adresse}\n`);

    // 5. Vérifications
    console.log('5️⃣ Vérifications...\n');

    const checks = [
      {
        name: 'Nom contact mis à jour (Jean Dupont → Marie Martin)',
        test: updatedProspect.nom_contact === 'Marie Martin',
        expected: 'Marie Martin',
        actual: updatedProspect.nom_contact
      },
      {
        name: 'Email mis à jour (ancien@ → nouveau@)',
        test: updatedProspect.email === 'nouveau@test-plomberie.fr',
        expected: 'nouveau@test-plomberie.fr',
        actual: updatedProspect.email
      },
      {
        name: 'Téléphone mis à jour (01... → 02...)',
        test: updatedProspect.telephone === '02 22 22 22 22',
        expected: '02 22 22 22 22',
        actual: updatedProspect.telephone
      },
      {
        name: 'URL site mise à jour (ancien-site → nouveau-site)',
        test: updatedProspect.url_site === 'https://nouveau-site.fr',
        expected: 'https://nouveau-site.fr',
        actual: updatedProspect.url_site
      },
      {
        name: 'Note mise à jour (4.0 → 4.8)',
        test: Math.abs(updatedProspect.note - 4.8) < 0.01,
        expected: 4.8,
        actual: updatedProspect.note
      },
      {
        name: 'Latitude ajoutée (était null)',
        test: Math.abs(updatedProspect.latitude - 48.8566) < 0.0001,
        expected: 48.8566,
        actual: updatedProspect.latitude
      },
      {
        name: 'Longitude ajoutée (était null)',
        test: Math.abs(updatedProspect.longitude - 2.3522) < 0.0001,
        expected: 2.3522,
        actual: updatedProspect.longitude
      },
      {
        name: 'Adresse conservée (champ stable)',
        test: updatedProspect.adresse === testAddress,
        expected: testAddress,
        actual: updatedProspect.adresse
      }
    ];

    let allPassed = true;
    checks.forEach((check, index) => {
      if (check.test) {
        console.log(`${index + 1}. ✅ ${check.name}`);
      } else {
        console.log(`${index + 1}. ❌ ${check.name}`);
        console.log(`   Attendu: ${check.expected}`);
        console.log(`   Reçu: ${check.actual}`);
        allPassed = false;
      }
    });

    // 6. Nettoyage final
    console.log('\n6️⃣ Nettoyage des données de test...');
    await Prospect.destroy({
      where: { nom_entreprise: testCompanyName }
    });
    console.log('✅ Nettoyage terminé\n');

    // Résumé final
    console.log('═'.repeat(80));
    if (allPassed) {
      console.log('✅ TEST RÉUSSI: La stratégie d\'enrichissement complète fonctionne correctement');
      console.log('\n📊 STRATÉGIE VALIDÉE:');
      console.log('   Champs stables (enrichis si null):');
      console.log('     - adresse, ville, code_postal');
      console.log('     - latitude, longitude');
      console.log('     - url_maps, url_linkedin');
      console.log('');
      console.log('   Champs changeants (toujours mis à jour):');
      console.log('     - nom_contact, email');
      console.log('     - telephone, url_site');
      console.log('     - note (avis sur 5)');
      process.exit(0);
    } else {
      console.log('❌ TEST ÉCHOUÉ: La stratégie d\'enrichissement ne fonctionne pas correctement');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error.stack);

    // Nettoyage en cas d'erreur
    try {
      await Prospect.destroy({
        where: { nom_entreprise: 'TEST STRATEGIE ENRICHISSEMENT' }
      });
    } catch (cleanupError) {
      console.error('Erreur durant le nettoyage:', cleanupError.message);
    }

    process.exit(1);
  }
}

testCompleteEnrichmentStrategy();
