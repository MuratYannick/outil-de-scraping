/**
 * Script de test pour la fusion de doublons
 * Crée des prospects de test avec l'exemple de L'Entr'potes
 */

import dotenv from 'dotenv';
import { sequelize, Prospect, Tag, SourceScraping } from '../src/models/index.js';

dotenv.config();

async function main() {
  try {
    console.log('🧪 Test de fusion de doublons avec l\'exemple L\'Entr\'potes\n');
    console.log('='.repeat(80) + '\n');

    // Connexion
    console.log('📡 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connecté\n');

    // Créer ou récupérer les tags
    console.log('📋 Création des tags...');
    const [tagRestaurant] = await Tag.findOrCreate({
      where: { nom: 'Restaurant' }
    });
    const [tagFastFood] = await Tag.findOrCreate({
      where: { nom: 'Fast-Food' }
    });
    console.log('✅ Tags créés\n');

    // Créer ou récupérer les sources
    console.log('📋 Création des sources...');
    const [sourcePJ] = await SourceScraping.findOrCreate({
      where: { nom: 'Pages Jaunes' },
      defaults: {
        description: 'Source Pages Jaunes',
        couleur: '#FFD700',
        actif: true
      }
    });
    const [sourceGM] = await SourceScraping.findOrCreate({
      where: { nom: 'Google Maps' },
      defaults: {
        description: 'Source Google Maps',
        couleur: '#4285F4',
        actif: true
      }
    });
    console.log('✅ Sources créées\n');

    // Vérifier si les prospects de test existent déjà
    const existingProspect1 = await Prospect.findOne({
      where: {
        nom_entreprise: "L'Entr Potes",
        ville: 'Hyères'
      }
    });

    const existingProspect2 = await Prospect.findOne({
      where: {
        nom_entreprise: "L'ENTR'potes - Restaurant - Hyères",
        ville: 'Hyères'
      }
    });

    if (existingProspect1 || existingProspect2) {
      console.log('⚠️  Des prospects de test existent déjà. Suppression...');
      if (existingProspect1) await existingProspect1.destroy();
      if (existingProspect2) await existingProspect2.destroy();
      console.log('✅ Prospects existants supprimés\n');
    }

    // Créer le premier prospect (Pages Jaunes)
    console.log('📝 Création du prospect 1 (Pages Jaunes)...');
    const prospect1 = await Prospect.create({
      nom_entreprise: "L'Entr Potes",
      telephone: "04 94 91 63 01",
      adresse: "9 rue Nicéphore Niepce",
      ville: "Hyères",
      code_postal: "83400",
      email: null,
      url_site: null,
      latitude: null,
      longitude: null,
      note: null,
      nom_contact: null
    });

    await prospect1.addTag(tagRestaurant);
    await prospect1.addSource(sourcePJ);

    console.log(`✅ Prospect 1 créé (ID: ${prospect1.id})`);
    console.log(`   Nom: "${prospect1.nom_entreprise}"`);
    console.log(`   Téléphone: ${prospect1.telephone}`);
    console.log(`   Adresse: ${prospect1.adresse}`);
    console.log(`   Tags: Restaurant`);
    console.log(`   Sources: Pages Jaunes\n`);

    // Créer le deuxième prospect (Google Maps)
    console.log('📝 Création du prospect 2 (Google Maps)...');
    const prospect2 = await Prospect.create({
      nom_entreprise: "L'ENTR'potes - Restaurant - Hyères",
      telephone: null,
      adresse: "9 Rue Nicéphore Niépce, Chem. du Palyvestre ZA du",
      ville: "Hyères",
      code_postal: "83400",
      email: null,
      url_site: null,
      latitude: 43.1043498,
      longitude: 6.1411603,
      note: 4.6,
      nom_contact: null
    });

    await prospect2.addTag(tagFastFood);
    await prospect2.addSource(sourceGM);

    console.log(`✅ Prospect 2 créé (ID: ${prospect2.id})`);
    console.log(`   Nom: "${prospect2.nom_entreprise}"`);
    console.log(`   Adresse: ${prospect2.adresse}`);
    console.log(`   GPS: ${prospect2.latitude}, ${prospect2.longitude}`);
    console.log(`   Note: ${prospect2.note}`);
    console.log(`   Tags: Fast-Food`);
    console.log(`   Sources: Google Maps\n`);

    console.log('='.repeat(80) + '\n');
    console.log('✅ PROSPECTS DE TEST CRÉÉS !\n');
    console.log('📋 Résumé:');
    console.log(`   - Prospect 1 (ID ${prospect1.id}): "${prospect1.nom_entreprise}"`);
    console.log(`   - Prospect 2 (ID ${prospect2.id}): "${prospect2.nom_entreprise}"`);
    console.log(`   - Ces deux prospects devraient être détectés comme doublons\n`);
    console.log('💡 Lancez maintenant le script de nettoyage:');
    console.log('   node backend/scripts/clean-merge-duplicates.js\n');
    console.log('📊 Résultat attendu après fusion:');
    console.log('   - 1 seul prospect conservé');
    console.log('   - Nom: "L\'ENTR\'potes - Restaurant - Hyères" (plus complet)');
    console.log('   - Téléphone: "04 94 91 63 01" (de PJ)');
    console.log('   - Adresse: "9 Rue Nicéphore Niépce..." (plus complète de GM)');
    console.log('   - GPS: 43.1043498, 6.1411603 (de GM)');
    console.log('   - Note: 4.6 (de GM)');
    console.log('   - Tags: Restaurant + Fast-Food (fusionnés)');
    console.log('   - Sources: Pages Jaunes + Google Maps (fusionnées)\n');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    await sequelize.close();
    process.exit(1);
  }
}

main();
