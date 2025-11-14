import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ProspectList from "./components/ProspectList";
import AntiBotConfig from "./components/AntiBotConfig";
import { getProspects, checkHealth } from "./services/api";

export default function App() {
  const [activeView, setActiveView] = useState('prospects'); // 'prospects' or 'config'
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState({ connected: false });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
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

  // Charger les prospects au chargement
  useEffect(() => {
    const loadProspects = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getProspects({
          limit: pagination.limit,
          offset: pagination.offset,
        });

        setProspects(data.data || []);
        setPagination({
          total: data.total || 0,
          limit: data.limit || 20,
          offset: data.offset || 0,
        });
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
  }, [pagination.limit, pagination.offset]);

  // Fonction pour recharger les prospects
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getProspects({
        limit: pagination.limit,
        offset: 0,
      });

      setProspects(data.data || []);
      setPagination({
        total: data.total || 0,
        limit: data.limit || 20,
        offset: 0,
      });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header apiStatus={apiStatus} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
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

        {/* Prospects View */}
        {activeView === 'prospects' && (
          <>
            {/* Barre d'actions */}
            <div className="mb-6 flex justify-between items-center">
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
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Chargement..." : "Actualiser"}
              </button>
            </div>

            {/* Liste des prospects */}
            <ProspectList
              prospects={prospects}
              loading={loading}
              error={error}
            />
          </>
        )}

        {/* Anti-Bot Configuration View */}
        {activeView === 'config' && (
          <AntiBotConfig />
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
