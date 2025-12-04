/**
 * Script de test pour la normalisation d'adresses
 * Vérifie que les adresses avec variations sont bien détectées comme doublons
 */

import { normalizeAddress, addressesMatch } from '../src/utils/addressNormalizer.js';

console.log('🧪 Tests de normalisation d\'adresses pour la détection de doublons\n');
console.log('='.repeat(80) + '\n');

// Test cases basés sur les exemples fournis par l'utilisateur
const testCases = [
  {
    title: 'Cas 1: Boulevard vs bd (exemple utilisateur)',
    address1: '84 boulevard Picaud',
    address2: '84 bd Picaud',
    shouldMatch: true,
  },
  {
    title: 'Cas 2: Avec complément vs sans complément (exemple utilisateur)',
    address1: '2 rue felix faure',
    address2: 'les allées 2 rue felix faure',
    shouldMatch: true,
  },
  {
    title: 'Cas 3: Avenue complète vs abrégée',
    address1: '15 Avenue des Champs Elysées',
    address2: '15 av des Champs Elysées',
    shouldMatch: true,
  },
  {
    title: 'Cas 4: Rue complète vs r',
    address1: '123 Rue de la Paix',
    address2: '123 r de la Paix',
    shouldMatch: true,
  },
  {
    title: 'Cas 5: Avec Batiment vs sans',
    address1: '10 Place Saint-Michel, Batiment A',
    address2: '10 pl St Michel',
    shouldMatch: true,
  },
  {
    title: 'Cas 6: Cours vs crs',
    address1: '5 Cours Gambetta',
    address2: '5 crs Gambetta',
    shouldMatch: true,
  },
  {
    title: 'Cas 7: Avec accents vs sans accents',
    address1: '12 Allée du Général Leclerc',
    address2: '12 allee du general leclerc',
    shouldMatch: true,
  },
  {
    title: 'Cas 8: Majuscules vs minuscules',
    address1: '8 RUE VICTOR HUGO',
    address2: '8 rue victor hugo',
    shouldMatch: true,
  },
  {
    title: 'Cas 9: Avec residence vs sans',
    address1: '42 Boulevard Jean Jaurès, Résidence Les Lilas',
    address2: '42 bd Jean Jaures',
    shouldMatch: true,
  },
  {
    title: 'Cas 10: Montée vs mte',
    address1: '7 Montée des Carmes',
    address2: '7 mte des Carmes',
    shouldMatch: true,
  },
  {
    title: 'Cas 11: Adresses totalement différentes (ne doivent PAS matcher)',
    address1: '42 Rue Victor Hugo',
    address2: '99 Avenue de la République',
    shouldMatch: false,
  },
  {
    title: 'Cas 12: Même rue mais numéros différents (ne doivent PAS matcher)',
    address1: '10 Rue de la Paix',
    address2: '20 Rue de la Paix',
    shouldMatch: false,
  },
];

let passed = 0;
let failed = 0;
const failures = [];

console.log('📊 TESTS DE NORMALISATION D\'ADRESSES\n');

testCases.forEach(({ title, address1, address2, shouldMatch }, index) => {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`Test ${index + 1}: ${title}`);
  console.log(`${'─'.repeat(80)}`);

  console.log(`\n📍 Adresse 1: "${address1}"`);
  const norm1 = normalizeAddress(address1);
  console.log(`   Normalisée: "${norm1}"`);

  console.log(`\n📍 Adresse 2: "${address2}"`);
  const norm2 = normalizeAddress(address2);
  console.log(`   Normalisée: "${norm2}"`);

  const result = addressesMatch(address1, address2);
  const expected = shouldMatch;
  const success = result === expected;

  console.log(`\n🔍 Résultat:`);
  console.log(`   Match détecté: ${result ? 'OUI ✓' : 'NON ✗'}`);
  console.log(`   Attendu: ${expected ? 'OUI' : 'NON'}`);
  console.log(`   Statut: ${success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);

  if (success) {
    passed++;
  } else {
    failed++;
    failures.push({
      test: index + 1,
      title,
      address1,
      address2,
      expected,
      result,
    });
  }
});

// Résumé final
console.log('\n' + '='.repeat(80));
console.log('\n📊 RÉSUMÉ DES TESTS\n');
console.log(`Total de tests: ${testCases.length}`);
console.log(`✅ Réussis: ${passed}`);
console.log(`❌ Échoués: ${failed}`);
console.log(`📈 Taux de réussite: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
  console.log('✅ La normalisation d\'adresses fonctionne correctement.');
  console.log('✅ Les doublons avec variations d\'adresses seront bien détectés.\n');
} else {
  console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ:\n');
  failures.forEach(({ test, title, address1, address2, expected, result }) => {
    console.log(`❌ Test ${test}: ${title}`);
    console.log(`   Adresse 1: "${address1}"`);
    console.log(`   Adresse 2: "${address2}"`);
    console.log(`   Attendu: ${expected ? 'MATCH' : 'NO MATCH'}`);
    console.log(`   Obtenu: ${result ? 'MATCH' : 'NO MATCH'}\n`);
  });
}

console.log('='.repeat(80) + '\n');

// Tests spécifiques de normalisation
console.log('🔬 TESTS DÉTAILLÉS DE NORMALISATION\n');
console.log('='.repeat(80) + '\n');

const normalizationExamples = [
  '84 Boulevard Picaud',
  '84 bd Picaud',
  'Les Allées 2 rue Felix Faure',
  '2 rue felix faure',
  '15 Avenue des Champs Elysées',
  '123 Rue de la Paix, Batiment A, Appartement 5',
];

normalizationExamples.forEach((address, index) => {
  console.log(`Exemple ${index + 1}:`);
  console.log(`   Original:    "${address}"`);
  console.log(`   Normalisée:  "${normalizeAddress(address)}"\n`);
});

console.log('='.repeat(80) + '\n');

// Exit avec le code approprié
process.exit(failed === 0 ? 0 : 1);
