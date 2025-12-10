/**
 * Hook personnalisé pour gérer les filtres de prospects
 * Centralise la logique de filtrage avec callbacks stables
 */

import { useState, useCallback } from 'react';
import { resetFilters as resetFiltersUtil, hasActiveFilters } from '../utils/filterParams';

/**
 * Hook de gestion des filtres avec callbacks optimisés
 *
 * @param {Object} initialFilters - Filtres initiaux { source, tag, search }
 * @param {Function} onChange - Callback appelé quand les filtres changent
 * @returns {Object} État et fonctions de gestion des filtres
 *
 * @example
 * const { filters, updateFilter, updateFilters, resetFilters, hasFilters } = useFilters(
 *   { source: '', tag: '', search: '' },
 *   (newFilters) => console.log('Filtres changés:', newFilters)
 * );
 */
export function useFilters(initialFilters = {}, onChange) {
  const [filters, setFilters] = useState({
    source: '',
    tag: '',
    search: '',
    ...initialFilters,
  });

  /**
   * Met à jour un filtre spécifique
   * Utilise useCallback pour éviter les re-renders inutiles
   */
  const updateFilter = useCallback(
    (filterName, value) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [filterName]: value };

        // Appeler onChange si fourni
        if (onChange) {
          onChange(newFilters);
        }

        return newFilters;
      });
    },
    [onChange]
  );

  /**
   * Met à jour plusieurs filtres en une fois
   */
  const updateFilters = useCallback(
    (newFilters) => {
      setFilters((prev) => {
        const updated = { ...prev, ...newFilters };

        if (onChange) {
          onChange(updated);
        }

        return updated;
      });
    },
    [onChange]
  );

  /**
   * Réinitialise tous les filtres
   */
  const resetFilters = useCallback(() => {
    const emptyFilters = resetFiltersUtil();
    setFilters(emptyFilters);

    if (onChange) {
      onChange(emptyFilters);
    }
  }, [onChange]);

  /**
   * Vérifie si des filtres sont actifs
   */
  const hasFilters = hasActiveFilters(filters);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    hasFilters,
  };
}
