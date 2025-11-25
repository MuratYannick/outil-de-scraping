import axios from "axios";

// Configuration de base d'Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Intercepteur pour logger les requêtes (dev uniquement)
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error("[API Request Error]", error);
      return Promise.reject(error);
    }
  );
}

// Intercepteur de réponse pour la gestion centralisée des erreurs
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Log l'erreur en mode dev
    if (import.meta.env.DEV) {
      console.error("[API Response Error]", error.response || error);
    }

    // Pas de réponse du serveur (problème réseau, serveur éteint, etc.)
    if (!error.response) {
      const networkError = new Error(
        "Impossible de joindre le serveur. Vérifiez votre connexion internet et que le serveur backend est démarré."
      );
      networkError.code = "NETWORK_ERROR";
      return Promise.reject(networkError);
    }

    // Enrichir l'erreur avec des messages utilisateur-friendly
    const { status, data } = error.response;

    switch (status) {
      case 400:
        error.userMessage = data.message || "Les données fournies sont invalides";
        break;
      case 401:
        error.userMessage = data.message || "Vous devez être authentifié pour accéder à cette ressource";
        break;
      case 403:
        error.userMessage = data.message || "Vous n'avez pas les permissions nécessaires";
        break;
      case 404:
        error.userMessage = data.message || "La ressource demandée n'existe pas";
        break;
      case 409:
        error.userMessage = data.message || "Cette ressource existe déjà";
        break;
      case 422:
        error.userMessage = data.message || "Les données ne peuvent pas être traitées";
        break;
      case 500:
      case 502:
      case 503:
        error.userMessage = "Une erreur serveur est survenue. Veuillez réessayer plus tard.";
        // Optionnel : rediriger vers la page d'erreur 500
        // window.location.href = '/error/500';
        break;
      default:
        error.userMessage = data.message || "Une erreur inattendue est survenue";
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Services Prospects
// ============================================================================

/**
 * Récupérer tous les prospects avec pagination et filtres
 * @param {Object} params - Paramètres de requête { limit, offset, source, tag }
 * @returns {Promise}
 */
export const getProspects = async (params = {}) => {
  const response = await api.get("/prospects", { params });
  return response.data;
};

/**
 * Récupérer un prospect par ID
 * @param {number} id - ID du prospect
 * @returns {Promise}
 */
export const getProspectById = async (id) => {
  const response = await api.get(`/prospects/${id}`);
  return response.data;
};

/**
 * Créer un nouveau prospect
 * @param {Object} prospectData - Données du prospect
 * @returns {Promise}
 */
export const createProspect = async (prospectData) => {
  const response = await api.post("/prospects", prospectData);
  return response.data;
};

/**
 * Mettre à jour un prospect
 * @param {number} id - ID du prospect
 * @param {Object} prospectData - Données à mettre à jour
 * @returns {Promise}
 */
export const updateProspect = async (id, prospectData) => {
  const response = await api.put(`/prospects/${id}`, prospectData);
  return response.data;
};

/**
 * Supprimer un prospect
 * @param {number} id - ID du prospect
 * @returns {Promise}
 */
export const deleteProspect = async (id) => {
  const response = await api.delete(`/prospects/${id}`);
  return response.data;
};

/**
 * Ajouter un tag à un prospect
 * @param {number} prospectId - ID du prospect
 * @param {number} tagId - ID du tag
 * @returns {Promise}
 */
export const addTagToProspect = async (prospectId, tagId) => {
  const response = await api.post(`/prospects/${prospectId}/tags`, {
    tag_id: tagId,
  });
  return response.data;
};

/**
 * Retirer un tag d'un prospect
 * @param {number} prospectId - ID du prospect
 * @param {number} tagId - ID du tag
 * @returns {Promise}
 */
export const removeTagFromProspect = async (prospectId, tagId) => {
  const response = await api.delete(`/prospects/${prospectId}/tags/${tagId}`);
  return response.data;
};

// ============================================================================
// Services Tags
// ============================================================================

/**
 * Récupérer tous les tags
 * @returns {Promise}
 */
export const getTags = async () => {
  const response = await api.get("/tags");
  return response.data;
};

/**
 * Récupérer un tag par ID
 * @param {number} id - ID du tag
 * @returns {Promise}
 */
export const getTagById = async (id) => {
  const response = await api.get(`/tags/${id}`);
  return response.data;
};

/**
 * Créer un nouveau tag
 * @param {string} nom - Nom du tag
 * @returns {Promise}
 */
export const createTag = async (nom) => {
  const response = await api.post("/tags", { nom });
  return response.data;
};

/**
 * Mettre à jour un tag
 * @param {number} id - ID du tag
 * @param {string} nom - Nouveau nom du tag
 * @returns {Promise}
 */
export const updateTag = async (id, nom) => {
  const response = await api.put(`/tags/${id}`, { nom });
  return response.data;
};

/**
 * Supprimer un tag
 * @param {number} id - ID du tag
 * @returns {Promise}
 */
export const deleteTag = async (id) => {
  const response = await api.delete(`/tags/${id}`);
  return response.data;
};

// ============================================================================
// Services Anti-Bot Configuration
// ============================================================================

/**
 * Récupérer la configuration anti-bot d'un scraper spécifique
 * @param {string} scraperId - ID du scraper ('pagesJaunes', 'googleMaps', 'linkedin')
 * @returns {Promise}
 */
export const getAntiBotConfig = async (scraperId) => {
  const response = await api.get(`/antibot/config/${scraperId}`);
  return response.data;
};

/**
 * Récupérer la configuration de TOUS les scrapers
 * @returns {Promise}
 */
export const getAllAntiBotConfigs = async () => {
  const response = await api.get("/antibot/config");
  return response.data;
};

/**
 * Sauvegarder la configuration anti-bot d'un scraper spécifique
 * @param {string} scraperId - ID du scraper
 * @param {Object} config - Configuration à sauvegarder
 * @returns {Promise}
 */
export const saveAntiBotConfig = async (scraperId, config) => {
  const response = await api.put(`/antibot/config/${scraperId}`, config);
  return response.data;
};

/**
 * Tester la configuration anti-bot d'un scraper spécifique
 * @param {string} scraperId - ID du scraper
 * @returns {Promise}
 */
export const testAntiBotConfig = async (scraperId) => {
  // Timeout augmenté à 120s pour les tests de scraping (lancent un navigateur + rate limiting)
  const response = await api.post(`/antibot/test/${scraperId}`, {}, {
    timeout: 120000 // 120 secondes
  });
  return response.data;
};

/**
 * Récupérer le statut des stratégies anti-bot
 * @returns {Promise}
 */
export const getAntiBotStatus = async () => {
  const response = await api.get("/antibot/status");
  return response.data;
};

// ============================================================================
// Services Scraping
// ============================================================================

/**
 * Lancer une tâche de scraping
 * @param {Object} scrapingParams - Paramètres { keyword, location, source?, maxPages?, maxResults? }
 * @returns {Promise}
 */
export const lancerScraping = async (scrapingParams) => {
  // Timeout augmenté à 60s pour les lancements de scraping
  const response = await api.post("/scraping/lancer", scrapingParams, {
    timeout: 60000 // 60 secondes
  });
  return response.data;
};

/**
 * Récupérer le statut d'une tâche de scraping
 * @param {string} taskId - ID de la tâche
 * @returns {Promise}
 */
export const getScrapingStatus = async (taskId) => {
  const response = await api.get(`/scraping/status/${taskId}`);
  return response.data;
};

/**
 * Annuler une tâche de scraping
 * @param {string} taskId - ID de la tâche
 * @returns {Promise}
 */
export const cancelScraping = async (taskId) => {
  const response = await api.post(`/scraping/cancel/${taskId}`);
  return response.data;
};

/**
 * Récupérer toutes les tâches de scraping
 * @param {Object} params - Paramètres { status?, limit? }
 * @returns {Promise}
 */
export const getScrapingTasks = async (params = {}) => {
  const response = await api.get("/scraping/tasks", { params });
  return response.data;
};

/**
 * Récupérer les statistiques du gestionnaire de tâches
 * @returns {Promise}
 */
export const getScrapingStats = async () => {
  const response = await api.get("/scraping/stats");
  return response.data;
};

// ============================================================================
// Services Health & Info
// ============================================================================

/**
 * Vérifier le statut du serveur
 * @returns {Promise}
 */
export const checkHealth = async () => {
  const response = await api.get("/health", { baseURL: API_BASE_URL.replace("/api", "") });
  return response.data;
};

/**
 * Récupérer les informations de l'API
 * @returns {Promise}
 */
export const getApiInfo = async () => {
  const response = await api.get("/", { baseURL: API_BASE_URL });
  return response.data;
};

export default api;
