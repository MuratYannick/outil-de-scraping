import React, { useState, useEffect } from 'react';
import { getAntiBotConfig, saveAntiBotConfig, testAntiBotConfig } from '../services/api';

export default function AntiBotConfig() {
  const [activeTab, setActiveTab] = useState('overview');
  const [config, setConfig] = useState({
    strategy: 'none',
    proxies: {
      enabled: false,
      provider: 'custom',
      proxyList: '',
      rotation: 'round-robin'
    },
    captcha: {
      enabled: false,
      provider: '2captcha',
      apiKey: ''
    },
    stealth: {
      enabled: false,
      browserProfilePath: './browser-profiles/default',
      humanBehavior: true
    }
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState(null);

  // Charger la configuration au montage du composant
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAntiBotConfig();
      if (response.success) {
        setConfig(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement config:', err);
      setError('Impossible de charger la configuration');
    } finally {
      setLoading(false);
    }
  };

  const strategies = [
    { id: 'none', name: 'Aucune Protection', cost: 'Gratuit', efficacy: 'Bloqué', icon: '⚠️' },
    { id: 'proxies', name: 'Proxies Résidentiels', cost: '$75-$1000/mois', efficacy: 'À tester', icon: '🌐' },
    { id: 'captcha_solver', name: 'CAPTCHA + Stealth', cost: '$0.15-$3/1000p', efficacy: 'À tester', icon: '🔐', recommended: true },
    { id: 'stealth', name: 'Stealth Seul', cost: 'Gratuit', efficacy: 'Insuffisant', icon: '🥷', disabled: true },
    { id: 'hybrid', name: 'Mode HYBRID', cost: '$75-$1003/mois', efficacy: 'Maximum', icon: '🚀' }
  ];

  const handleStrategyChange = (strategyId) => {
    const newConfig = { ...config, strategy: strategyId };

    // Auto-enable related services based on strategy
    switch (strategyId) {
      case 'proxies':
        newConfig.proxies.enabled = true;
        newConfig.captcha.enabled = false;
        newConfig.stealth.enabled = false;
        break;
      case 'captcha_solver':
        newConfig.proxies.enabled = false;
        newConfig.captcha.enabled = true;
        newConfig.stealth.enabled = true; // Always combine with stealth
        break;
      case 'stealth':
        newConfig.proxies.enabled = false;
        newConfig.captcha.enabled = false;
        newConfig.stealth.enabled = true;
        break;
      case 'hybrid':
        newConfig.proxies.enabled = true;
        newConfig.captcha.enabled = true;
        newConfig.stealth.enabled = true;
        break;
      case 'none':
      default:
        newConfig.proxies.enabled = false;
        newConfig.captcha.enabled = false;
        newConfig.stealth.enabled = false;
    }

    setConfig(newConfig);
  };

  const handleSave = async () => {
    try {
      setError(null);
      const response = await saveAntiBotConfig(config);
      if (response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        console.log('Configuration sauvegardée:', response.message);
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError('Erreur lors de la sauvegarde de la configuration');
    }
  };

  const handleTest = async () => {
    try {
      setTestResults({ loading: true });
      setError(null);

      const response = await testAntiBotConfig();

      if (response.success) {
        setTestResults({
          success: response.data.testSuccess,
          blocked: response.data.blocked,
          message: response.data.message,
          prospectsExtracted: response.data.prospectsExtracted,
          prospects: response.data.prospects,
          metadata: response.data.metadata
        });
      }
    } catch (err) {
      console.error('Erreur test:', err);
      setTestResults({
        success: false,
        blocked: true,
        message: `Erreur lors du test: ${err.message}`,
        prospectsExtracted: 0
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement de la configuration...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-900">Configuration Anti-Bot</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configurez les stratégies de contournement pour Pages Jaunes
        </p>
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px px-6">
          {[
            { id: 'overview', name: 'Vue d\'ensemble', icon: '📊' },
            { id: 'proxies', name: 'Proxies', icon: '🌐' },
            { id: 'captcha', name: 'CAPTCHA', icon: '🔐' },
            { id: 'stealth', name: 'Stealth', icon: '🥷' },
            { id: 'test', name: 'Tests', icon: '🧪' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm transition-colors`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choisir une Stratégie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategies.map(strategy => (
                  <div
                    key={strategy.id}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      strategy.disabled
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        : config.strategy === strategy.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => !strategy.disabled && handleStrategyChange(strategy.id)}
                  >
                    {strategy.recommended && (
                      <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                        ⭐ Recommandé
                      </span>
                    )}
                    {strategy.disabled && (
                      <span className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
                        ❌ Non viable
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{strategy.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{strategy.name}</h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>💰 Coût: {strategy.cost}</p>
                          <p>📊 Efficacité: {strategy.efficacy}</p>
                        </div>
                      </div>
                      {config.strategy === strategy.id && !strategy.disabled && (
                        <div className="text-blue-500">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Strategy Summary */}
            {config.strategy !== 'none' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Configuration Actuelle</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>✓ Stratégie: <strong>{strategies.find(s => s.id === config.strategy)?.name}</strong></p>
                  {config.proxies.enabled && <p>✓ Proxies résidentiels activés</p>}
                  {config.captcha.enabled && <p>✓ Résolution CAPTCHA activée</p>}
                  {config.stealth.enabled && <p>✓ Stealth Mode activé</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Proxies Tab */}
        {activeTab === 'proxies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Configuration des Proxies</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">Activé</span>
                <input
                  type="checkbox"
                  checked={config.proxies.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    proxies: { ...config.proxies, enabled: e.target.checked }
                  })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <select
                  value={config.proxies.provider}
                  onChange={(e) => setConfig({
                    ...config,
                    proxies: { ...config.proxies, provider: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!config.proxies.enabled}
                >
                  <option value="brightdata">BrightData ($500-$1000/mois)</option>
                  <option value="oxylabs">Oxylabs ($300-$600/mois)</option>
                  <option value="smartproxy">SmartProxy ($75-$200/mois)</option>
                  <option value="custom">Liste Personnalisée</option>
                </select>
              </div>

              {config.proxies.provider === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Liste de Proxies (un par ligne)
                  </label>
                  <textarea
                    value={config.proxies.proxyList}
                    onChange={(e) => setConfig({
                      ...config,
                      proxies: { ...config.proxies, proxyList: e.target.value }
                    })}
                    placeholder="http://user:pass@proxy1.com:8080&#10;http://user:pass@proxy2.com:8080"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    disabled={!config.proxies.enabled}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rotation</label>
                <select
                  value={config.proxies.rotation}
                  onChange={(e) => setConfig({
                    ...config,
                    proxies: { ...config.proxies, rotation: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!config.proxies.enabled}
                >
                  <option value="round-robin">Round-robin (séquentiel)</option>
                  <option value="random">Aléatoire</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* CAPTCHA Tab */}
        {activeTab === 'captcha' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Configuration CAPTCHA Solver</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">Activé</span>
                <input
                  type="checkbox"
                  checked={config.captcha.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    captcha: { ...config.captcha, enabled: e.target.checked }
                  })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                💡 <strong>Recommandation:</strong> CAPTCHA Solver fonctionne mieux en combinaison avec Stealth Mode.
                {!config.stealth.enabled && ' Stealth est actuellement désactivé.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <select
                  value={config.captcha.provider}
                  onChange={(e) => setConfig({
                    ...config,
                    captcha: { ...config.captcha, provider: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!config.captcha.enabled}
                >
                  <option value="2captcha">2Captcha ($2.99/1000)</option>
                  <option value="anticaptcha">Anti-Captcha ($2.00/1000)</option>
                  <option value="capmonster">CapMonster ($1.50/1000)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <input
                  type="password"
                  value={config.captcha.apiKey}
                  onChange={(e) => setConfig({
                    ...config,
                    captcha: { ...config.captcha, apiKey: e.target.value }
                  })}
                  placeholder="Entrez votre clé API"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!config.captcha.enabled}
                />
              </div>
            </div>
          </div>
        )}

        {/* Stealth Tab */}
        {activeTab === 'stealth' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Configuration Stealth Mode</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">Activé</span>
                <input
                  type="checkbox"
                  checked={config.stealth.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    stealth: { ...config.stealth, enabled: e.target.checked }
                  })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                ⚠️ <strong>Tests confirmés:</strong> Stealth Mode seul est insuffisant contre Pages Jaunes.
                Il DOIT être combiné avec Proxies ou CAPTCHA Solver.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chemin du profil navigateur
                </label>
                <input
                  type="text"
                  value={config.stealth.browserProfilePath}
                  onChange={(e) => setConfig({
                    ...config,
                    stealth: { ...config.stealth, browserProfilePath: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!config.stealth.enabled}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.stealth.humanBehavior}
                    onChange={(e) => setConfig({
                      ...config,
                      stealth: { ...config.stealth, humanBehavior: e.target.checked }
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    disabled={!config.stealth.enabled}
                  />
                  <span className="text-sm text-gray-700">
                    Activer les comportements humains (scroll, delays, mouvements souris)
                  </span>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Fonctionnalités Stealth</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Masquage de 14 indicateurs d'automatisation</li>
                  <li>✓ Canvas et WebGL fingerprinting protégés</li>
                  <li>✓ User-Agent et viewport aléatoires</li>
                  <li>✓ Headers HTTP réalistes (sec-ch-ua, etc.)</li>
                  <li>✓ Profil navigateur persistant (cookies, localStorage)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Tester la Configuration</h3>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Configuration Actuelle</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Stratégie: <strong>{strategies.find(s => s.id === config.strategy)?.name}</strong></p>
                <p>Proxies: {config.proxies.enabled ? '✅ Activé' : '❌ Désactivé'}</p>
                <p>CAPTCHA: {config.captcha.enabled ? '✅ Activé' : '❌ Désactivé'}</p>
                <p>Stealth: {config.stealth.enabled ? '✅ Activé' : '❌ Désactivé'}</p>
              </div>
            </div>

            <button
              onClick={handleTest}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              🧪 Lancer un test sur Pages Jaunes
            </button>

            {testResults && (
              <div className={`border rounded-lg p-4 ${
                testResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h4 className="font-medium mb-2">
                  {testResults.success ? '✅ Résultats du test' : '❌ Échec du test'}
                </h4>
                <p className="text-sm">{testResults.message}</p>
                {testResults.prospectsExtracted !== undefined && (
                  <p className="text-sm mt-1">
                    Prospects extraits: <strong>{testResults.prospectsExtracted}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {saved && <span className="text-green-600 font-medium">✓ Configuration sauvegardée</span>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setConfig({
              strategy: 'none',
              proxies: { enabled: false, provider: 'custom', proxyList: '', rotation: 'round-robin' },
              captcha: { enabled: false, provider: '2captcha', apiKey: '' },
              stealth: { enabled: false, browserProfilePath: './browser-profiles/default', humanBehavior: true }
            })}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            💾 Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
