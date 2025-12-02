import { useState } from 'react';
import { exportToCSV, exportToJSON, copyToClipboard } from '../utils/export';
import { getProspects } from '../services/api';

/**
 * Composant menu d'export de données
 */
export default function ExportMenu({ prospects, totalCount, filters, sorting }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleFormatClick = (format) => {
    setSelectedFormat(format);
    setShowModal(true);
    setIsOpen(false);
  };

  const handleExport = async (scope) => {
    setIsExporting(true);
    try {
      let dataToExport = prospects;

      // Si on exporte tous les prospects filtrés, récupérer toutes les données de l'API
      if (scope === 'all') {
        const params = {
          limit: totalCount || 10000, // Récupérer tous les prospects
          offset: 0,
        };

        // Ajouter les filtres
        if (filters.source) params.source = filters.source;
        if (filters.tag) params.tag = filters.tag;
        if (filters.search) params.search = filters.search;

        // Ajouter le tri
        if (sorting.sortBy) params.sortBy = sorting.sortBy;
        if (sorting.sortOrder) params.sortOrder = sorting.sortOrder;

        const response = await getProspects(params);
        dataToExport = response.data || [];
      }

      const filename = `prospects_${scope === 'all' ? 'tous' : 'page'}_${new Date().toISOString().split('T')[0]}`;

      // Exporter dans le format sélectionné
      if (selectedFormat === 'csv') {
        exportToCSV(dataToExport, `${filename}.csv`);
      } else if (selectedFormat === 'json') {
        exportToJSON(dataToExport, `${filename}.json`);
      } else if (selectedFormat === 'clipboard') {
        await copyToClipboard(dataToExport);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données');
    } finally {
      setIsExporting(false);
      setShowModal(false);
      setSelectedFormat(null);
    }
  };

  if (!prospects || prospects.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Exporter
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu dropdown */}
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
              <div className="py-1" role="menu">
                <button
                  onClick={() => handleFormatClick('csv')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  role="menuitem"
                >
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Exporter en CSV
                </button>

                <button
                  onClick={() => handleFormatClick('json')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  role="menuitem"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Exporter en JSON
                </button>

                <button
                  onClick={() => handleFormatClick('clipboard')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  role="menuitem"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copier dans le presse-papiers
                </button>
              </div>

              <div className="border-t border-gray-100 py-1">
                <div className="px-4 py-2 text-xs text-gray-500">
                  {prospects.length} prospect{prospects.length > 1 ? 's' : ''} sur la page
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de choix d'export */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Choisir l'étendue de l'export
              </h3>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                Que souhaitez-vous exporter ?
              </p>

              <div className="space-y-3">
                {/* Option: Page actuelle */}
                <button
                  onClick={() => handleExport('current')}
                  disabled={isExporting}
                  className="w-full text-left px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Page actuelle</div>
                      <div className="text-sm text-gray-500">
                        {prospects.length} prospect{prospects.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Option: Tous les prospects filtrés */}
                <button
                  onClick={() => handleExport('all')}
                  disabled={isExporting}
                  className="w-full text-left px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Tous les prospects filtrés</div>
                      <div className="text-sm text-gray-500">
                        {totalCount} prospect{totalCount > 1 ? 's' : ''} au total
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {isExporting && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Export en cours...</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedFormat(null);
                }}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
