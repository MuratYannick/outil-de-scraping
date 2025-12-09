/**
 * Hook personnalisé pour gérer la pagination
 * Centralise la logique de pagination avec callbacks optimisés
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Hook de gestion de pagination
 *
 * @param {Object} options - Options de pagination
 * @param {number} options.initialLimit - Limite initiale par page (défaut: 20)
 * @param {number} options.totalCount - Nombre total d'éléments
 * @param {Function} options.onChange - Callback appelé quand pagination change
 * @returns {Object} État et fonctions de pagination
 *
 * @example
 * const {
 *   pagination,
 *   goToPage,
 *   goToFirstPage,
 *   goToLastPage,
 *   nextPage,
 *   prevPage,
 *   changeLimit,
 *   currentPage,
 *   totalPages,
 *   hasNextPage,
 *   hasPrevPage
 * } = usePagination({
 *   initialLimit: 20,
 *   totalCount: 150,
 *   onChange: (newPagination) => loadData(newPagination)
 * });
 */
export function usePagination({ initialLimit = 20, totalCount = 0, onChange } = {}) {
  const [pagination, setPagination] = useState({
    limit: initialLimit,
    offset: 0,
  });

  /**
   * Calcule la page actuelle (1-indexed)
   */
  const currentPage = useMemo(() => {
    return Math.floor(pagination.offset / pagination.limit) + 1;
  }, [pagination.offset, pagination.limit]);

  /**
   * Calcule le nombre total de pages
   */
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pagination.limit) || 1;
  }, [totalCount, pagination.limit]);

  /**
   * Vérifie s'il y a une page suivante
   */
  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  /**
   * Vérifie s'il y a une page précédente
   */
  const hasPrevPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  /**
   * Met à jour la pagination et appelle onChange
   */
  const updatePagination = useCallback(
    (newPagination) => {
      setPagination(newPagination);
      if (onChange) {
        onChange(newPagination);
      }
    },
    [onChange]
  );

  /**
   * Va à une page spécifique (1-indexed)
   */
  const goToPage = useCallback(
    (pageNumber) => {
      const page = Math.max(1, Math.min(pageNumber, totalPages));
      const newOffset = (page - 1) * pagination.limit;

      updatePagination({
        ...pagination,
        offset: newOffset,
      });
    },
    [pagination, totalPages, updatePagination]
  );

  /**
   * Va à la première page
   */
  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  /**
   * Va à la dernière page
   */
  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  /**
   * Va à la page suivante
   */
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, hasNextPage, goToPage]);

  /**
   * Va à la page précédente
   */
  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, hasPrevPage, goToPage]);

  /**
   * Change la limite par page et réinitialise à la première page
   */
  const changeLimit = useCallback(
    (newLimit) => {
      updatePagination({
        limit: newLimit,
        offset: 0, // Réinitialiser à la première page
      });
    },
    [updatePagination]
  );

  /**
   * Réinitialise la pagination à la première page
   */
  const reset = useCallback(() => {
    updatePagination({
      limit: initialLimit,
      offset: 0,
    });
  }, [initialLimit, updatePagination]);

  /**
   * Calcule le range des éléments affichés (ex: "1-20 sur 150")
   */
  const displayRange = useMemo(() => {
    if (totalCount === 0) {
      return { start: 0, end: 0, total: 0 };
    }

    const start = pagination.offset + 1;
    const end = Math.min(pagination.offset + pagination.limit, totalCount);

    return { start, end, total: totalCount };
  }, [pagination.offset, pagination.limit, totalCount]);

  return {
    // État de base
    pagination,

    // Informations calculées
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    displayRange,

    // Actions
    goToPage,
    goToFirstPage,
    goToLastPage,
    nextPage,
    prevPage,
    changeLimit,
    reset,
  };
}
