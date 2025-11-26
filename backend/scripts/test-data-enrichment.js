/**
 * Script de test pour vérifier l'enrichissement des données
 *
 * Scénario:
 * 1. Créer un prospect avec seulement nom + adresse + url_site
 * 2. Re-scraper la même entreprise (devrait ajouter téléphone, email, etc.)
 * 3. Vérifier que l'url_site est conservé ET que les nouveaux champs sont ajoutés
 *
 * À exécuter avec: node scripts/test-data-enrichment.js
 */

import { Prospect, Tag } from '../src/models/index.js';
import { Op } from 'sequelize';

console.log('🧪 Test enrichissement des données\n');
console.log('═'.repeat(80));

async function testDataEnrichment() {
  try {
    const testCompanyName = 'TEST ENRICHISSEMENT PLOMBERIE';
    const testAddress = '123 Rue de Test, 75015 Paris';

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
      url_site: 'https://test-plomberie.fr',
      ville: 'Paris',
      code_postal: '75015',
      // Pas de téléphone, email, latitude, longitude, etc.
    });
    console.log('✅ Prospect initial créé:');
    console.log(`   ID: ${initialProspect.id}`);
    console.log(`   Nom: ${initialProspect.nom_entreprise}`);
    console.log(`   Adresse: ${initialProspect.adresse}`);
    console.log(`   URL site: ${initialProspect.url_site}`);
    console.log(`   Téléphone: ${initialProspect.telephone || 'N/A'}`);
    console.log(`   Email: ${initialProspect.email || 'N/A'}`);
    console.log(`   Latitude: ${initialProspect.latitude || 'N/A'}`);
    console.log(`   Longitude: ${initialProspect.longitude || 'N/A'}\n`);

    // 3. Simuler un nouveau scraping avec des données complémentaires
    console.log('3️⃣ Simulation d\'un nouveau scraping avec données complémentaires...');

    const newScrapedData = {
      nom_entreprise: testCompanyName,
      adresse: testAddress,
      telephone: '01 23 45 67 89',
      email: 'contact@test-plomberie.fr',
      latitude: 48.8566,
      longitude: 2.3522,
      ville: 'Paris',
      code_postal: '75015',
      // Pas d'url_site dans ce nouveau scraping
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

    console.log('✅ Doublon détecté, enrichissement en cours...');

    // Logique d'enrichissement (même que dans scrapingController)
    const updatedFields = {};
    let hasUpdates = false;

    const fieldsToEnrich = [
      'nom_contact', 'email', 'telephone', 'adresse', 'url_site',
      'latitude', 'longitude', 'note', 'ville', 'code_postal', 'url_maps', 'url_linkedin'
    ];

    fieldsToEnrich.forEach(field => {
      const existingValue = existingProspect[field];
      const newValue = newScrapedData[field];

      if ((existingValue === null || existingValue === undefined || existingValue === '') &&
          newValue !== null && newValue !== undefined && newValue !== '') {
        updatedFields[field] = newValue;
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      await existingProspect.update(updatedFields);
      console.log(`✅ Champs enrichis: ${Object.keys(updatedFields).join(', ')}`);
      console.log(`   Détails: ${JSON.stringify(updatedFields, null, 2)}\n`);
    }

    // 4. Récupérer le prospect enrichi
    console.log('4️⃣ Vérification du prospect enrichi...');
    const enrichedProspect = await Prospect.findByPk(existingProspect.id);

    console.log('✅ Prospect après enrichissement:');
    console.log(`   ID: ${enrichedProspect.id}`);
    console.log(`   Nom: ${enrichedProspect.nom_entreprise}`);
    console.log(`   Adresse: ${enrichedProspect.adresse}`);
    console.log(`   URL site: ${enrichedProspect.url_site}`);
    console.log(`   Téléphone: ${enrichedProspect.telephone || 'N/A'}`);
    console.log(`   Email: ${enrichedProspect.email || 'N/A'}`);
    console.log(`   Latitude: ${enrichedProspect.latitude || 'N/A'}`);
    console.log(`   Longitude: ${enrichedProspect.longitude || 'N/A'}\n`);

    // 5. Vérifications
    console.log('5️⃣ Vérifications...\n');

    const checks = [
      {
        name: 'URL site conservée',
        test: enrichedProspect.url_site === 'https://test-plomberie.fr',
        expected: 'https://test-plomberie.fr',
        actual: enrichedProspect.url_site
      },
      {
        name: 'Téléphone ajouté',
        test: enrichedProspect.telephone === '01 23 45 67 89',
        expected: '01 23 45 67 89',
        actual: enrichedProspect.telephone
      },
      {
        name: 'Email ajouté',
        test: enrichedProspect.email === 'contact@test-plomberie.fr',
        expected: 'contact@test-plomberie.fr',
        actual: enrichedProspect.email
      },
      {
        name: 'Latitude ajoutée',
        test: Math.abs(enrichedProspect.latitude - 48.8566) < 0.0001,
        expected: 48.8566,
        actual: enrichedProspect.latitude
      },
      {
        name: 'Longitude ajoutée',
        test: Math.abs(enrichedProspect.longitude - 2.3522) < 0.0001,
        expected: 2.3522,
        actual: enrichedProspect.longitude
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
      console.log('✅ TEST RÉUSSI: L\'enrichissement des données fonctionne correctement');
      console.log('   - Les données existantes sont conservées (url_site)');
      console.log('   - Les nouvelles données sont ajoutées (téléphone, email, coordonnées)');
      console.log('   - Aucune donnée n\'est perdue');
      process.exit(0);
    } else {
      console.log('❌ TEST ÉCHOUÉ: L\'enrichissement des données ne fonctionne pas correctement');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error.stack);

    // Nettoyage en cas d'erreur
    try {
      await Prospect.destroy({
        where: { nom_entreprise: 'TEST ENRICHISSEMENT PLOMBERIE' }
      });
    } catch (cleanupError) {
      console.error('Erreur durant le nettoyage:', cleanupError.message);
    }

    process.exit(1);
  }
}

testDataEnrichment();
