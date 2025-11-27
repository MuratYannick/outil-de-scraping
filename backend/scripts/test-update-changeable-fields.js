/**
 * Script de test pour vérifier la mise à jour des champs qui peuvent changer
 *
 * Scénario:
 * 1. Créer un prospect avec téléphone + url_site
 * 2. Re-scraper avec un nouveau téléphone + nouvelle url_site
 * 3. Vérifier que les champs sont mis à jour (téléphone et url changent)
 *
 * À exécuter avec: node scripts/test-update-changeable-fields.js
 */

import { Prospect, Tag } from '../src/models/index.js';
import { Op } from 'sequelize';

console.log('🧪 Test mise à jour des champs changeants (téléphone, url_site, note)\n');
console.log('═'.repeat(80));

async function testUpdateChangeableFields() {
  try {
    const testCompanyName = 'TEST UPDATE PLOMBERIE';
    const testAddress = '456 Rue de Test, 06400 Cannes';

    // 1. Nettoyer les données de test précédentes
    console.log('\n1️⃣ Nettoyage des données de test précédentes...');
    await Prospect.destroy({
      where: { nom_entreprise: testCompanyName }
    });
    console.log('✅ Nettoyage terminé\n');

    // 2. Créer un prospect initial avec téléphone + url_site
    console.log('2️⃣ Création du prospect initial...');
    const initialProspect = await Prospect.create({
      nom_entreprise: testCompanyName,
      adresse: testAddress,
      telephone: '01 11 11 11 11',
      url_site: 'https://ancienne-plomberie.fr',
      email: 'contact@test-plomberie.fr',
      ville: 'Cannes',
      code_postal: '06400',
      note: 4.5 // Note d'avis sur 5
    });
    console.log('✅ Prospect initial créé:');
    console.log(`   ID: ${initialProspect.id}`);
    console.log(`   Nom: ${initialProspect.nom_entreprise}`);
    console.log(`   Téléphone: ${initialProspect.telephone}`);
    console.log(`   URL site: ${initialProspect.url_site}`);
    console.log(`   Email: ${initialProspect.email}`);
    console.log(`   Note: ${initialProspect.note}\n`);

    // 3. Simuler un nouveau scraping avec téléphone et url_site différents
    console.log('3️⃣ Simulation d\'un nouveau scraping avec téléphone et URL différents...');

    const newScrapedData = {
      nom_entreprise: testCompanyName,
      adresse: testAddress,
      telephone: '02 22 22 22 22', // NOUVEAU téléphone
      url_site: 'https://nouvelle-plomberie.fr', // NOUVELLE url
      latitude: 43.5528,
      longitude: 7.0174,
      ville: 'Cannes',
      code_postal: '06400',
      // Email et note restent inchangés (ne devraient pas changer)
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
      'nom_contact', 'email', 'adresse',
      'latitude', 'longitude', 'ville', 'code_postal', 'url_maps', 'url_linkedin'
    ];

    // Champs à toujours mettre à jour si différents
    const fieldsToAlwaysUpdate = ['telephone', 'url_site'];

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
      console.log(`   Détails: ${JSON.stringify(updatedFields, null, 2)}\n`);
    }

    // 4. Récupérer le prospect mis à jour
    console.log('4️⃣ Vérification du prospect mis à jour...');
    const updatedProspect = await Prospect.findByPk(existingProspect.id);

    console.log('✅ Prospect après mise à jour:');
    console.log(`   ID: ${updatedProspect.id}`);
    console.log(`   Nom: ${updatedProspect.nom_entreprise}`);
    console.log(`   Téléphone: ${updatedProspect.telephone}`);
    console.log(`   URL site: ${updatedProspect.url_site}`);
    console.log(`   Email: ${updatedProspect.email}`);
    console.log(`   Note: ${updatedProspect.note}`);
    console.log(`   Latitude: ${updatedProspect.latitude || 'N/A'}`);
    console.log(`   Longitude: ${updatedProspect.longitude || 'N/A'}\n`);

    // 5. Vérifications
    console.log('5️⃣ Vérifications...\n');

    const checks = [
      {
        name: 'Téléphone mis à jour (01... → 02...)',
        test: updatedProspect.telephone === '02 22 22 22 22',
        expected: '02 22 22 22 22',
        actual: updatedProspect.telephone
      },
      {
        name: 'URL site mise à jour (ancienne → nouvelle)',
        test: updatedProspect.url_site === 'https://nouvelle-plomberie.fr',
        expected: 'https://nouvelle-plomberie.fr',
        actual: updatedProspect.url_site
      },
      {
        name: 'Email conservé (non changé car non spécifié dans nouveau scraping)',
        test: updatedProspect.email === 'contact@test-plomberie.fr',
        expected: 'contact@test-plomberie.fr',
        actual: updatedProspect.email
      },
      {
        name: 'Note conservée (4.5, non changée)',
        test: Math.abs(updatedProspect.note - 4.5) < 0.01,
        expected: 4.5,
        actual: updatedProspect.note
      },
      {
        name: 'Latitude ajoutée (était null)',
        test: Math.abs(updatedProspect.latitude - 43.5528) < 0.0001,
        expected: 43.5528,
        actual: updatedProspect.latitude
      },
      {
        name: 'Longitude ajoutée (était null)',
        test: Math.abs(updatedProspect.longitude - 7.0174) < 0.0001,
        expected: 7.0174,
        actual: updatedProspect.longitude
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
      console.log('✅ TEST RÉUSSI: La mise à jour des champs changeants fonctionne correctement');
      console.log('   - Les champs stables (email, note) sont conservés');
      console.log('   - Les champs changeants (téléphone, url_site) sont mis à jour');
      console.log('   - Les nouveaux champs (latitude, longitude) sont ajoutés');
      console.log('   - Aucune donnée n\'est perdue');
      process.exit(0);
    } else {
      console.log('❌ TEST ÉCHOUÉ: La mise à jour des champs changeants ne fonctionne pas correctement');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error.stack);

    // Nettoyage en cas d'erreur
    try {
      await Prospect.destroy({
        where: { nom_entreprise: 'TEST UPDATE PLOMBERIE' }
      });
    } catch (cleanupError) {
      console.error('Erreur durant le nettoyage:', cleanupError.message);
    }

    process.exit(1);
  }
}

testUpdateChangeableFields();
