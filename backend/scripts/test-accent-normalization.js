/**
 * Script de test pour la normalisation des accents
 * Valide que les mots-clés avec accents sont correctement normalisés
 */

import { normalizeKeyword, normalizeLocation, removeAccents } from '../src/utils/stringUtils.js';

console.log('🧪 Test de normalisation des accents\n');

// Test de la fonction removeAccents
console.log('1️⃣ Test removeAccents():');
const testCases = [
  { input: 'électricien', expected: 'electricien' },
  { input: 'café', expected: 'cafe' },
  { input: 'Hôtel', expected: 'Hotel' },
  { input: 'Évry', expected: 'Evry' },
  { input: 'Saint-Étienne', expected: 'Saint-Etienne' },
  { input: 'Crèche', expected: 'Creche' },
  { input: 'Boulangerie', expected: 'Boulangerie' }, // Pas d'accents
  { input: 'Paris', expected: 'Paris' }, // Pas d'accents
  { input: 'élève à l\'école', expected: 'eleve a l\'ecole' },
  { input: 'Ça marche', expected: 'Ca marche' },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }) => {
  const result = removeAccents(input);
  const success = result === expected;
  console.log(`  ${success ? '✅' : '❌'} "${input}" → "${result}" ${success ? '' : `(attendu: "${expected}")`}`);
  if (success) passed++;
  else failed++;
});

console.log(`\n📊 Résultats removeAccents: ${passed}/${testCases.length} tests passés\n`);

// Test de la fonction normalizeKeyword
console.log('2️⃣ Test normalizeKeyword():');
const keywordTests = [
  { input: '  électricien  ', expected: 'electricien' },
  { input: 'Café', expected: 'Cafe' },
  { input: ' Hôtel ', expected: 'Hotel' },
  { input: 'plombier', expected: 'plombier' },
];

let keywordPassed = 0;
keywordTests.forEach(({ input, expected }) => {
  const result = normalizeKeyword(input);
  const success = result === expected;
  console.log(`  ${success ? '✅' : '❌'} "${input}" → "${result}" ${success ? '' : `(attendu: "${expected}")`}`);
  if (success) keywordPassed++;
});

console.log(`\n📊 Résultats normalizeKeyword: ${keywordPassed}/${keywordTests.length} tests passés\n`);

// Test de la fonction normalizeLocation
console.log('3️⃣ Test normalizeLocation():');
const locationTests = [
  { input: 'Évry', expected: 'Evry' },
  { input: 'Saint-Étienne', expected: 'Saint-Etienne' },
  { input: '  Paris  ', expected: 'Paris' },
  { input: 'Créteil', expected: 'Creteil' },
];

let locationPassed = 0;
locationTests.forEach(({ input, expected }) => {
  const result = normalizeLocation(input);
  const success = result === expected;
  console.log(`  ${success ? '✅' : '❌'} "${input}" → "${result}" ${success ? '' : `(attendu: "${expected}")`}`);
  if (success) locationPassed++;
});

console.log(`\n📊 Résultats normalizeLocation: ${locationPassed}/${locationTests.length} tests passés\n`);

// Résultat global
const totalPassed = passed + keywordPassed + locationPassed;
const totalTests = testCases.length + keywordTests.length + locationTests.length;

console.log('═'.repeat(60));
console.log(`📊 RÉSULTAT GLOBAL: ${totalPassed}/${totalTests} tests passés (${Math.round(totalPassed/totalTests*100)}%)`);
console.log('═'.repeat(60));

if (totalPassed === totalTests) {
  console.log('\n✅ TEST RÉUSSI: Toutes les fonctions de normalisation fonctionnent correctement !');
  process.exit(0);
} else {
  console.log(`\n❌ TEST ÉCHOUÉ: ${totalTests - totalPassed} test(s) échoué(s)`);
  process.exit(1);
}
