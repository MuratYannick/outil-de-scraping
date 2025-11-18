import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Composant de configuration Google Maps
 * Permet de choisir entre le scraper Playwright et l'API Google Places
 */
const GoogleMapsConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Charger la configuration au montage
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/google-maps/config`);
      setConfig(response.data.config);
    } catch (error) {
      console.error('Erreur chargement config:', error);
      setMessage({
        type: 'error',
        text: 'Impossible de charger la configuration',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStrategyChange = async (newStrategy) => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await axios.put(`${API_BASE_URL}/google-maps/config`, {
        strategy: newStrategy,
      });

      setConfig(response.data.config);
      setMessage({
        type: 'success',
        text: `Stratégie changée: ${newStrategy === 'api' ? 'API Google Places' : 'Scraper Playwright'}`,
      });
    } catch (error) {
      console.error('Erreur changement stratégie:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Erreur lors du changement de stratégie',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setMessage(null);
      setTestResult(null);

      const response = await axios.post(`${API_BASE_URL}/google-maps/test`);

      setTestResult(response.data.results);
      setMessage({
        type: 'success',
        text: response.data.message,
      });
    } catch (error) {
      console.error('Erreur test:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Erreur lors du test',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Configuration Google Maps
      </h2>

      <p className="text-gray-600 text-sm mb-6">
        Choisissez la méthode d'extraction pour Google Maps. Vous pouvez utiliser
        le scraper Playwright (gratuit) ou l'API Google Places (payant mais fiable).
      </p>

      {/* Notification */}
      {message && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Options de stratégie */}
      <div className="space-y-4 mb-6">
        {/* Option 1: Scraper Playwright */}
        <label
          className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            config?.strategy === 'scraper'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start">
            <input
              type="radio"
              name="strategy"
              value="scraper"
              checked={config?.strategy === 'scraper'}
              onChange={() => handleStrategyChange('scraper')}
              disabled={saving}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900">
                  Scraper Playwright
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  GRATUIT
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Utilise Playwright pour scraper Google Maps directement
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>Gratuit et flexible</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>Utilise vos stratégies anti-bot configurées</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-600">✗</span>
                  <span>Risque de blocage par Google (nécessite proxies)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-600">✗</span>
                  <span>Extraction limitée (nom, adresse seulement)</span>
                </div>
              </div>
              {config?.strategy === 'scraper' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    <strong>Recommandation:</strong> Activez les proxies résidentiels
                    ou le CAPTCHA solver pour éviter les blocages Google.
                  </p>
                </div>
              )}
            </div>
          </div>
        </label>

        {/* Option 2: API Google Places */}
        <label
          className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            config?.strategy === 'api'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start">
            <input
              type="radio"
              name="strategy"
              value="api"
              checked={config?.strategy === 'api'}
              onChange={() => handleStrategyChange('api')}
              disabled={saving}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900">
                  API Google Places
                </span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  PAYANT
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Utilise l'API officielle Google Places pour extraire les données
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>Fiable et stable (aucun risque de blocage)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>Données complètes (nom, adresse, téléphone, site web)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>Géolocalisation précise (latitude/longitude)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-600">✗</span>
                  <span>Coût: ~$17/1000 requêtes + $3-5/1000 (contact)</span>
                </div>
              </div>
              {config?.strategy === 'api' && (
                <div className="mt-3 space-y-2">
                  {config.apiKeyConfigured ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-800">
                        ✓ API Key configurée
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-800 mb-2">
                        <strong>API Key manquante:</strong> Ajoutez votre clé API Google Places dans le fichier <code className="bg-red-100 px-1 py-0.5 rounded">.env</code>
                      </p>
                      <p className="text-xs text-red-700">
                        <code className="bg-red-100 px-1 py-0.5 rounded">
                          GOOGLE_PLACES_API_KEY=votre_cle_api
                        </code>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </label>
      </div>

      {/* Bouton de test */}
      <div className="flex gap-3">
        <button
          onClick={handleTest}
          disabled={testing || !config}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {testing ? 'Test en cours...' : 'Tester la configuration'}
        </button>

        {config?.strategy === 'api' && !config.apiKeyConfigured && (
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/get-api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Obtenir une clé API
          </a>
        )}
      </div>

      {/* Résultat du test */}
      {testResult && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Résultat du test</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Stratégie utilisée:</span>
              <span className="font-medium">
                {testResult.strategy === 'api' ? 'API Google Places' : 'Scraper Playwright'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Prospects trouvés:</span>
              <span className="font-medium text-green-600">
                {testResult.prospectsFound}
              </span>
            </div>
          </div>

          {testResult.sample && testResult.sample.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Exemples extraits:
              </h4>
              <div className="space-y-2">
                {testResult.sample.map((prospect, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white border border-gray-200 rounded text-xs"
                  >
                    <div className="font-medium text-gray-900">
                      {prospect.nom_entreprise}
                    </div>
                    {prospect.adresse && (
                      <div className="text-gray-600 mt-1">{prospect.adresse}</div>
                    )}
                    {prospect.telephone && (
                      <div className="text-gray-600 mt-1">📞 {prospect.telephone}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info anti-bot */}
      {config?.strategy === 'scraper' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            Stratégie anti-bot active
          </h3>
          <p className="text-sm text-blue-800">
            {config.antiBotStrategy === 'none' ? (
              <>Aucune stratégie anti-bot active. Allez dans la configuration anti-bot pour activer les proxies ou le CAPTCHA solver.</>
            ) : (
              <>Stratégie active: <strong>{config.antiBotStrategy}</strong></>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsConfig;
