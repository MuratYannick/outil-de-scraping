/**
 * Script de test unitaire pour la logique de détection de doublons
 * Teste les nouveaux critères stricts (code postal + adresse+nom OU nom+contact)
 */

import { addressesMatch } from '../src/utils/addressNormalizer.js';

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcule la similarité entre deux chaînes (copie de la fonction du script)
 */
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  // Normaliser les chaînes : minuscules, sans accents, sans apostrophes/tirets
  const normalize = (s) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const s1 = normalize(str1);
  const s2 = normalize(str2);

  if (s1 === s2) return 1;

  // Vérifier si les mots sont les mêmes (ordre différent acceptable)
  const words1 = s1.split(' ').filter(w => w.length > 2).sort();
  const words2 = s2.split(' ').filter(w => w.length > 2).sort();
  const wordsStr1 = words1.join(' ');
  const wordsStr2 = words2.join(' ');

  if (wordsStr1 === wordsStr2) {
    return 0.95;
  }

  // Comparer l'intersection des mots significatifs
  const commonWords = words1.filter(w => words2.includes(w));
  const wordSimilarity = (2 * commonWords.length) / (words1.length + words2.length);

  if (wordSimilarity >= 0.65) {
    return 0.9;
  }

  // Vérifier si l'un contient l'autre
  if (s1.includes(s2)) {
    const ratio = s2.length / s1.length;
    return ratio >= 0.3 ? 0.9 : ratio;
  }
  if (s2.includes(s1)) {
    const ratio = s1.length / s2.length;
    return ratio >= 0.3 ? 0.9 : ratio;
  }

  // Calculer la distance de Levenshtein
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - distance / maxLength;
}

/**
 * Vérifie si deux prospects sont des doublons (copie de la nouvelle fonction)
 */
function areDuplicates(p1, p2) {
  if (p1.id === p2.id) {
    return { isDuplicate: false, reason: 'Même prospect' };
  }

  // Critère 1 OBLIGATOIRE : Même code postal
  if (!p1.code_postal || !p2.code_postal || p1.code_postal !== p2.code_postal) {
    return { isDuplicate: false, reason: 'Codes postaux différents ou manquants' };
  }

  // Calculer la similarité des noms
  let nameSimilarity = 0;
  if (p1.nom_entreprise && p2.nom_entreprise) {
    nameSimilarity = stringSimilarity(p1.nom_entreprise, p2.nom_entreprise);
  }

  // CHEMIN A : Les deux ont une adresse
  if (p1.adresse && p2.adresse) {
    const addressMatch = addressesMatch(p1.adresse, p2.adresse);

    if (addressMatch && nameSimilarity >= 0.85) {
      return {
        isDuplicate: true,
        reason: `Même code postal + adresses similaires + noms similaires (${(nameSimilarity * 100).toFixed(1)}%)`,
        similarity: nameSimilarity
      };
    }

    return { isDuplicate: false, reason: 'Adresse ou nom insuffisamment similaire' };
  }

  // CHEMIN B : Pas d'adresse
  if (nameSimilarity >= 0.85) {
    // Vérifier le téléphone
    if (p1.telephone && p2.telephone) {
      const phone1 = p1.telephone.replace(/\s+/g, '');
      const phone2 = p2.telephone.replace(/\s+/g, '');
      if (phone1 === phone2) {
        return {
          isDuplicate: true,
          reason: `Même code postal + noms similaires (${(nameSimilarity * 100).toFixed(1)}%) + même téléphone`,
          similarity: nameSimilarity
        };
      }
    }

    // Vérifier l'email
    if (p1.email && p2.email && p1.email === p2.email) {
      return {
        isDuplicate: true,
        reason: `Même code postal + noms similaires (${(nameSimilarity * 100).toFixed(1)}%) + même email`,
        similarity: nameSimilarity
      };
    }

    // Vérifier l'URL site
    if (p1.url_site && p2.url_site && p1.url_site === p2.url_site) {
      return {
        isDuplicate: true,
        reason: `Même code postal + noms similaires (${(nameSimilarity * 100).toFixed(1)}%) + même URL site`,
        similarity: nameSimilarity
      };
    }

    return { isDuplicate: false, reason: 'Noms similaires mais aucun contact correspondant' };
  }

  return { isDuplicate: false, reason: 'Pas de similarité suffisante' };
}

