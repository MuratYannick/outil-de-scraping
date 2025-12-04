/**
 * Utilitaire de normalisation des adresses pour améliorer la détection des doublons
 *
 * Gère les différences courantes entre sources :
 * - Abréviations (Bd/Boulevard, Av/Avenue, etc.)
 * - Majuscules/minuscules
 * - Ponctuation
 * - Espaces multiples
 * - Compléments d'adresse (batiment, étage, etc.)
 */

// Dictionnaire d'abréviations courantes en français
const ABBREVIATIONS = {
  // Voies principales
  'boulevard': 'bd',
  'boul': 'bd',
  'bld': 'bd',
  'avenue': 'av',
  'rue': 'r',
  'place': 'pl',
  'cours': 'crs',
  'quai': 'q',
  'chemin': 'ch',
  'route': 'rte',
  'impasse': 'imp',
  'allee': 'all',
  'allée': 'all',
  'allees': 'all',
  'allées': 'all',
  'passage': 'pass',
  'square': 'sq',
  'voie': 'v',
  'montee': 'mte',
  'montée': 'mte',

  // Directions
  'nord': 'n',
  'sud': 's',
  'est': 'e',
  'ouest': 'o',

  // Bâtiments/lieux
  'batiment': 'bat',
  'bâtiment': 'bat',
  'residence': 'res',
  'résidence': 'res',
  'immeuble': 'imm',
  'appartement': 'apt',
  'escalier': 'esc',
  'etage': 'et',
  'étage': 'et',

  // Abréviations courantes
  'saint': 'st',
  'sainte': 'ste',
  'general': 'gal',
  'général': 'gal',
  'marechal': 'mal',
  'maréchal': 'mal',
  'capitaine': 'cap',
  'commandant': 'cdt',
  'colonel': 'col',
  'docteur': 'dr',
  'professeur': 'pr',
  'president': 'pres',
  'président': 'pres',
};

/**
 * Normalise une adresse pour la comparaison
 * @param {string} address - L'adresse à normaliser
 * @returns {string} - L'adresse normalisée
 */
export function normalizeAddress(address) {
  if (!address || typeof address !== 'string') {
    return '';
  }

  let normalized = address;

  // 1. Convertir en minuscules
  normalized = normalized.toLowerCase();

  // 2. Supprimer les accents
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 3. Supprimer la ponctuation (y compris les tirets)
  normalized = normalized.replace(/[,;:.!?()\-]/g, ' ');

  // 4. Remplacer les apostrophes et guillemets par des espaces
  normalized = normalized.replace(/['''"`]/g, ' ');

  // 5. Supprimer les compléments d'adresse courants
  // (batiment, residence, appartement, escalier, etage, etc.)
  const complementsPatterns = [
    /\b(batiment|bat|bâtiment)\s+[a-z0-9]+/gi,
    /\b(residence|res|résidence)\s+[a-z\s]+/gi,
    /\b(immeuble|imm)\s+[a-z\s]+/gi,
    /\b(appartement|appt|apt)\s+[0-9]+/gi,
    /\b(escalier|esc)\s+[a-z0-9]+/gi,
    /\b(etage|étage|et)\s+[0-9]+/gi,
    /\b(porte|pte)\s+[0-9]+/gi,
    /\b(les|le|la|l)\s+/gi, // Articles au début (ex: "Les Allées")
  ];

  complementsPatterns.forEach(pattern => {
    normalized = normalized.replace(pattern, ' ');
  });

  // 6. Remplacer les mots par leurs abréviations
  Object.keys(ABBREVIATIONS).forEach(word => {
    const abbr = ABBREVIATIONS[word];
    // Remplacer le mot entier (avec word boundary)
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, abbr);
  });

  // 7. Supprimer les espaces multiples et trim
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // 8. Supprimer les mots de 1-2 lettres qui ne sont pas des numéros
  // (sauf les abréviations de voies)
  const keepShortWords = ['bd', 'av', 'r', 'pl', 'q', 'ch', 'st', 'dr', 'n', 's', 'e', 'o'];
  normalized = normalized.split(' ')
    .filter(word => {
      // Garder les nombres
      if (/^\d+$/.test(word)) return true;
      // Garder les mots de 3+ lettres
      if (word.length >= 3) return true;
      // Garder les abréviations courantes
      if (keepShortWords.includes(word)) return true;
      return false;
    })
    .join(' ');

  return normalized;
}

/**
 * Compare deux adresses en tenant compte des variations
 * @param {string} address1 - Première adresse
 * @param {string} address2 - Deuxième adresse
 * @returns {boolean} - true si les adresses sont considérées comme identiques
 */
export function addressesMatch(address1, address2) {
  if (!address1 || !address2) return false;

  const norm1 = normalizeAddress(address1);
  const norm2 = normalizeAddress(address2);

  // Comparaison exacte après normalisation
  if (norm1 === norm2) return true;

  // Si une adresse est contenue dans l'autre (cas des compléments)
  // Exemple: "2 rue felix faure" vs "les allees 2 rue felix faure"
  if (norm1.length > 5 && norm2.length > 5) {
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return true;
    }
  }

  // Calcul de similarité par mots communs (au moins 70% de mots en commun)
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));

  const commonWords = [...words1].filter(word => words2.has(word));
  const similarity = commonWords.length / Math.max(words1.size, words2.size);

  // Si au moins 70% des mots sont identiques, considérer comme match
  return similarity >= 0.7;
}

/**
 * Teste la fonction de normalisation avec des exemples
 * Usage: node -e "import('./src/utils/addressNormalizer.js').then(m => m.testNormalization())"
 */
export function testNormalization() {
  console.log('🧪 Tests de normalisation d\'adresses\n');

  const testCases = [
    {
      address1: '84 Boulevard Picaud',
      address2: '84 bd Picaud',
      expected: true,
    },
    {
      address1: '2 rue Felix Faure',
      address2: 'Les Allées 2 rue Felix Faure',
      expected: true,
    },
    {
      address1: '15 Avenue des Champs Elysées',
      address2: '15 av des Champs Elysées',
      expected: true,
    },
    {
      address1: '123 Rue de la Paix, Batiment A',
      address2: '123 r de la Paix',
      expected: true,
    },
    {
      address1: '10 Place Saint-Michel',
      address2: '10 pl St Michel',
      expected: true,
    },
    {
      address1: '5 Cours Gambetta',
      address2: '5 crs Gambetta',
      expected: true,
    },
    {
      address1: '42 Rue Victor Hugo',
      address2: '99 Avenue de la République', // Adresses différentes
      expected: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ address1, address2, expected }, index) => {
    const result = addressesMatch(address1, address2);
    const status = result === expected ? '✅' : '❌';

    if (result === expected) {
      passed++;
    } else {
      failed++;
    }

    console.log(`${status} Test ${index + 1}:`);
    console.log(`   Address 1: "${address1}"`);
    console.log(`   Normalized: "${normalizeAddress(address1)}"`);
    console.log(`   Address 2: "${address2}"`);
    console.log(`   Normalized: "${normalizeAddress(address2)}"`);
    console.log(`   Match: ${result} (Expected: ${expected})\n`);
  });

  console.log(`\n📊 Résultats: ${passed}/${testCases.length} tests passés, ${failed} échecs`);

  if (failed === 0) {
    console.log('✅ Tous les tests sont passés ! 🎉');
  } else {
    console.log(`⚠️  ${failed} test(s) ont échoué`);
  }

  return { passed, failed, total: testCases.length };
}
