/**
 * Hook personnalisé pour gérer la suppression de prospects
 * Centralise la logique dupliquée dans ProspectList.jsx, ProspectCard.jsx
 */

import { useState } from 'react';
import { deleteProspect } from '../services/api';

/**
 * Hook de suppression de prospect avec confirmation et gestion d'état
 *
 * @param {Object} options - Options du hook
 * @param {Function} options.onDeleted - Callback appelé après suppression réussie
 * @param {Function} options.onError - Callback appelé en cas d'erreur
 * @returns {Object} État et fonction de suppression
 * @returns {number|null} deletingId - ID du prospect en cours de suppression
 * @returns {Function} handleDelete - Fonction de suppression
 * @returns {string|null} error - Message d'erreur si échec
 *
 * @example
 * const { deletingId, handleDelete, error } = useDeleteProspect({
 *   onDeleted: () => loadProspects(),
 *   onError: (err) => console.error(err)
 * });
 *
 * <button
 *   onClick={() => handleDelete(prospect)}
 *   disabled={deletingId === prospect.id}
 * >
 *   {deletingId === prospect.id ? 'Suppression...' : 'Supprimer'}
 * </button>
 */
export function useDeleteProspect({ onDeleted, onError } = {}) {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Supprime un prospect avec confirmation utilisateur
   *
   * @param {Object} prospect - Prospect à supprimer
   * @param {number} prospect.id - ID du prospect
   * @param {string} prospect.nom_entreprise - Nom de l'entreprise (pour confirmation)
   * @returns {Promise<boolean>} true si suppression réussie, false sinon
   */
  const handleDelete = async (prospect) => {
    // Réinitialiser l'erreur précédente
    setError(null);

    // Confirmation utilisateur
    const confirmMessage = `Voulez-vous vraiment supprimer le prospect "${prospect.nom_entreprise}" ?\n\nCette action est irréversible.`;

    if (!window.confirm(confirmMessage)) {
      return false;
    }

    // Marquer comme en cours de suppression
    setDeletingId(prospect.id);

    try {
      await deleteProspect(prospect.id);

      // Succès : callback si fourni
      if (onDeleted) {
        onDeleted(prospect);
      }

      return true;
    } catch (err) {
      // Erreur : définir le message et callback si fourni
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la suppression';
      setError(errorMessage);

      if (onError) {
        onError(err, prospect);
      }

      console.error('[useDeleteProspect] Erreur suppression:', err);
      return false;
    } finally {
      // Toujours réinitialiser l'état de chargement
      setDeletingId(null);
    }
  };

  /**
   * Réinitialise l'erreur
   */
  const clearError = () => setError(null);

  return {
    deletingId,
    error,
    handleDelete,
    clearError,
    isDeleting: deletingId !== null,
  };
}