/**
 * Tests
 */
console.log('🧪 Tests de la logique de détection de doublons\n');
console.log('='.repeat(80) + '\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, p1, p2, expectedDuplicate, description) {
  totalTests++;
  console.log(`Test ${totalTests}: ${name}`);
  console.log(`Description: ${description}`);

  const result = areDuplicates(p1, p2);
  const success = result.isDuplicate === expectedDuplicate;

  if (success) {
    passedTests++;
    console.log(`✅ RÉUSSI - ${result.reason}`);
  } else {
    console.log(`❌ ÉCHOUÉ`);
    console.log(`   Attendu: ${expectedDuplicate ? 'Doublon' : 'Pas doublon'}`);
    console.log(`   Obtenu: ${result.isDuplicate ? 'Doublon' : 'Pas doublon'}`);
    console.log(`   Raison: ${result.reason}`);
  }
  console.log();
}

// ============================================================================
// TEST 1 : Cas de référence L'Entr Potes (DOIT ÊTRE DÉTECTÉ)
// ============================================================================
runTest(
  "L'Entr Potes (cas de référence)",
  {
    id: 1,
    nom_entreprise: "L'Entr Potes",
    adresse: "9 rue Nicéphore Niepce",
    code_postal: "83400",
    telephone: "04 94 91 63 01"
  },
  {
    id: 2,
    nom_entreprise: "L'ENTR'potes - Restaurant - Hyères",
    adresse: "9 Rue Nicéphore Niépce, Chem. du Palyvestre ZA du",
    code_postal: "83400",
    telephone: null
  },
  true,
  "Même code postal + adresse similaire + nom similaire (90%)"
);

// ============================================================================
// TEST 2 : Différentes entreprises dans le même immeuble (NE DOIT PAS ÊTRE DÉTECTÉ)
// ============================================================================
runTest(
  "Différentes entreprises, même immeuble",
  {
    id: 3,
    nom_entreprise: "Avocat Dupont",
    adresse: "15 rue Victor Hugo",
    code_postal: "83400"
  },
  {
    id: 4,
    nom_entreprise: "Cabinet Médical Martin",
    adresse: "15 rue Victor Hugo",
    code_postal: "83400"
  },
  false,
  "Même adresse mais noms très différents (< 85%)"
);

// ============================================================================
// TEST 3 : Plusieurs agences de la même entreprise (NE DOIT PAS ÊTRE DÉTECTÉ)
// ============================================================================
runTest(
  "Plusieurs agences, même entreprise",
  {
    id: 5,
    nom_entreprise: "La Poste",
    adresse: "10 avenue de la République",
    code_postal: "83400",
    telephone: "01 23 45 67 89"
  },
  {
    id: 6,
    nom_entreprise: "La Poste",
    adresse: "25 boulevard Gambetta",
    code_postal: "83400",
    telephone: "01 98 76 54 32"
  },
  false,
  "Même nom mais adresses différentes (< 70%)"
);

// ============================================================================
// TEST 4 : Sans adresse mais même téléphone (DOIT ÊTRE DÉTECTÉ)
// ============================================================================
runTest(
  "Sans adresse, même téléphone",
  {
    id: 7,
    nom_entreprise: "Restaurant Le Bon Coin",
    code_postal: "83400",
    telephone: "04 94 11 11 11"
  },
  {
    id: 8,
    nom_entreprise: "Le Bon Coin Restaurant",
    code_postal: "83400",
    telephone: "04 94 11 11 11"
  },
  true,
  "Même code postal + noms similaires (> 85%) + même téléphone"
);

