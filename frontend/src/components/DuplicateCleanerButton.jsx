import React, { useState } from "react";
import { detectDuplicates, cleanDuplicates, cleanSelectedDuplicates } from "../services/api";

/**
 * Composant bouton pour détecter et nettoyer les doublons
 */
export default function DuplicateCleanerButton({ onCleanComplete }) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [duplicates, setDuplicates] = useState(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [cleanResult, setCleanResult] = useState(null);

  const handleDetect = async () => {
    setIsDetecting(true);
    try {
      const response = await detectDuplicates();
      setDuplicates(response);

      if (response.duplicatesFound > 0) {
        // Sélectionner tous les doublons par défaut
        const allIndices = new Set(response.duplicates.map((_, index) => index));
        setSelectedDuplicates(allIndices);
        setShowModal(true);
      } else {
        alert("Aucun doublon trouvé ! La base de données est propre.");
      }
    } catch (error) {
      console.error("Erreur lors de la détection:", error);
      alert("Erreur lors de la détection des doublons: " + (error.response?.data?.message || error.message));
    } finally {
      setIsDetecting(false);
    }
  };

  const handleToggleDuplicate = (index) => {
    setSelectedDuplicates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allIndices = new Set(duplicates.duplicates.map((_, index) => index));
    setSelectedDuplicates(allIndices);
  };

  const handleDeselectAll = () => {
    setSelectedDuplicates(new Set());
  };

  const handleClean = async () => {
    const selectedCount = selectedDuplicates.size;

    if (selectedCount === 0) {
      alert("Veuillez sélectionner au moins un doublon à fusionner.");
      return;
    }

    if (!confirm(`Voulez-vous fusionner ${selectedCount} doublon(s) sélectionné(s) ?\n\nCette action est irréversible.`)) {
      return;
    }

    setIsCleaning(true);
    try {
      // Filtrer uniquement les doublons sélectionnés
      const selectedPairs = duplicates.duplicates.filter((_, index) => selectedDuplicates.has(index));

      const result = await cleanSelectedDuplicates(selectedPairs);
      setCleanResult(result);

      // Fermer le modal de détection et afficher le résultat
      setShowModal(false);

      // Notifier le parent pour rafraîchir la liste
      if (onCleanComplete) {
        onCleanComplete(result);
      }

      // Afficher un message de succès
      alert(`✅ Nettoyage terminé !\n\n` +
            `Doublons fusionnés : ${result.duplicatesMerged}\n` +
            `Erreurs : ${result.errors}`);
    } catch (error) {
      console.error("Erreur lors du nettoyage:", error);
      alert("Erreur lors du nettoyage des doublons: " + (error.response?.data?.message || error.message));
    } finally {
      setIsCleaning(false);
      setDuplicates(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDuplicates(null);
  };

  return (
    <>
      <button
        onClick={handleDetect}
        disabled={isDetecting || isCleaning}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${isDetecting || isCleaning
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
          }
        `}
        title="Détecter et fusionner les prospects en doublon"
      >
        {isDetecting ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Détection...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Nettoyer les doublons</span>
          </>
        )}
      </button>

      {/* Modal d'affichage des doublons */}
      {showModal && duplicates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* En-tête */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {duplicates.duplicatesFound} doublon(s) détecté(s)
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedDuplicates.size} sélectionné(s) - Sélectionnez les doublons à fusionner
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {duplicates.duplicates.map((pair, index) => {
                  const isSelected = selectedDuplicates.has(index);
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 transition-all ${
                        isSelected
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-300 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {/* Checkbox de sélection */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleDuplicate(index)}
                          className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                        />

                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isSelected ? 'bg-orange-600 text-white' : 'bg-gray-400 text-white'
                        }`}>
                          {index + 1}
                        </div>

                        <div className={`text-sm flex-1 ${
                          isSelected ? 'text-orange-800 font-medium' : 'text-gray-600'
                        }`}>
                          {pair.reason}
                        </div>
                      </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Prospect 1 */}
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Prospect A (ID: {pair.prospect1.id})</div>
                        <div className="font-semibold text-gray-800 mb-2">{pair.prospect1.nom_entreprise}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {pair.prospect1.adresse && <div>📍 {pair.prospect1.adresse}</div>}
                          {pair.prospect1.ville && <div>🏙️ {pair.prospect1.ville} {pair.prospect1.code_postal}</div>}
                          {pair.prospect1.telephone && <div>📞 {pair.prospect1.telephone}</div>}
                        </div>
                        {pair.prospect1.sources && pair.prospect1.sources.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {pair.prospect1.sources.map((source, i) => (
                              <span key={i} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {source}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Prospect 2 */}
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Prospect B (ID: {pair.prospect2.id})</div>
                        <div className="font-semibold text-gray-800 mb-2">{pair.prospect2.nom_entreprise}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {pair.prospect2.adresse && <div>📍 {pair.prospect2.adresse}</div>}
                          {pair.prospect2.ville && <div>🏙️ {pair.prospect2.ville} {pair.prospect2.code_postal}</div>}
                          {pair.prospect2.telephone && <div>📞 {pair.prospect2.telephone}</div>}
                        </div>
                        {pair.prospect2.sources && pair.prospect2.sources.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {pair.prospect2.sources.map((source, i) => (
                              <span key={i} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {source}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Pied de page avec boutons d'action */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                disabled={isCleaning}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleClean}
                disabled={isCleaning || selectedDuplicates.size === 0}
                className={`
                  px-6 py-2 rounded-lg font-medium flex items-center gap-2
                  ${isCleaning || selectedDuplicates.size === 0
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                  }
                `}
              >
                {isCleaning ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Fusion en cours...</span>
                  </>
                ) : (
                  <span>Fusionner {selectedDuplicates.size} doublon(s)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
