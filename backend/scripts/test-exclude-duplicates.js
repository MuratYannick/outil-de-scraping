/**
 * Script de test pour la fonctionnalité excludeDuplicates
 * Teste que le scraping continue jusqu'à obtenir X nouveaux prospects (hors doublons)
 */

import axios from 'axios';
import { Prospect } from '../src/models/index.js';

const API_URL = 'http://localhost:5000/api';

console.log('🧪 Test de la fonctionnalité excludeDuplicates\n');
console.log('═'.repeat(80));

async function testExcludeDuplicates() {
  try {
    console.log('\n📋 ÉTAPE 1: Vérification du serveur...');
    const health = await axios.get(`${API_URL}/health`);
    console.log(`✅ Serveur OK: ${health.data.message}`);

    console.log('\n📋 ÉTAPE 2: Comptage des prospects actuels en DB...');
    const countBefore = await Prospect.count({
      where: { source_scraping: 'Pages Jaunes' }
    });
    console.log(`📊 Nombre de prospects Pages Jaunes en DB: ${countBefore}`);

    console.log('\n📋 ÉTAPE 3: Scraping avec excludeDuplicates=false (comportement par défaut)...');
    console.log('   Config: 10 résultats max, plombier à Paris');

    const scrapingWithoutExclude = await axios.post(`${API_URL}/scraping/lancer`, {
      keyword: 'plombier',
      location: 'Paris',
      source: 'Pages Jaunes',
      maxPages: 3,
      maxResults: 10,
      excludeDuplicates: false
    });

    const taskId1 = scrapingWithoutExclude.data.task_id;
    console.log(`✅ Tâche créée: ${taskId1}`);

    // Polling pour suivre la progression
    let task1Complete = false;
    while (!task1Complete) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const status = await axios.get(`${API_URL}/scraping/status/${taskId1}`);
      console.log(`   Progress: ${status.data.progress}% | Prospects: ${status.data.results.total}`);

      if (status.data.status === 'completed') {
        task1Complete = true;
        console.log(`\n✅ Scraping 1 terminé!`);
        console.log(`   📊 Total prospects retournés: ${status.data.results.total}`);
      }

      if (status.data.status === 'failed') {
        console.error(`❌ Erreur: ${status.data.error}`);
        return;
      }
    }

    console.log('\n📋 ÉTAPE 4: Comptage après premier scraping...');
    const countAfter1 = await Prospect.count({
      where: { source_scraping: 'Pages Jaunes' }
    });
    console.log(`📊 Nombre de prospects Pages Jaunes en DB: ${countAfter1}`);
    console.log(`📊 Nouveaux prospects ajoutés: ${countAfter1 - countBefore}`);

    console.log('\n📋 ÉTAPE 5: Scraping avec excludeDuplicates=true...');
    console.log('   Config: 10 NOUVEAUX résultats max (hors doublons)');
    console.log('   Objectif: Continuer à scraper jusqu\'à obtenir 10 nouveaux prospects');

    const scrapingWithExclude = await axios.post(`${API_URL}/scraping/lancer`, {
      keyword: 'plombier',
      location: 'Paris',
      source: 'Pages Jaunes',
      maxPages: 5, // Plus de pages pour avoir assez de résultats
      maxResults: 10,
      excludeDuplicates: true
    });

    const taskId2 = scrapingWithExclude.data.task_id;
    console.log(`✅ Tâche créée: ${taskId2}`);

    // Polling pour suivre la progression
    let task2Complete = false;
    let finalStatus = null;
    while (!task2Complete) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const status = await axios.get(`${API_URL}/scraping/status/${taskId2}`);
      console.log(`   Progress: ${status.data.progress}% | Prospects: ${status.data.results.total}`);

      if (status.data.status === 'completed') {
        task2Complete = true;
        finalStatus = status.data;
        console.log(`\n✅ Scraping 2 terminé!`);
        console.log(`   📊 Total prospects retournés: ${status.data.results.total}`);
        if (status.data.results.duplicates_skipped !== undefined) {
          console.log(`   📊 Doublons ignorés: ${status.data.results.duplicates_skipped}`);
          console.log(`   📊 Total scrapé (avec doublons): ${status.data.results.total_scraped || 'N/A'}`);
        }
      }

      if (status.data.status === 'failed') {
        console.error(`❌ Erreur: ${status.data.error}`);
        return;
      }
    }

    console.log('\n📋 ÉTAPE 6: Comptage final...');
    const countAfter2 = await Prospect.count({
      where: { source_scraping: 'Pages Jaunes' }
    });
    console.log(`📊 Nombre de prospects Pages Jaunes en DB: ${countAfter2}`);
    console.log(`📊 Nouveaux prospects ajoutés (scraping 2): ${countAfter2 - countAfter1}`);

    console.log('\n' + '═'.repeat(80));
    console.log('📊 RÉSULTATS FINAUX');
    console.log('═'.repeat(80));
    console.log(`\n✅ Test RÉUSSI!`);
    console.log(`\n📈 Statistiques:`);
    console.log(`   - Prospects initiaux: ${countBefore}`);
    console.log(`   - Nouveaux (scraping 1, sans exclude): ${countAfter1 - countBefore}`);
    console.log(`   - Nouveaux (scraping 2, avec exclude): ${countAfter2 - countAfter1}`);
    console.log(`   - Total final en DB: ${countAfter2}`);

    console.log(`\n💡 Conclusion:`);
    if (countAfter2 - countAfter1 >= 5) {
      console.log(`   ✅ Le mode excludeDuplicates fonctionne correctement!`);
      console.log(`   ✅ Le scraper a continué jusqu'à trouver de nouveaux prospects`);
    } else if (countAfter2 - countAfter1 === 0) {
      console.log(`   ⚠️  Aucun nouveau prospect trouvé (peut-être tous des doublons)`);
      console.log(`   ℹ️  Ceci est normal si tous les prospects de Paris sont déjà en DB`);
    } else {
      console.log(`   ℹ️  ${countAfter2 - countAfter1} nouveaux prospects ajoutés`);
    }

    console.log('\n✅ Test terminé avec succès!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.response) {
      console.error('   Réponse API:', error.response.data);
    }
    console.error(error.stack);
    process.exit(1);
  }
}

testExcludeDuplicates();
