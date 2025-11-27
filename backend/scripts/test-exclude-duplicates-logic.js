/**
 * Script de test unitaire pour la logique excludeDuplicates
 * Test sans scraping réel, juste la logique de filtrage
 */

console.log('🧪 Test de la logique excludeDuplicates\n');
console.log('═'.repeat(80));

// Simuler la logique du scraper
function simulateScraping(allResults, existingInDB, maxResults, excludeDuplicates) {
  const allProspects = [];
  const newProspects = [];
  let duplicatesCount = 0;

  console.log(`\n📊 Configuration:`);
  console.log(`   - Total de résultats scrapés: ${allResults.length}`);
  console.log(`   - Prospects déjà en DB: ${existingInDB.length}`);
  console.log(`   - Max résultats demandés: ${maxResults}`);
  console.log(`   - excludeDuplicates: ${excludeDuplicates}`);

  console.log(`\n🔍 Traitement des résultats...\n`);

  for (let i = 0; i < allResults.length; i++) {
    const prospect = allResults[i];

    if (excludeDuplicates) {
      // Vérifier si c'est un doublon
      const isdup = existingInDB.some(existing => existing.nom === prospect.nom);

      if (isdup) {
        duplicatesCount++;
        console.log(`   ${i + 1}. ⏭️  Doublon ignoré: ${prospect.nom}`);
      } else {
        newProspects.push(prospect);
        allProspects.push(prospect);
        console.log(`   ${i + 1}. ✅ Nouveau prospect: ${prospect.nom}`);
      }
    } else {
      allProspects.push(prospect);
      console.log(`   ${i + 1}. ➕ Prospect ajouté: ${prospect.nom}`);
    }

    // Vérifier si on a atteint le maximum
    const targetCount = excludeDuplicates ? newProspects.length : allProspects.length;

    if (targetCount >= maxResults) {
      console.log(`\n   🛑 Limite de ${maxResults} ${excludeDuplicates ? 'nouveaux ' : ''}résultats atteinte`);
      console.log(`   📄 Total parcouru: ${i + 1}/${allResults.length} résultats`);
      break;
    }
  }

  const finalProspects = excludeDuplicates
    ? newProspects.slice(0, maxResults)
    : allProspects.slice(0, maxResults);

  return {
    success: true,
    prospects: finalProspects,
    total: finalProspects.length,
    duplicates_skipped: excludeDuplicates ? duplicatesCount : 0,
    total_scraped: excludeDuplicates ? (allProspects.length + duplicatesCount) : finalProspects.length,
  };
}

// ========== TEST 1: Sans excludeDuplicates ==========
console.log('\n' + '═'.repeat(80));
console.log('TEST 1: Mode normal (excludeDuplicates = false)');
console.log('═'.repeat(80));

const allResults1 = [
  { nom: 'Entreprise A' },
  { nom: 'Entreprise B' },
  { nom: 'Entreprise C' },
  { nom: 'Entreprise D' },
  { nom: 'Entreprise E' },
  { nom: 'Entreprise F' },
  { nom: 'Entreprise G' },
  { nom: 'Entreprise H' },
  { nom: 'Entreprise I' },
  { nom: 'Entreprise J' },
];

const existingInDB1 = [
  { nom: 'Entreprise A' },
  { nom: 'Entreprise C' },
  { nom: 'Entreprise E' },
];

const result1 = simulateScraping(allResults1, existingInDB1, 5, false);

console.log(`\n📊 RÉSULTAT:`);
console.log(`   - Prospects retournés: ${result1.total}`);
console.log(`   - Doublons ignorés: ${result1.duplicates_skipped}`);
console.log(`   - Total scrapé: ${result1.total_scraped}`);

console.log(`\n✅ ATTENDU: 5 prospects retournés (peu importe s'il y a des doublons)`);
console.log(`   ✓ Test ${result1.total === 5 ? 'RÉUSSI' : 'ÉCHOUÉ'}`);

