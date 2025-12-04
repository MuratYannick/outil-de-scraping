import React, { useState } from 'react';
import TagBadge from './TagBadge';
import SourceBadge from './SourceBadge';
import { deleteProspect } from '../services/api';

/**
 * Composant carte pour afficher un prospect (vue grille)
 */
export default function ProspectCard({ prospect, onProspectUpdated }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();

    if (!confirm(`Voulez-vous vraiment supprimer le prospect "${prospect.nom_entreprise}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProspect(prospect.id);

      if (onProspectUpdated) {
        onProspectUpdated();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression: " + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative">
      {/* Bouton de suppression */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-4 right-4 text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        title="Supprimer ce prospect"
      >
        {isDeleting ? (
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>

      {/* Header */}
      <div className="flex justify-between items-start mb-4 pr-8">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {prospect.nom_entreprise}
          </h3>
          {prospect.nom_contact && (
            <p className="text-sm text-gray-600">{prospect.nom_contact}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <SourceBadge prospect={prospect} />
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {prospect.email && (
          <div className="flex items-center text-sm text-gray-700">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <a href={`mailto:${prospect.email}`} className="hover:text-blue-600">
              {prospect.email}
            </a>
          </div>
        )}

        {prospect.telephone && (
          <div className="flex items-center text-sm text-gray-700">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <a href={`tel:${prospect.telephone}`} className="hover:text-blue-600">
              {prospect.telephone}
            </a>
          </div>
        )}

        {prospect.adresse && (
          <div className="flex items-start text-sm text-gray-700">
            <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="flex-1">{prospect.adresse}</span>
          </div>
        )}

        {prospect.url_site && (
          <div className="flex items-center text-sm text-gray-700">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            <a
              href={prospect.url_site}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 truncate"
            >
              Voir le site
            </a>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="mb-4">
        <TagBadge prospect={prospect} onTagsUpdated={onProspectUpdated} />
      </div>

      {/* Footer - Date */}
      <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
        Ajouté le {new Date(prospect.date_ajout).toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
}
