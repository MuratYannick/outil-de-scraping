import { useState, useEffect } from 'react';
import { getTags } from '../services/api';

/**
 * Composant de filtres pour les prospects
 */
export default function ProspectFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    source: '',
    tag: '',
    search: '',
  });

  const [tags, setTags] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Charger les tags au montage
  useEffect(() => {
    const loadTags = async () => {
      try {
        const data = await getTags();
        setTags(data.data || []);
      } catch (error) {
        console.error('[ProspectFilters] Erreur chargement tags:', error);
      }
    };
    loadTags();
  }, []);

  // Notifier le parent quand les filtres changent
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  const handleChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFilters({
      source: '',
      tag: '',
      search: '',
    });
  };

  const hasActiveFilters = filters.source || filters.tag || filters.search;

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {Object.values(filters).filter(Boolean).length}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Filtres */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleChange('search', e.target.value)}
                placeholder="Nom, email, téléphone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Source */}
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <select
                id="source"
                value={filters.source}
                onChange={(e) => handleChange('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les sources</option>
                <option value="Pages Jaunes">Pages Jaunes</option>
                <option value="Google Maps">Google Maps</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>

            {/* Tag */}
            <div>
              <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-1">
                Tag
              </label>
              <select
                id="tag"
                value={filters.tag}
                onChange={(e) => handleChange('tag', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.nom}>
                    {tag.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