// ============================================================================
// TEST 5 : Sans adresse, noms similaires mais contacts différents (NE DOIT PAS ÊTRE DÉTECTÉ)
// ============================================================================
runTest(
  "Sans adresse, contacts différents",
  {
    id: 9,
    nom_entreprise: "Restaurant Le Jardin",
    code_postal: "83400",
    telephone: "04 94 11 11 11"
  },
  {
    id: 10,
    nom_entreprise: "Restaurant Le Jardin Fleuri",
    code_postal: "83400",
    telephone: "04 94 22 22 22"
  },
  false,
  "Noms similaires mais pas d'adresse et contacts différents"
);

// ============================================================================
// TEST 6 : Codes postaux différents (NE DOIT PAS ÊTRE DÉTECTÉ)
// ============================================================================
runTest(
  "Codes postaux différents",
  {
    id: 11,
    nom_entreprise: "Boulangerie Durand",
    adresse: "5 rue de la Gare",
    code_postal: "83400",
    telephone: "04 94 11 11 11"
  },
  {
    id: 12,
    nom_entreprise: "Boulangerie Durand",
    adresse: "5 rue de la Gare",
    code_postal: "83000", // Différent !
    telephone: "04 94 11 11 11"
  },
  false,
  "Tout identique sauf le code postal"
);

// ============================================================================
// TEST 7 : Code postal manquant (NE DOIT PAS ÊTRE DÉTECTÉ)
// ============================================================================
runTest(
  "Code postal manquant",
  {
    id: 13,
    nom_entreprise: "Entreprise XYZ",
    adresse: "10 rue du Commerce",
    code_postal: null // Manquant !
  },
  {
    id: 14,
    nom_entreprise: "Entreprise XYZ",
    adresse: "10 rue du Commerce",
    code_postal: "83400"
  },
  false,
  "Code postal manquant sur un des prospects"
);

// ============================================================================
// TEST 8 : Sans adresse mais même email (DOIT ÊTRE DÉTECTÉ)
// ============================================================================
runTest(
  "Sans adresse, même email",
  {
    id: 15,
    nom_entreprise: "Coiffeur Styl'Hair",
    code_postal: "83400",
    email: "contact@stylhair.fr"
  },
  {
    id: 16,
    nom_entreprise: "Styl Hair Coiffure",
    code_postal: "83400",
    email: "contact@stylhair.fr"
  },
  true,
  "Même code postal + noms similaires (> 85%) + même email"
);

// ============================================================================
// TEST 9 : Sans adresse mais même URL site (DOIT ÊTRE DÉTECTÉ)
// ============================================================================
runTest(
  "Sans adresse, même URL",
  {
    id: 17,
    nom_entreprise: "Garage Auto Plus",
    code_postal: "83400",
    url_site: "https://www.autoplus-hyeres.fr"
  },
  {
    id: 18,
    nom_entreprise: "Auto Plus Garage",
    code_postal: "83400",
    url_site: "https://www.autoplus-hyeres.fr"
  },
  true,
  "Même code postal + noms similaires (> 85%) + même URL site"
);

// ============================================================================
// TEST 10 : Adresse similaire mais nom trop différent (NE DOIT PAS ÊTRE DÉTECTÉ)
// ============================================================================
runTest(
  "Adresse similaire, nom différent",
  {
    id: 19,
    nom_entreprise: "Pharmacie Centrale",
    adresse: "20 bd Picaud",
    code_postal: "83400"
  },
  {
    id: 20,
    nom_entreprise: "Librairie du Boulevard",
    adresse: "20 boulevard Picaud",
    code_postal: "83400"
  },
  false,
  "Adresse similaire mais noms très différents (< 85%)"
);

// ============================================================================
// RÉSUMÉ
// ============================================================================
console.log('='.repeat(80));
console.log(`\n📊 RÉSUMÉ DES TESTS\n`);
console.log(`Total: ${totalTests}`);
console.log(`✅ Réussis: ${passedTests}`);
console.log(`❌ Échoués: ${totalTests - passedTests}`);
console.log(`📈 Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (passedTests === totalTests) {
  console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
  console.log('✅ La logique de détection de doublons est correcte.');
  process.exit(0);
} else {
  console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
  console.log('❌ La logique de détection nécessite des ajustements.');
  process.exit(1);
}
