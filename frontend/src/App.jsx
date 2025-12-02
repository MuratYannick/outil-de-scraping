import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import ProspectList from "./components/ProspectList";
import AntiBotConfig from "./components/AntiBotConfig";
import GoogleMapsConfig from "./components/GoogleMapsConfig";
import ScrapingForm from "./components/ScrapingForm";
import ProgressTracker from "./components/ProgressTracker";
import Notification from "./components/Notification";
import ProspectStats from "./components/ProspectStats";
import ProspectFilters from "./components/ProspectFilters";
import Pagination from "./components/Pagination";
import ExportMenu from "./components/ExportMenu";
import TagManager from "./components/TagManager";
import { getProspects, checkHealth } from "./services/api";

export default function App() {
  const [activeView, setActiveView] = useState('scraping'); // 'prospects', 'scraping', 'config', or 'tags'
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState({ connected: false });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10, // Réduit de 20 à 10 pour avoir plusieurs pages
    offset: 0,
  });

  // État pour le scraping
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [notification, setNotification] = useState(null);

  // État pour les filtres et l'affichage
  const [filters, setFilters] = useState({
    source: '',
    tag: '',
    search: '',
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'grid'
  const [sorting, setSorting] = useState({
    sortBy: null,
    sortOrder: null,
  });

  // Vérifier le statut de l'API au chargement
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await checkHealth();
        setApiStatus({
          connected: response.status === "ok",
          message: response.message,
        });
      } catch (err) {
        console.error("Erreur de connexion API:", err);
        setApiStatus({
          connected: false,
          message: "Impossible de se connecter au serveur",
        });
      }
    };

    checkApiStatus();
  }, []);

  // Charger les prospects au chargement et quand les filtres/pagination changent
  useEffect(() => {
    const loadProspects = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          limit: pagination.limit,
          offset: pagination.offset,
        };

        // Ajouter les filtres s'ils sont définis
        if (filters.source) params.source = filters.source;
        if (filters.tag) params.tag = filters.tag;
        if (filters.search) params.search = filters.search;

        // Ajouter le tri s'il est défini
        if (sorting.sortBy) params.sortBy = sorting.sortBy;
        if (sorting.sortOrder) params.sortOrder = sorting.sortOrder;

        const data = await getProspects(params);

        setProspects(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.total || 0,
        }));
      } catch (err) {
        console.error("Erreur lors du chargement des prospects:", err);
        setError(
          err.response?.data?.message ||
          "Impossible de charger les prospects. Vérifiez que le serveur backend est démarré."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProspects();
  }, [pagination.limit, pagination.offset, filters.source, filters.tag, filters.search, sorting.sortBy, sorting.sortOrder]);

  // Fonction pour recharger les prospects
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        limit: pagination.limit,
        offset: 0,
      };

      if (filters.source) params.source = filters.source;
      if (filters.tag) params.tag = filters.tag;
      if (filters.search) params.search = filters.search;

      // Ajouter le tri s'il est défini
      if (sorting.sortBy) params.sortBy = sorting.sortBy;
      if (sorting.sortOrder) params.sortOrder = sorting.sortOrder;

      const data = await getProspects(params);

      setProspects(data.data || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        offset: 0,
      }));
    } catch (err) {
      console.error("Erreur lors du rechargement:", err);
      setError(
        err.response?.data?.message ||
        "Impossible de recharger les prospects"
      );
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de filtres (useCallback pour éviter les re-renders inutiles)
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    // Réinitialiser à la première page quand on change les filtres
    setPagination(prev => ({
      ...prev,
      offset: 0,
    }));
  }, []);

  // Gérer le changement de tri
  const handleSortChange = useCallback((sortBy, sortOrder) => {
    setSorting({ sortBy, sortOrder });
    // Réinitialiser à la première page quand on change le tri
    setPagination(prev => ({
      ...prev,
      offset: 0,
    }));
  }, []);

  // Gérer le changement de page
  const handlePageChange = (newOffset) => {
    setPagination(prev => ({
      ...prev,
      offset: newOffset,
    }));
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gérer le lancement d'un scraping
  const handleScrapingStarted = (result) => {
    console.log('[App] Scraping lancé:', result);
    setCurrentTaskId(result.task_id);
    setNotification({
      type: 'success',
      message: `Scraping lancé avec succès ! (ID: ${result.task_id.slice(0, 8)}...)`,
    });
  };

  // Gérer la completion d'un scraping
  const handleScrapingComplete = (task) => {
    console.log('[App] Scraping terminé:', task);
    setNotification({
      type: 'success',
      message: `Scraping terminé ! ${task.results.total} prospect(s) récupéré(s).`,
    });
    // Recharger les prospects
    handleRefresh();
  };

  // Gérer l'échec d'un scraping
  const handleScrapingError = (error) => {
    console.error('[App] Erreur scraping:', error);
    setNotification({
      type: 'error',
      message: error.error || 'Erreur lors du scraping',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header apiStatus={apiStatus} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveView('scraping')}
              className={`${
                activeView === 'scraping'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span>🕷️</span>
              Scraping
            </button>
            <button
              onClick={() => setActiveView('prospects')}
              className={`${
                activeView === 'prospects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span>📋</span>
              Prospects
              {pagination.total > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                  {pagination.total}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('tags')}
              className={`${
                activeView === 'tags'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span>🏷️</span>
              Tags
            </button>
            <button
              onClick={() => setActiveView('google-maps')}
              className={`${
                activeView === 'google-maps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span>🗺️</span>
              Google Maps
            </button>
            <button
              onClick={() => setActiveView('config')}
              className={`${
                activeView === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span>🛡️</span>
              Configuration Anti-Bot
            </button>
          </nav>
        </div>

        {/* Scraping View */}
        {activeView === 'scraping' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulaire de lancement */}
            <div>
              <ScrapingForm onScrapingStarted={handleScrapingStarted} />
            </div>

            {/* Suivi de progression */}
            <div>
              {currentTaskId ? (
                <ProgressTracker
                  taskId={currentTaskId}
                  onComplete={handleScrapingComplete}
                  onError={handleScrapingError}
                />
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    Aucune tâche en cours
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Lancez un scraping pour voir la progression ici
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prospects View */}
        {activeView === 'prospects' && (
          <>
            {/* Statistiques */}
            <ProspectStats />

            {/* Filtres */}
            <ProspectFilters onFilterChange={handleFilterChange} />

            {/* Barre d'actions */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Liste des Prospects
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {pagination.total > 0
                    ? `${pagination.total} prospect${pagination.total > 1 ? "s" : ""} au total`
                    : "Aucun prospect"}
                </p>
              </div>

              <div className="flex gap-2">
                {/* Toggle vue tableau/grille */}
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 text-sm font-medium border ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } rounded-l-md transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 text-sm font-medium border ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } rounded-r-md transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>

                {/* Menu Export */}
                <ExportMenu
                  prospects={prospects}
                  totalCount={pagination.total}
                  filters={filters}
                  sorting={sorting}
                />

                {/* Bouton actualiser */}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Chargement..." : "Actualiser"}
                </button>
              </div>
            </div>

            {/* Liste des prospects */}
            <ProspectList
              prospects={prospects}
              loading={loading}
              error={error}
              viewMode={viewMode}
              onProspectUpdated={handleRefresh}
              sortBy={sorting.sortBy}
              sortOrder={sorting.sortOrder}
              onSortChange={handleSortChange}
            />

            {/* Pagination */}
            {!loading && !error && (
              <Pagination
                total={pagination.total}
                limit={pagination.limit}
                offset={pagination.offset}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}

        {/* Tags Management View */}
        {activeView === 'tags' && (
          <TagManager />
        )}

        {/* Google Maps Configuration View */}
        {activeView === 'google-maps' && (
          <GoogleMapsConfig />
        )}

        {/* Anti-Bot Configuration View */}
        {activeView === 'config' && (
          <AntiBotConfig />
        )}

        {/* Notification */}
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Informations de debug en mode développement */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 bg-gray-100 rounded-md border border-gray-300">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Debug Info (dev mode only)
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>API URL: {import.meta.env.VITE_API_URL}</p>
              <p>API Status: {apiStatus.connected ? "✓ Connected" : "✗ Disconnected"}</p>
              <p>Prospects chargés: {prospects.length}</p>
              <p>Total en DB: {pagination.total}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
