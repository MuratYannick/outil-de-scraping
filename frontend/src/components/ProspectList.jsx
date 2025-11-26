import React, { useState } from "react";
import ProspectCard from "./ProspectCard";
import ProspectDetailsModal from "./ProspectDetailsModal";
import TagBadge from "./TagBadge";

/**
 * Composant pour afficher la liste des prospects
 * Supporte deux modes d'affichage : tableau et grille
 */
export default function ProspectList({ prospects, loading, error, viewMode = 'table', onProspectUpdated }) {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProspectClick = (prospect) => {
    setSelectedProspect(prospect);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProspect(null);
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
          onProspectUpdated={onProspectUpdated}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom de l'entreprise
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adresse
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code postal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ville
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Téléphone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prospects.map((prospect) => (
              <tr key={prospect.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleProspectClick(prospect)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                  >
                    {prospect.nom_entreprise}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={prospect.adresse}>
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
                  <TagBadge prospect={prospect} onTagsUpdated={onProspectUpdated} />
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
        onProspectUpdated={onProspectUpdated}
      />
    </>
  );
}
