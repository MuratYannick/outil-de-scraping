/**
 * Script de test pour vérifier la pagination
 * Teste si les prospects apparaissent en double sur différentes pages
 */

import { Prospect, Tag } from '../src/models/index.js';

console.log('🧪 Test de pagination\n');
console.log('═'.repeat(80));

async function testPagination() {
  try {
    const limit = 20;

    // Page 1
    console.log('\n📄 PAGE 1 (offset=0, limit=20)');
    console.log('─'.repeat(80));
    const page1 = await Prospect.findAndCountAll({
      include: [
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
        },
      ],
      limit: limit,
      offset: 0,
      order: [["date_ajout", "DESC"]],
      distinct: true,
      subQuery: false,
    });

    console.log(`Total prospects: ${page1.count}`);
    console.log(`Prospects sur cette page: ${page1.rows.length}\n`);

    page1.rows.forEach((p, i) => {
      console.log(`${i + 1}. ID:${p.id} - ${p.nom_entreprise}`);
    });

    // Page 2
    console.log('\n📄 PAGE 2 (offset=20, limit=20)');
    console.log('─'.repeat(80));
    const page2 = await Prospect.findAndCountAll({
      include: [
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
        },
      ],
      limit: limit,
      offset: 20,
      order: [["date_ajout", "DESC"]],
      distinct: true,
      subQuery: false,
    });

    console.log(`Total prospects: ${page2.count}`);
    console.log(`Prospects sur cette page: ${page2.rows.length}\n`);

    page2.rows.forEach((p, i) => {
      console.log(`${i + 1}. ID:${p.id} - ${p.nom_entreprise}`);
    });

    // Vérifier les doublons
    console.log('\n🔍 VÉRIFICATION DES DOUBLONS');
    console.log('─'.repeat(80));

    const page1Ids = page1.rows.map(p => p.id);
    const page2Ids = page2.rows.map(p => p.id);

    const duplicates = page1Ids.filter(id => page2Ids.includes(id));

    if (duplicates.length > 0) {
      console.log(`❌ ${duplicates.length} doublon(s) détecté(s):\n`);

      for (const id of duplicates) {
        const prospect = page1.rows.find(p => p.id === id);
        console.log(`   ID:${id} - ${prospect.nom_entreprise}`);

        // Position dans chaque page
        const posPage1 = page1Ids.indexOf(id) + 1;
        const posPage2 = page2Ids.indexOf(id) + 1;
        console.log(`   Position: Page 1 #${posPage1}, Page 2 #${posPage2}`);
        console.log(`   Tags: ${prospect.tags.length}`);
        console.log('');
      }

      console.log('═'.repeat(80));
      console.log('❌ TEST ÉCHOUÉ: Des doublons existent entre les pages');
      process.exit(1);
    } else {
      console.log('✅ Aucun doublon détecté entre page 1 et page 2');
      console.log('═'.repeat(80));
      console.log('✅ TEST RÉUSSI: La pagination fonctionne correctement');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPagination();
