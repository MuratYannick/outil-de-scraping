import { useState, useEffect } from 'react';
import { getTags, addTagToProspect, removeTagFromProspect } from '../services/api';

/**
 * Composant pour gérer les tags d'un prospect
 * @param {Object} prospect - Le prospect avec ses tags
 * @param {Function} onTagsUpdated - Callback appelé après ajout/suppression de tag
 */
export default function TagBadge({ prospect, onTagsUpdated }) {
  const [availableTags, setAvailableTags] = useState([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAddingTag) {
      loadAvailableTags();
    }
  }, [isAddingTag]);

  const loadAvailableTags = async () => {
    try {
      const response = await getTags();
      // Filtrer les tags déjà associés au prospect
      const prospectTagIds = (prospect.tags || []).map(tag => tag.id);
      const filtered = (response.data || []).filter(tag => !prospectTagIds.includes(tag.id));
      setAvailableTags(filtered);
    } catch (err) {
      console.error('[TagBadge] Erreur chargement tags:', err);
    }
  };

  const handleAddTag = async (tagId) => {
    try {
      setLoading(true);
      await addTagToProspect(prospect.id, tagId);
      setIsAddingTag(false);
      if (onTagsUpdated) {
        onTagsUpdated();
      }
    } catch (err) {
      console.error('[TagBadge] Erreur ajout tag:', err);
      alert(err.response?.data?.message || 'Erreur lors de l\'ajout du tag');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId) => {
    if (!confirm('Retirer ce tag du prospect ?')) {
      return;
    }

    try {
      setLoading(true);
      await removeTagFromProspect(prospect.id, tagId);
      if (onTagsUpdated) {
        onTagsUpdated();
      }
    } catch (err) {
      console.error('[TagBadge] Erreur suppression tag:', err);
      alert(err.response?.data?.message || 'Erreur lors de la suppression du tag');
    } finally {
      setLoading(false);
    }
  };

  const prospectTags = prospect.tags || [];

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {/* Tags existants */}
      {prospectTags.length > 0 ? (
        prospectTags.map((tag) => (
          <span
            key={tag.id}
            className="group relative px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold inline-flex items-center gap-1"
          >
            {tag.nom}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              disabled={loading}
              className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
              title="Retirer ce tag"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </span>
        ))
      ) : (
        <span className="text-xs text-gray-400">Aucun tag</span>
      )}

      {/* Bouton pour ajouter un tag */}
      <div className="relative">
        {isAddingTag ? (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsAddingTag(false)}
            />

            {/* Dropdown des tags disponibles */}
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20 max-h-60 overflow-y-auto">
              {availableTags.length > 0 ? (
                <div className="py-1">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleAddTag(tag.id)}
                      disabled={loading}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        {tag.nom}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Aucun tag disponible
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsAddingTag(true)}
            disabled={loading}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors inline-flex items-center gap-1 disabled:opacity-50"
            title="Ajouter un tag"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Ajouter
          </button>
        )}
      </div>
    </div>
  );
}
