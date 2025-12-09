/**
 * Utilitaire de construction des paramètres de filtrage pour l'API
 * Élimine la duplication de logique entre App.jsx, ExportMenu.jsx, et BulkDeleteButton.jsx
 */

/**
 * Construit les paramètres de requête API à partir des filtres, tri et pagination
 *
 * @param {Object} options - Options de construction
 * @param {Object} options.filters - Filtres actifs { source, tag, search }
 * @param {Object} options.sorting - Tri actif { sortBy, sortOrder }
 * @param {Object} options.pagination - Pagination { limit, offset }
 * @returns {Object} Paramètres prêts pour l'API
 *
 * @example
 * const params = buildFilterParams({
 *   filters: { source: 'Google Maps', tag: 'urgent', search: 'plombier' },
 *   sorting: { sortBy: 'nom_entreprise', sortOrder: 'ASC' },
 *   pagination: { limit: 20, offset: 0 }
 * });
 * // => { limit: 20, offset: 0, source: 'Google Maps', tag: 'urgent', search: 'plombier', sortBy: 'nom_entreprise', sortOrder: 'ASC' }
 */
export function buildFilterParams({ filters = {}, sorting = {}, pagination = {} }) {
  const params = {};

  // Pagination
  if (pagination.limit !== undefined) {
    params.limit = pagination.limit;
  }
  if (pagination.offset !== undefined) {
    params.offset = pagination.offset;
  }

  // Filtres
  if (filters.source) {
    params.source = filters.source;
  }
  if (filters.tag) {
    params.tag = filters.tag;
  }
  if (filters.search) {
    params.search = filters.search;
  }

  // Tri
  if (sorting.sortBy) {
    params.sortBy = sorting.sortBy;
  }
  if (sorting.sortOrder) {
    params.sortOrder = sorting.sortOrder;
  }

  return params;
}

/**
 * Vérifie si des filtres sont actifs
 *
 * @param {Object} filters - Filtres à vérifier { source, tag, search }
 * @returns {boolean} true si au moins un filtre est actif
 *
 * @example
 * hasActiveFilters({ source: '', tag: '', search: '' }) // false
 * hasActiveFilters({ source: 'Google Maps', tag: '', search: '' }) // true
 */
export function hasActiveFilters(filters = {}) {
  return Boolean(filters.source || filters.tag || filters.search);
}

/**
 * Réinitialise tous les filtres
 *
 * @returns {Object} Filtres vides { source: '', tag: '', search: '' }
 */
export function resetFilters() {
  return {
    source: '',
    tag: '',
    search: '',
  };
}

/**
 * Construit une chaîne de description des filtres actifs
 * Utile pour affichage utilisateur
 *
 * @param {Object} filters - Filtres actifs
 * @returns {string} Description textuelle des filtres
 *
 * @example
 * describeFilters({ source: 'Google Maps', tag: 'urgent', search: 'plombier' })
 * // => "Source: Google Maps, Tag: urgent, Recherche: plombier"
 */
export function describeFilters(filters = {}) {
  const parts = [];

  if (filters.source) {
    parts.push(`Source: ${filters.source}`);
  }
  if (filters.tag) {
    parts.push(`Tag: ${filters.tag}`);
  }
  if (filters.search) {
    parts.push(`Recherche: ${filters.search}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Aucun filtre actif';
}
