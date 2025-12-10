import React, { useState } from "react";
import ProspectCard from "./ProspectCard";
import ProspectDetailsModal from "./ProspectDetailsModal";
import TagBadge from "./TagBadge";
import SourceBadge from "./SourceBadge";
import { deleteProspect, getProspectById } from "../services/api";

/**
 * Composant pour afficher la liste des prospects
 * Supporte deux modes d'affichage : tableau et grille
 */
export default function ProspectList({ prospects, loading, error, viewMode = 'table', onProspectUpdated, sortBy, sortOrder, onSortChange }) {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleProspectClick = (prospect) => {
    setSelectedProspect(prospect);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProspect(null);
  };

  const handleProspectUpdatedInModal = async () => {
    // Recharger les données du prospect depuis l'API
    if (selectedProspect) {
      try {
        const updatedProspect = await getProspectById(selectedProspect.id);
        setSelectedProspect(updatedProspect);
      } catch (error) {
        console.error("Erreur lors du rechargement du prospect:", error);
      }
    }

    // Appeler aussi le callback parent pour rafraîchir la liste
    if (onProspectUpdated) {
      onProspectUpdated();
    }
  };

  const handleDelete = async (prospect, e) => {
    e.stopPropagation();

    if (!confirm(`Voulez-vous vraiment supprimer le prospect "${prospect.nom_entreprise}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    setDeletingId(prospect.id);
    try {
      await deleteProspect(prospect.id);

      if (onProspectUpdated) {
        onProspectUpdated();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression: " + (error.response?.data?.message || error.message));
    } finally {
      setDeletingId(null);
    }
  };

  // Gérer le clic sur un en-tête de colonne pour trier
  const handleSort = (field) => {
    if (!onSortChange) return;

    let newSortOrder = 'ASC';

    // Si on clique sur la même colonne
    if (sortBy === field) {
      if (sortOrder === 'ASC') {
        newSortOrder = 'DESC';
      } else if (sortOrder === 'DESC') {
        // Reset (aucun tri)
        onSortChange(null, null);
        return;
      }
    }

    onSortChange(field, newSortOrder);
  };

  // Composant pour l'icône de tri
  const SortIcon = ({ field }) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
        </svg>
      );
    }

    if (sortOrder === 'ASC') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-semibold">Erreur</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!prospects || prospects.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-8 rounded text-center">
        <p className="text-lg">Aucun prospect trouvé</p>
        <p className="text-sm mt-2">Commencez par ajouter des prospects ou lancez un scraping.</p>
      </div>
    );
  }

  // Mode grille (cartes)
  if (viewMode === 'grid') {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prospects.map((prospect) => (
            <ProspectCard key={prospect.id} prospect={prospect} onProspectUpdated={onProspectUpdated} />
          ))}
        </div>
        <ProspectDetailsModal
          prospect={selectedProspect}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onProspectUpdated={handleProspectUpdatedInModal}
        />
      </>
    );
  }

  // Mode tableau (par défaut)
  return (
    <>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group w-64"
                onClick={() => handleSort('nom_entreprise')}
              >
                <div className="flex items-center gap-1">
                  <span>Nom de l'entreprise</span>
                  <SortIcon field="nom_entreprise" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                Adresse
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                onClick={() => handleSort('code_postal')}
              >
                <div className="flex items-center gap-1">
                  <span>Code postal</span>
                  <SortIcon field="code_postal" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                onClick={() => handleSort('ville')}
              >
                <div className="flex items-center gap-1">
                  <span>Ville</span>
                  <SortIcon field="ville" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Téléphone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sources
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prospects.map((prospect) => (
              <tr key={prospect.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 max-w-64">
                  <button
                    onClick={() => handleProspectClick(prospect)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left break-words"
                  >
                    {prospect.nom_entreprise}
                  </button>
                </td>
                <td className="px-6 py-4 max-w-80">
                  <div className="text-sm text-gray-900 break-words">
                    {prospect.adresse || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {prospect.code_postal || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {prospect.ville || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {prospect.telephone ? (
                    <a
                      href={`tel:${prospect.telephone}`}
                      className="text-sm text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {prospect.telephone}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <SourceBadge prospect={prospect} />
                </td>
                <td className="px-6 py-4">
                  <TagBadge prospect={prospect} onTagsUpdated={onProspectUpdated} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={(e) => handleDelete(prospect, e)}
                    disabled={deletingId === prospect.id}
                    className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    title="Supprimer ce prospect"
                  >
                    {deletingId === prospect.id ? (
                      <svg className="animate-spin h-5 w-5 inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProspectDetailsModal
        prospect={selectedProspect}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onProspectUpdated={handleProspectUpdatedInModal}
      />
    </>
  );
}
