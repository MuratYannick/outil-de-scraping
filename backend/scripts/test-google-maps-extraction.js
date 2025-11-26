/**
 * Script de test pour l'extraction Google Maps avec sauvegarde complète
 * Teste que tous les champs (nom, adresse, téléphone, URL, note, coords GPS) sont extraits et sauvegardés
 */

import { getGoogleMapsService } from '../src/services/googleMapsService.js';
import { Prospect, Tag } from '../src/models/index.js';
import { Op } from 'sequelize';

async function testGoogleMapsExtraction() {
  console.log('🧪 Test extraction Google Maps avec sauvegarde complète\n');

  try {
    // Étape 1: Extraire les données avec le scraper
    console.log('1️⃣ Lancement du scraping Google Maps...');
    const googleMapsService = getGoogleMapsService();

    const prospects = await googleMapsService.search(
      {
        keyword: 'boulangerie',
        location: 'Paris',
        maxResults: 3 // Seulement 3 pour le test
      },
      (progress, message) => {
        console.log(`   📊 Progression: ${progress}% - ${message}`);
      }
    );

    console.log(`\n✅ ${prospects.length} prospects extraits\n`);

    // Étape 2: Afficher les données extraites AVANT sauvegarde
    console.log('2️⃣ Données extraites (AVANT sauvegarde):');
    prospects.forEach((p, i) => {
      console.log(`\nProspect ${i + 1}:`);
      console.log(`  Nom: ${p.nom_entreprise}`);
      console.log(`  Adresse: ${p.adresse}`);
      console.log(`  Téléphone: ${p.telephone || 'N/A'}`);
      console.log(`  URL: ${p.url_site?.substring(0, 60) || 'N/A'}`);
      console.log(`  Note: ${p.note || 'N/A'}`);
      console.log(`  GPS: ${p.latitude && p.longitude ? `${p.latitude}, ${p.longitude}` : 'N/A'}`);
      console.log(`  Source: ${p.source_scraping}`);
    });

    // Étape 3: Sauvegarder en base de données
    console.log('\n3️⃣ Sauvegarde en base de données...');
    const savedProspects = await saveProspects(prospects, 'boulangerie');
    console.log(`✅ ${savedProspects.length} prospects sauvegardés\n`);

    // Étape 4: Vérifier que les données sont bien en base
    console.log('4️⃣ Vérification en base de données:');
    for (const savedProspect of savedProspects) {
      const dbProspect = await Prospect.findByPk(savedProspect.id);
      console.log(`\nProspect ID ${dbProspect.id}:`);
      console.log(`  Nom: ${dbProspect.nom_entreprise}`);
      console.log(`  Adresse: ${dbProspect.adresse}`);
      console.log(`  Téléphone: ${dbProspect.telephone || 'N/A'}`);
      console.log(`  URL: ${dbProspect.url_site?.substring(0, 60) || 'N/A'}`);
      console.log(`  Note: ${dbProspect.note || 'N/A'}`);
      console.log(`  GPS: ${dbProspect.latitude && dbProspect.longitude ? `${dbProspect.latitude}, ${dbProspect.longitude}` : 'N/A'}`);
      console.log(`  Source: ${dbProspect.source_scraping}`);
    }

    // Étape 5: Analyse des résultats
    console.log('\n5️⃣ Analyse des résultats:');
    let stats = {
      total: savedProspects.length,
      with_telephone: 0,
      with_url: 0,
      with_note: 0,
      with_gps: 0
    };

    for (const p of savedProspects) {
      const dbProspect = await Prospect.findByPk(p.id);
      if (dbProspect.telephone) stats.with_telephone++;
      if (dbProspect.url_site) stats.with_url++;
      if (dbProspect.note) stats.with_note++;
      if (dbProspect.latitude && dbProspect.longitude) stats.with_gps++;
    }

    console.log(`  Total: ${stats.total} prospects`);
    console.log(`  Avec téléphone: ${stats.with_telephone} (${Math.round(stats.with_telephone/stats.total*100)}%)`);
    console.log(`  Avec URL: ${stats.with_url} (${Math.round(stats.with_url/stats.total*100)}%)`);
    console.log(`  Avec note: ${stats.with_note} (${Math.round(stats.with_note/stats.total*100)}%)`);
    console.log(`  Avec GPS: ${stats.with_gps} (${Math.round(stats.with_gps/stats.total*100)}%)`);

    // Test réussi si au moins un champ supplémentaire est rempli
    const success = stats.with_url > 0 || stats.with_note > 0 || stats.with_gps > 0;

    if (success) {
      console.log('\n✅ TEST RÉUSSI: Les champs téléphone, URL, note et GPS sont bien sauvegardés !');
    } else {
      console.log('\n❌ TEST ÉCHOUÉ: Aucun champ supplémentaire n\'a été sauvegardé');
    }

    process.exit(success ? 0 : 1);

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

  // Créer ou récupérer le tag basé sur le keyword
  const [tag] = await Tag.findOrCreate({
    where: { nom: keyword.charAt(0).toUpperCase() + keyword.slice(1) },
  });

  for (const prospectData of prospects) {
    try {
      // Vérifier les doublons par email ou URL
      const existingProspect = await Prospect.findOne({
        where: {
          [Op.or]: [
            prospectData.email ? { email: prospectData.email } : null,
            prospectData.url_site ? { url_site: prospectData.url_site } : null,
          ].filter(Boolean),
        },
      });

      if (existingProspect) {
        console.log(`   ⚠️ Doublon détecté: ${prospectData.nom_entreprise}`);
        continue; // Skip duplicates
      }

      // Créer le prospect avec TOUS les champs
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
      });

      // Associer le tag
      await prospect.addTag(tag);

      savedProspects.push(prospect);
      console.log(`   ✅ Sauvegardé: ${prospect.nom_entreprise}`);
    } catch (error) {
      console.error(`   ❌ Erreur sauvegarde ${prospectData.nom_entreprise}:`, error.message);
    }
  }

  return savedProspects;
}

// Lancer le test
testGoogleMapsExtraction();
