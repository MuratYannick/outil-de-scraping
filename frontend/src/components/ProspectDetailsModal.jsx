import React from 'react';
import TagBadge from './TagBadge';

/**
 * Modal pour afficher les détails complets d'un prospect
 */
export default function ProspectDetailsModal({ prospect, isOpen, onClose, onProspectUpdated }) {
  if (!isOpen || !prospect) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {prospect.nom_entreprise}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Source et Date */}
          <div className="flex gap-4">
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
              {prospect.source_scraping}
            </span>
            <span className="text-sm text-gray-500">
              Ajouté le {new Date(prospect.date_ajout).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne gauche */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Coordonnées</h3>

              {/* Adresse */}
              {prospect.adresse && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Adresse</label>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-900">{prospect.adresse}</p>
                  </div>
                </div>
              )}

              {/* Code postal et Ville */}
              <div className="grid grid-cols-2 gap-4">
                {prospect.code_postal && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Code postal</label>
                    <p className="text-sm text-gray-900 font-medium">{prospect.code_postal}</p>
                  </div>
                )}
                {prospect.ville && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ville</label>
                    <p className="text-sm text-gray-900 font-medium">{prospect.ville}</p>
                  </div>
                )}
              </div>

              {/* Téléphone */}
              {prospect.telephone && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Téléphone</label>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <a href={`tel:${prospect.telephone}`} className="text-sm text-blue-600 hover:underline">
                      {prospect.telephone}
                    </a>
                  </div>
                </div>
              )}

              {/* Email */}
              {prospect.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <a href={`mailto:${prospect.email}`} className="text-sm text-blue-600 hover:underline">
                      {prospect.email}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations complémentaires</h3>

              {/* Contact */}
              {prospect.nom_contact && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nom du contact</label>
                  <p className="text-sm text-gray-900">{prospect.nom_contact}</p>
                </div>
              )}

              {/* Poste */}
              {prospect.poste && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Poste</label>
                  <p className="text-sm text-gray-900">{prospect.poste}</p>
                </div>
              )}

              {/* Site web */}
              {prospect.url_site && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Site web</label>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    <a
                      href={prospect.url_site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate"
                    >
                      {prospect.url_site}
                    </a>
                  </div>
                </div>
              )}

              {/* URL LinkedIn */}
              {prospect.url_linkedin && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn</label>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                    </svg>
                    <a
                      href={prospect.url_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate"
                    >
                      Voir le profil
                    </a>
                  </div>
                </div>
              )}

              {/* Note */}
              {prospect.note && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Note / Avis</label>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">{prospect.note} / 5</span>
                  </div>
                </div>
              )}

              {/* Coordonnées GPS */}
              {(prospect.latitude || prospect.longitude) && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Coordonnées GPS</label>
                  <p className="text-xs text-gray-600 font-mono">
                    {prospect.latitude}, {prospect.longitude}
                  </p>
                  {prospect.latitude && prospect.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${prospect.latitude},${prospect.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Voir sur Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3">Tags</h3>
            <TagBadge prospect={prospect} onTagsUpdated={onProspectUpdated} />
          </div>

          {/* Notes */}
          {prospect.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3">Notes</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{prospect.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
