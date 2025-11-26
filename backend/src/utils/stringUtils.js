/**
 * Utilitaires de manipulation de chaînes de caractères
 */

/**
 * Retire tous les accents d'une chaîne de caractères
 * @param {string} str - Chaîne avec accents
 * @returns {string} Chaîne sans accents
 *
 * @example
 * removeAccents('électricien') // => 'electricien'
 * removeAccents('café') // => 'cafe'
 * removeAccents('Hôtel') // => 'Hotel'
 */
export function removeAccents(str) {
  if (!str) return str;

  return str
    .normalize('NFD') // Décompose les caractères accentués (é -> e + ´)
    .replace(/[\u0300-\u036f]/g, ''); // Supprime les accents (marques diacritiques)
}

/**
 * Normalise un mot-clé de recherche pour le scraping
 * - Retire les accents
 * - Trim les espaces
 * - Convertit en minuscules (optionnel)
 *
 * @param {string} keyword - Mot-clé brut
 * @param {boolean} lowercase - Convertir en minuscules (défaut: false)
 * @returns {string} Mot-clé normalisé
 *
 * @example
 * normalizeKeyword('  Électricien  ') // => 'Electricien'
 * normalizeKeyword('Café', true) // => 'cafe'
 */
export function normalizeKeyword(keyword, lowercase = false) {
  if (!keyword) return keyword;

  let normalized = removeAccents(keyword.trim());

  if (lowercase) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
}

/**
 * Normalise une localisation pour le scraping
 * Même logique que normalizeKeyword mais adapté aux noms de villes
 *
 * @param {string} location - Localisation brute
 * @returns {string} Localisation normalisée
 *
 * @example
 * normalizeLocation('Évry') // => 'Evry'
 * normalizeLocation('Saint-Étienne') // => 'Saint-Etienne'
 */
export function normalizeLocation(location) {
  return normalizeKeyword(location, false);
}
