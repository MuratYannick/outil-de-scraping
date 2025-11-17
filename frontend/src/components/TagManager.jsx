import { useState, useEffect } from 'react';
import { getTags, createTag, updateTag, deleteTag } from '../services/api';

/**
 * Composant de gestion des tags (CRUD)
 */
export default function TagManager() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [editTagName, setEditTagName] = useState('');

  // Charger les tags au montage du composant
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTags();
      setTags(response.data || []);
    } catch (err) {
      console.error('[TagManager] Erreur chargement tags:', err);
      setError(err.response?.data?.message || 'Impossible de charger les tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await createTag(newTagName.trim());
      setNewTagName('');
      setIsCreating(false);
      await loadTags();
    } catch (err) {
      console.error('[TagManager] Erreur création tag:', err);
      alert(err.response?.data?.message || 'Erreur lors de la création du tag');
    }
  };

  const handleUpdateTag = async (e) => {
    e.preventDefault();
    if (!editTagName.trim() || !editingTag) return;

    try {
      await updateTag(editingTag.id, editTagName.trim());
      setEditingTag(null);
      setEditTagName('');
      await loadTags();
    } catch (err) {
      console.error('[TagManager] Erreur modification tag:', err);
      alert(err.response?.data?.message || 'Erreur lors de la modification du tag');
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tag ? Il sera retiré de tous les prospects associés.')) {
      return;
    }

    try {
      await deleteTag(tagId);
      await loadTags();
    } catch (err) {
      console.error('[TagManager] Erreur suppression tag:', err);
      alert(err.response?.data?.message || 'Erreur lors de la suppression du tag');
    }
  };

  const startEdit = (tag) => {
    setEditingTag(tag);
    setEditTagName(tag.nom);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setEditTagName('');
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
        <button
          onClick={loadTags}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Tags</h2>
          <p className="text-sm text-gray-500 mt-1">
            {tags.length} tag{tags.length > 1 ? 's' : ''} disponible{tags.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingTag(null);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Nouveau tag
        </button>
      </div>

      {/* Formulaire de création */}
      {isCreating && (
        <form onSubmit={handleCreateTag} className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nom du nouveau tag"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewTagName('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste des tags */}
      {tags.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Aucun tag disponible</p>
          <p className="text-xs text-gray-400 mt-1">
            Cliquez sur "Nouveau tag" pour en créer un
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              {editingTag && editingTag.id === tag.id ? (
                // Mode édition
                <form onSubmit={handleUpdateTag} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editTagName}
                    onChange={(e) => setEditTagName(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Annuler
                  </button>
                </form>
              ) : (
                // Mode affichage
                <>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {tag.nom}
                    </span>
                    {tag.Prospects && (
                      <span className="text-xs text-gray-500">
                        {tag.Prospects.length} prospect{tag.Prospects.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(tag)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Modifier"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
