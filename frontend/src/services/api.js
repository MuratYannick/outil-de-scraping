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

  api.interceptors.response.use(
    (response) => {
      console.log(`[API Response] ${response.config.url}`, response.data);
      return response;
    },
    (error) => {
      console.error("[API Response Error]", error.response || error);
      return Promise.reject(error);
    }
  );
}

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
