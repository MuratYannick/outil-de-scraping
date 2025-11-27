/**
 * Script de test pour vérifier la pagination via l'API réelle
 */

async function testApiPagination() {
  console.log('🧪 Test de pagination via API\n');
  console.log('═'.repeat(80));

  try {
    // Page 1
    console.log('\n📄 PAGE 1 (offset=0, limit=10)');
    console.log('─'.repeat(80));
    const page1Response = await fetch('http://localhost:3001/api/prospects?limit=10&offset=0');
    const page1Data = await page1Response.json();

    console.log(`Total prospects: ${page1Data.total}`);
    console.log(`Prospects sur cette page: ${page1Data.data.length}\n`);

    page1Data.data.forEach((p, i) => {
      console.log(`${i + 1}. ID:${p.id} - ${p.nom_entreprise}`);
    });

    // Page 2
    console.log('\n📄 PAGE 2 (offset=10, limit=10)');
    console.log('─'.repeat(80));
    const page2Response = await fetch('http://localhost:3001/api/prospects?limit=10&offset=10');
    const page2Data = await page2Response.json();

    console.log(`Total prospects: ${page2Data.total}`);
    console.log(`Prospects sur cette page: ${page2Data.data.length}\n`);

    page2Data.data.forEach((p, i) => {
      console.log(`${i + 1}. ID:${p.id} - ${p.nom_entreprise}`);
    });

    // Vérifier les doublons
    console.log('\n🔍 VÉRIFICATION DES DOUBLONS');
    console.log('─'.repeat(80));

    const page1Ids = page1Data.data.map(p => p.id);
    const page2Ids = page2Data.data.map(p => p.id);

    const duplicates = page1Ids.filter(id => page2Ids.includes(id));

    if (duplicates.length > 0) {
      console.log(`❌ ${duplicates.length} doublon(s) détecté(s):\n`);

      for (const id of duplicates) {
        const prospect = page1Data.data.find(p => p.id === id);
        console.log(`   ID:${id} - ${prospect.nom_entreprise}`);

        const posPage1 = page1Ids.indexOf(id) + 1;
        const posPage2 = page2Ids.indexOf(id) + 1;
        console.log(`   Position: Page 1 #${posPage1}, Page 2 #${posPage2}`);
        console.log('');
      }

      console.log('═'.repeat(80));
      console.log('❌ TEST ÉCHOUÉ: Des doublons existent entre les pages');
      process.exit(1);
    } else {
      console.log('✅ Aucun doublon détecté entre page 1 et page 2');
      console.log('═'.repeat(80));
      console.log('✅ TEST RÉUSSI: La pagination API fonctionne correctement');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testApiPagination();
