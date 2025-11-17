import { useState } from 'react';
import { lancerScraping } from '../services/api';

/**
 * Composant formulaire de lancement de scraping
 * Permet de configurer et lancer une tâche de scraping
 */
export default function ScrapingForm({ onScrapingStarted }) {
  const [formData, setFormData] = useState({
    keyword: '',
    location: '',
    source: 'Pages Jaunes',
    maxPages: 1,
    maxResults: 10,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Gérer les changements de champs
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  /**
   * Valider le formulaire
   */
  const validate = () => {
    const newErrors = {};

    if (!formData.keyword.trim()) {
      newErrors.keyword = 'Le mot-clé est requis';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La localisation est requise';
    }

    if (formData.maxPages < 1 || formData.maxPages > 10) {
      newErrors.maxPages = 'Entre 1 et 10 pages maximum';
    }

    if (formData.maxResults < 1 || formData.maxResults > 100) {
      newErrors.maxResults = 'Entre 1 et 100 résultats maximum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Soumettre le formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await lancerScraping({
        keyword: formData.keyword.trim(),
        location: formData.location.trim(),
        source: formData.source,
        maxPages: parseInt(formData.maxPages),
        maxResults: parseInt(formData.maxResults),
      });

      console.log('[ScrapingForm] Scraping lancé:', result);

      // Notifier le composant parent
      if (onScrapingStarted) {
        onScrapingStarted(result);
      }

      // Réinitialiser le formulaire (optionnel)
      // setFormData({
      //   keyword: '',
      //   location: '',
      //   source: 'Pages Jaunes',
      //   maxPages: 1,
      //   maxResults: 10,
      // });

    } catch (error) {
      console.error('[ScrapingForm] Erreur:', error);
      setErrors({
        submit: error.response?.data?.message || 'Erreur lors du lancement du scraping',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Lancer un Scraping</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Keyword */}
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
            Mot-clé *
          </label>
          <input
            type="text"
            id="keyword"
            name="keyword"
            value={formData.keyword}
            onChange={handleChange}
            placeholder="Ex: plombier, restaurant..."
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.keyword ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.keyword && (
            <p className="mt-1 text-sm text-red-600">{errors.keyword}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Localisation *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Ex: Lyon, Paris, Marseille..."
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location}</p>
          )}
        </div>

        {/* Source */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="Pages Jaunes">Pages Jaunes</option>
            <option value="Google Maps" disabled>Google Maps (bientôt)</option>
            <option value="LinkedIn" disabled>LinkedIn (bientôt)</option>
          </select>
        </div>

        {/* Options avancées */}
        <div className="grid grid-cols-2 gap-4">
          {/* Max Pages */}
          <div>
            <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700 mb-1">
              Pages max
            </label>
            <input
              type="number"
              id="maxPages"
              name="maxPages"
              value={formData.maxPages}
              onChange={handleChange}
              min="1"
              max="10"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxPages ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.maxPages && (
              <p className="mt-1 text-sm text-red-600">{errors.maxPages}</p>
            )}
          </div>

          {/* Max Results */}
          <div>
            <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-1">
              Résultats max
            </label>
            <input
              type="number"
              id="maxResults"
              name="maxResults"
              value={formData.maxResults}
              onChange={handleChange}
              min="1"
              max="100"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxResults ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.maxResults && (
              <p className="mt-1 text-sm text-red-600">{errors.maxResults}</p>
            )}
          </div>
        </div>

        {/* Erreur globale */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Bouton Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
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
              Lancement en cours...
            </span>
          ) : (
            'Lancer le scraping'
          )}
        </button>
      </form>

      {/* Info */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> Le scraping s'exécutera en arrière-plan. Vous pourrez suivre la progression en temps réel.
        </p>
      </div>
    </div>
  );
}
