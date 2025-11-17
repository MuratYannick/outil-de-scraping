import { useState, useEffect } from 'react';
import { getScrapingStatus, cancelScraping } from '../services/api';

/**
 * Composant de suivi de progression de scraping
 * Affiche l'état et la progression en temps réel avec polling
 */
export default function ProgressTracker({ taskId, onComplete, onError }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  /**
   * Récupérer le statut de la tâche
   */
  const fetchStatus = async () => {
    try {
      const data = await getScrapingStatus(taskId);
      setTask(data);
      setLoading(false);

      // Si terminé, notifier le parent
      if (data.status === 'completed' && onComplete) {
        onComplete(data);
      }

      // Si échoué, notifier le parent
      if (data.status === 'failed' && onError) {
        onError(data);
      }

      return data;
    } catch (error) {
      console.error('[ProgressTracker] Erreur:', error);
      setLoading(false);
      if (onError) {
        onError(error);
      }
    }
  };

  /**
   * Annuler la tâche
   */
  const handleCancel = async () => {
    if (!window.confirm('Voulez-vous vraiment annuler ce scraping ?')) {
      return;
    }

    setCancelling(true);
    try {
      await cancelScraping(taskId);
      await fetchStatus(); // Rafraîchir le statut
    } catch (error) {
      console.error('[ProgressTracker] Erreur annulation:', error);
      alert('Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  /**
   * Polling pour mise à jour automatique
   */
  useEffect(() => {
    // Récupération initiale
    fetchStatus();

    // Polling toutes les 2 secondes si la tâche est en cours
    const interval = setInterval(async () => {
      const currentTask = await fetchStatus();

      // Arrêter le polling si la tâche est terminée
      if (currentTask && ['completed', 'failed', 'cancelled'].includes(currentTask.status)) {
        clearInterval(interval);
      }
    }, 2000);

    // Cleanup
    return () => clearInterval(interval);
  }, [taskId]);

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
          <span className="ml-3 text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Tâche non trouvée
      </div>
    );
  }

  // Badge de statut
  const getStatusBadge = () => {
    const badges = {
      pending: { text: 'En attente', color: 'bg-gray-100 text-gray-800' },
      in_progress: { text: 'En cours', color: 'bg-blue-100 text-blue-800' },
      completed: { text: 'Terminé', color: 'bg-green-100 text-green-800' },
      failed: { text: 'Échoué', color: 'bg-red-100 text-red-800' },
      cancelled: { text: 'Annulé', color: 'bg-yellow-100 text-yellow-800' },
    };

    const badge = badges[task.status] || badges.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // Couleur de la barre de progression
  const getProgressColor = () => {
    if (task.status === 'completed') return 'bg-green-600';
    if (task.status === 'failed') return 'bg-red-600';
    if (task.status === 'cancelled') return 'bg-yellow-600';
    return 'bg-blue-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Progression du Scraping</h3>
        {getStatusBadge()}
      </div>

      {/* Paramètres */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Recherche:</strong> {task.params.keyword} à {task.params.location}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          <strong>Source:</strong> {task.params.source} |
          <strong className="ml-2">Pages:</strong> {task.params.maxPages} |
          <strong className="ml-2">Résultats max:</strong> {task.params.maxResults}
        </p>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm font-medium text-gray-700">{task.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* Résultats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">{task.results.total}</p>
          <p className="text-sm text-gray-600">Prospects</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{task.results.pages_scraped}</p>
          <p className="text-sm text-gray-600">Pages</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-600">{task.results.errors?.length || 0}</p>
          <p className="text-sm text-gray-600">Erreurs</p>
        </div>
      </div>

      {/* Timestamps */}
      <div className="mb-4 text-sm text-gray-600 space-y-1">
        <p>
          <strong>Créée:</strong> {new Date(task.createdAt).toLocaleString('fr-FR')}
        </p>
        {task.startedAt && (
          <p>
            <strong>Démarrée:</strong> {new Date(task.startedAt).toLocaleString('fr-FR')}
          </p>
        )}
        {task.completedAt && (
          <p>
            <strong>Terminée:</strong> {new Date(task.completedAt).toLocaleString('fr-FR')}
          </p>
        )}
      </div>

      {/* Erreur */}
      {task.error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Erreur:</p>
          <p className="text-sm mt-1">{task.error}</p>
        </div>
      )}

      {/* Erreurs de scraping */}
      {task.results.errors && task.results.errors.length > 0 && (
        <div className="mb-4">
          <details className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-yellow-800">
              Erreurs de scraping ({task.results.errors.length})
            </summary>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {task.results.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {task.status === 'in_progress' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:bg-gray-400"
          >
            {cancelling ? 'Annulation...' : 'Annuler'}
          </button>
        )}

        {['completed', 'failed', 'cancelled'].includes(task.status) && (
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Nouveau scraping
          </button>
        )}
      </div>
    </div>
  );
}
