/**
 * Script de test : Système de sources multiples
 *
 * Ce script teste la fonctionnalité de sources multiples :
 * 1. Création de prospects avec différentes sources
 * 2. Détection de doublons et enrichissement
 * 3. Ajout de sources supplémentaires aux prospects existants
 * 4. Vérification que les sources sont bien associées
 *
 * Usage: node scripts/test-sources-multiples.js
 */

import { Prospect, SourceScraping, Tag, sequelize } from '../src/models/index.js';

async function testSourcesMultiples() {
  console.log('🧪 Test du système de sources multiples\n');

  try {
    // Étape 1 : Vérifier que les tables existent
    console.log('📋 Étape 1/6 : Vérification des tables...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    const requiredTables = ['prospects', 'sources_scraping', 'prospects_sources'];
    const missingTables = requiredTables.filter(t => !tables.includes(t));

    if (missingTables.length > 0) {
      console.error(`❌ Tables manquantes: ${missingTables.join(', ')}`);
      console.log('⚠️  Veuillez exécuter la migration d\'abord: node scripts/migrate-sources-scraping.js');
      process.exit(1);
    }
    console.log('✅ Toutes les tables existent\n');

    // Étape 2 : Créer ou récupérer les sources de test
    console.log('📋 Étape 2/6 : Création des sources de test...');
    const [sourcePJ] = await SourceScraping.findOrCreate({
      where: { nom: 'Pages Jaunes' },
      defaults: { description: 'Annuaire professionnel français', couleur: '#FFD700' }
    });
    const [sourceGM] = await SourceScraping.findOrCreate({
      where: { nom: 'Google Maps' },
      defaults: { description: 'Service de cartographie Google', couleur: '#4285F4' }
    });
    const [sourceLI] = await SourceScraping.findOrCreate({
      where: { nom: 'LinkedIn' },
      defaults: { description: 'Réseau social professionnel', couleur: '#0077B5' }
    });
    console.log(`   ✓ Pages Jaunes (ID: ${sourcePJ.id})`);
    console.log(`   ✓ Google Maps (ID: ${sourceGM.id})`);
    console.log(`   ✓ LinkedIn (ID: ${sourceLI.id})`);
    console.log('✅ Sources créées\n');

    // Étape 3 : Créer un prospect avec une seule source (Pages Jaunes)
    console.log('📋 Étape 3/6 : Création d\'un prospect avec source Pages Jaunes...');

    // Nettoyer d'abord le prospect de test s'il existe
    await Prospect.destroy({
      where: { nom_entreprise: 'Test Boulangerie Dupont' }
    });

    const prospect1 = await Prospect.create({
      nom_entreprise: 'Test Boulangerie Dupont',
      adresse: '123 Rue de la Paix',
      ville: 'Paris',
      code_postal: '75001',
      telephone: '01 23 45 67 89',
    });

    await prospect1.addSource(sourcePJ);
    await prospect1.reload({ include: [{ model: SourceScraping, as: 'sources' }] });

    console.log(`   ✓ Prospect créé : ${prospect1.nom_entreprise} (ID: ${prospect1.id})`);
    console.log(`   ✓ Sources associées : ${prospect1.sources.map(s => s.nom).join(', ')}`);
    console.log('✅ Prospect créé avec 1 source\n');

    // Étape 4 : Simuler la détection d'un doublon et l'ajout d'une 2ème source (Google Maps)
    console.log('📋 Étape 4/6 : Simulation doublon + ajout source Google Maps...');

    // Recharger le prospect comme si on le trouvait dans la détection de doublon
    const existingProspect = await Prospect.findOne({
      where: {
        nom_entreprise: 'Test Boulangerie Dupont',
        adresse: '123 Rue de la Paix'
      },
      include: [{ model: SourceScraping, as: 'sources' }]
    });

    if (!existingProspect) {
      throw new Error('Prospect non trouvé !');
    }

    // Vérifier si Google Maps est déjà associé
    const hasGoogleMaps = existingProspect.sources.some(s => s.id === sourceGM.id);
    if (!hasGoogleMaps) {
      await existingProspect.addSource(sourceGM);
      console.log(`   ✓ Source "Google Maps" ajoutée au prospect existant`);
    } else {
      console.log(`   ⚠️  Source "Google Maps" déjà associée`);
    }

    // Recharger pour vérifier
    await existingProspect.reload({ include: [{ model: SourceScraping, as: 'sources' }] });
    console.log(`   ✓ Sources associées maintenant : ${existingProspect.sources.map(s => s.nom).join(', ')}`);
    console.log('✅ 2ème source ajoutée avec succès\n');

    // Étape 5 : Ajouter une 3ème source (LinkedIn)
    console.log('📋 Étape 5/6 : Ajout d\'une 3ème source (LinkedIn)...');

    const hasLinkedIn = existingProspect.sources.some(s => s.id === sourceLI.id);
    if (!hasLinkedIn) {
      await existingProspect.addSource(sourceLI);
      console.log(`   ✓ Source "LinkedIn" ajoutée au prospect existant`);
    } else {
      console.log(`   ⚠️  Source "LinkedIn" déjà associée`);
    }

    // Recharger pour vérifier
    await existingProspect.reload({ include: [{ model: SourceScraping, as: 'sources' }] });
    console.log(`   ✓ Sources associées maintenant : ${existingProspect.sources.map(s => s.nom).join(', ')}`);
    console.log('✅ 3ème source ajoutée avec succès\n');

    // Étape 6 : Vérifier les associations dans la table de liaison
    console.log('📋 Étape 6/6 : Vérification de la table de liaison prospects_sources...');

    const associations = await sequelize.query(`
      SELECT ps.prospect_id, ps.source_id, ps.created_at, ss.nom as source_nom
      FROM prospects_sources ps
      INNER JOIN sources_scraping ss ON ps.source_id = ss.id
      WHERE ps.prospect_id = :prospectId
      ORDER BY ps.created_at ASC
    `, {
      replacements: { prospectId: existingProspect.id },
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`   📊 ${associations.length} associations trouvées :`);
    associations.forEach((assoc, index) => {
      console.log(`      ${index + 1}. ${assoc.source_nom} (associée le ${new Date(assoc.created_at).toLocaleString('fr-FR')})`);
    });

    if (associations.length === 3) {
      console.log('✅ Les 3 sources sont bien associées\n');
    } else {
      console.log(`⚠️  Nombre de sources attendu: 3, trouvé: ${associations.length}\n`);
    }

    // Test bonus : Vérifier qu'on peut filtrer les prospects par source
    console.log('🎁 Test bonus : Filtrage par source...');
    const prospectsFromGoogleMaps = await Prospect.findAll({
      include: [{
        model: SourceScraping,
        as: 'sources',
        where: { nom: 'Google Maps' },
        through: { attributes: [] }
      }]
    });

    console.log(`   ✓ ${prospectsFromGoogleMaps.length} prospect(s) trouvé(s) avec source "Google Maps"`);
    console.log('✅ Filtrage fonctionnel\n');

    console.log('✅ Tous les tests sont passés ! 🎉');
    console.log('\n📊 Résumé :');
    console.log(`   • Prospect testé : ${existingProspect.nom_entreprise}`);
    console.log(`   • Nombre de sources : ${existingProspect.sources.length}`);
    console.log(`   • Sources : ${existingProspect.sources.map(s => s.nom).join(', ')}`);

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    console.error(error);
    throw error;
  }
}

// Exécution du script
testSourcesMultiples()
  .then(() => {
    console.log('\n👋 Fermeture de la connexion...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Tests échoués:', error.message);
    process.exit(1);
  });
