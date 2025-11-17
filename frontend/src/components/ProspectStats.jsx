import { useState, useEffect } from 'react';
import { getProspects, getTags } from '../services/api';

/**
 * Composant de statistiques des prospects
 */
export default function ProspectStats() {
  const [stats, setStats] = useState({
    total: 0,
    by_source: {},
    by_tag: {},
    recent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);

        // Récupérer tous les prospects (sans limite pour les stats)
        const prospectsData = await getProspects({ limit: 1000 });
        const prospects = prospectsData.data || [];

        // Récupérer les tags
        const tagsData = await getTags();
        const tags = tagsData.data || [];

        // Calculer les stats
        const bySource = {};
        const byTag = {};
        let recent = 0;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        prospects.forEach(prospect => {
          // Par source
          const source = prospect.source_scraping || 'Inconnu';
          bySource[source] = (bySource[source] || 0) + 1;

          // Par tag
          if (prospect.tags && prospect.tags.length > 0) {
            prospect.tags.forEach(tag => {
              byTag[tag.nom] = (byTag[tag.nom] || 0) + 1;
            });
          }

          // Récents (7 derniers jours)
          const addedDate = new Date(prospect.date_ajout);
          if (addedDate >= weekAgo) {
            recent++;
          }
        });

        setStats({
          total: prospects.length,
          by_source: bySource,
          by_tag: byTag,
          recent,
        });
      } catch (error) {
        console.error('[ProspectStats] Erreur chargement stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistiques</h3>

      {/* Cartes de stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Prospects</p>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Cette semaine</p>
          <p className="text-3xl font-bold text-green-600">{stats.recent}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Sources</p>
          <p className="text-3xl font-bold text-purple-600">{Object.keys(stats.by_source).length}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Tags</p>
          <p className="text-3xl font-bold text-yellow-600">{Object.keys(stats.by_tag).length}</p>
        </div>
      </div>

      {/* Par source */}
      {Object.keys(stats.by_source).length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Par source</h4>
          <div className="space-y-2">
            {Object.entries(stats.by_source)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => {
                const percentage = Math.round((count / stats.total) * 100);
                return (
                  <div key={source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{source}</span>
                      <span className="text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Top tags */}
      {Object.keys(stats.by_tag).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Tags</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.by_tag)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([tag, count]) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {tag} ({count})
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