// ========== TEST 2: Avec excludeDuplicates ==========
console.log('\n' + '═'.repeat(80));
console.log('TEST 2: Mode excludeDuplicates (excludeDuplicates = true)');
console.log('═'.repeat(80));

const allResults2 = [
  { nom: 'Entreprise A' }, // Doublon (déjà en DB)
  { nom: 'Entreprise B' }, // Nouveau
  { nom: 'Entreprise C' }, // Doublon
  { nom: 'Entreprise D' }, // Nouveau
  { nom: 'Entreprise E' }, // Doublon
  { nom: 'Entreprise F' }, // Nouveau
  { nom: 'Entreprise G' }, // Nouveau
  { nom: 'Entreprise H' }, // Nouveau
  { nom: 'Entreprise I' }, // Nouveau (stop ici car on a 5 nouveaux)
  { nom: 'Entreprise J' }, // Ne sera pas traité
];

const existingInDB2 = [
  { nom: 'Entreprise A' },
  { nom: 'Entreprise C' },
  { nom: 'Entreprise E' },
];

const result2 = simulateScraping(allResults2, existingInDB2, 5, true);

console.log(`\n📊 RÉSULTAT:`);
console.log(`   - Prospects retournés: ${result2.total}`);
console.log(`   - Doublons ignorés: ${result2.duplicates_skipped}`);
console.log(`   - Total scrapé: ${result2.total_scraped}`);

console.log(`\n✅ ATTENDU:`);
console.log(`   - 5 NOUVEAUX prospects (B, D, F, G, H)`);
console.log(`   - 3 doublons ignorés (A, C, E)`);
console.log(`   - Total scrapé: 8 (5 nouveaux + 3 doublons)`);

const test2Pass = result2.total === 5 &&
                   result2.duplicates_skipped === 3 &&
                   result2.total_scraped === 8;

console.log(`   ✓ Test ${test2Pass ? 'RÉUSSI ✅' : 'ÉCHOUÉ ❌'}`);

// ========== TEST 3: Tous des doublons ==========
console.log('\n' + '═'.repeat(80));
console.log('TEST 3: Tous des doublons (excludeDuplicates = true)');
console.log('═'.repeat(80));

const allResults3 = [
  { nom: 'Entreprise A' },
  { nom: 'Entreprise C' },
  { nom: 'Entreprise E' },
  { nom: 'Entreprise A' },
  { nom: 'Entreprise C' },
];

const existingInDB3 = [
  { nom: 'Entreprise A' },
  { nom: 'Entreprise C' },
  { nom: 'Entreprise E' },
];

const result3 = simulateScraping(allResults3, existingInDB3, 5, true);

console.log(`\n📊 RÉSULTAT:`);
console.log(`   - Prospects retournés: ${result3.total}`);
console.log(`   - Doublons ignorés: ${result3.duplicates_skipped}`);
console.log(`   - Total scrapé: ${result3.total_scraped}`);

console.log(`\n✅ ATTENDU:`);
console.log(`   - 0 nouveaux prospects`);
console.log(`   - 5 doublons ignorés`);
console.log(`   - Total scrapé: 5`);

const test3Pass = result3.total === 0 &&
                   result3.duplicates_skipped === 5 &&
                   result3.total_scraped === 5;

console.log(`   ✓ Test ${test3Pass ? 'RÉUSSI ✅' : 'ÉCHOUÉ ❌'}`);

// ========== RÉSUMÉ FINAL ==========
console.log('\n' + '═'.repeat(80));
console.log('📊 RÉSUMÉ DES TESTS');
console.log('═'.repeat(80));

if (result1.total === 5 && test2Pass && test3Pass) {
  console.log('\n✅ TOUS LES TESTS RÉUSSIS! La logique excludeDuplicates fonctionne correctement.\n');
  process.exit(0);
} else {
  console.log('\n❌ CERTAINS TESTS ONT ÉCHOUÉ. Vérifier la logique.\n');
  process.exit(1);
}
