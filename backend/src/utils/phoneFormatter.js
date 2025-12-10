/**
 * Utilitaire de formatage des numéros de téléphone français
 * @module phoneFormatter
 */

/**
 * Formate un numéro de téléphone français dans un format standardisé
 *
 * Formats supportés en entrée :
 * - 01 23 45 67 89 (format standard français)
 * - 0123456789 (sans espaces)
 * - +33 1 23 45 67 89 (format international)
 * - +33123456789 (international sans espaces)
 * - 33123456789 (international sans +)
 * - 06.12.34.56.78 (avec points)
 *
 * @param {string|null} phone - Numéro de téléphone à formater
 * @param {Object} options - Options de formatage
 * @param {string} options.format - Format de sortie: 'spaced' (par défaut), 'compact', 'international'
 * @returns {string|null} Numéro formaté ou null si invalide
 *
 * @example
 * formatPhoneNumber('0123456789') // '01 23 45 67 89'
 * formatPhoneNumber('33123456789') // '01 23 45 67 89'
 * formatPhoneNumber('+33123456789', { format: 'international' }) // '+33 1 23 45 67 89'
 * formatPhoneNumber('0123456789', { format: 'compact' }) // '0123456789'
 */
export function formatPhoneNumber(phone, options = {}) {
  if (!phone) return null;

  const { format = 'spaced' } = options;

  // Nettoyer: garder uniquement chiffres et +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Normaliser format international vers format français
  if (cleaned.startsWith('33') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  if (cleaned.startsWith('+33') && cleaned.length === 12) {
    // Convertir +33123456789 vers 0123456789
    cleaned = '0' + cleaned.substring(3);
  }

  // Vérifier validité: doit être 10 chiffres commençant par 0
  if (!cleaned.startsWith('0') || cleaned.length !== 10) {
    // Si invalide, retourner le numéro nettoyé ou null
    return cleaned || null;
  }

  // Appliquer le format demandé
  switch (format) {
    case 'compact':
      return cleaned; // 0123456789

    case 'international':
      // +33 1 23 45 67 89
      const withoutZero = cleaned.substring(1); // Enlever le 0
      return `+33 ${withoutZero.substring(0, 1)} ${withoutZero.substring(1, 3)} ${withoutZero.substring(3, 5)} ${withoutZero.substring(5, 7)} ${withoutZero.substring(7)}`;

    case 'spaced':
    default:
      // 01 23 45 67 89 (format par défaut)
      return cleaned.match(/.{1,2}/g).join(' ');
  }
}

/**
 * Valide qu'un numéro de téléphone est au format français valide
 *
 * @param {string} phone - Numéro de téléphone à valider
 * @returns {boolean} true si le numéro est valide
 *
 * @example
 * isValidFrenchPhone('01 23 45 67 89') // true
 * isValidFrenchPhone('0123456789') // true
 * isValidFrenchPhone('+33123456789') // true
 * isValidFrenchPhone('123') // false
 */
export function isValidFrenchPhone(phone) {
  if (!phone) return false;

  // Nettoyer et normaliser
  const formatted = formatPhoneNumber(phone, { format: 'compact' });

  if (!formatted || formatted.length !== 10) return false;

  // Vérifier que ça commence par 0 suivi d'un chiffre 1-9
  return /^0[1-9]\d{8}$/.test(formatted);
}

/**
 * Extrait tous les numéros de téléphone valides d'un texte
 *
 * @param {string} text - Texte contenant potentiellement des numéros
 * @returns {string[]} Liste des numéros de téléphone trouvés (formatés)
 *
 * @example
 * extractPhoneNumbers('Appelez-nous au 01 23 45 67 89 ou 06.12.34.56.78')
 * // ['01 23 45 67 89', '06 12 34 56 78']
 */
export function extractPhoneNumbers(text) {
  if (!text) return [];

  // Patterns pour détecter les numéros de téléphone français
  const patterns = [
    // Format standard: 01 23 45 67 89 ou 01.23.45.67.89
    /\b0[1-9](?:[\s\.]?\d{2}){4}\b/g,
    // Format international: +33 1 23 45 67 89
    /\+33[\s\.]?[1-9](?:[\s\.]?\d{2}){4}\b/g,
    // Format alternatif: 0033 1 23 45 67 89
    /\b0033[\s\.]?[1-9](?:[\s\.]?\d{2}){4}\b/g,
  ];

  const found = new Set();

  patterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      const formatted = formatPhoneNumber(match);
      if (formatted && isValidFrenchPhone(formatted)) {
        found.add(formatted);
      }
    });
  });

  return Array.from(found);
}

/**
 * Normalise un numéro de téléphone pour comparaison (format compact sans espaces)
 * Utile pour détecter les doublons
 *
 * @param {string} phone - Numéro de téléphone
 * @returns {string|null} Numéro normalisé ou null
 *
 * @example
 * normalizeForComparison('01 23 45 67 89') // '0123456789'
 * normalizeForComparison('+33 1 23 45 67 89') // '0123456789'
 */
export function normalizeForComparison(phone) {
  return formatPhoneNumber(phone, { format: 'compact' });
}
