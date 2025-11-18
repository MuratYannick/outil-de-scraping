import Joi from 'joi';

/**
 * Schémas de validation pour les routes prospects
 */

// Validation pour la création d'un prospect
export const createProspectSchema = {
  body: Joi.object({
    nom_entreprise: Joi.string().min(1).max(255).required().messages({
      'string.empty': 'Le nom de l\'entreprise est requis',
      'string.max': 'Le nom de l\'entreprise ne peut pas dépasser 255 caractères',
      'any.required': 'Le nom de l\'entreprise est requis',
    }),
    nom_contact: Joi.string().max(255).allow(null, '').messages({
      'string.max': 'Le nom du contact ne peut pas dépasser 255 caractères',
    }),
    email: Joi.string().email().max(255).allow(null, '').messages({
      'string.email': 'L\'email doit être valide',
      'string.max': 'L\'email ne peut pas dépasser 255 caractères',
    }),
    telephone: Joi.string()
      .max(50)
      .pattern(/^[\d\s\-\+\(\)\.]+$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Le numéro de téléphone contient des caractères invalides',
        'string.max': 'Le téléphone ne peut pas dépasser 50 caractères',
      }),
    adresse: Joi.string().allow(null, '').messages({}),
    url_site: Joi.string().uri().max(255).allow(null, '').messages({
      'string.uri': 'L\'URL du site doit être valide',
      'string.max': 'L\'URL ne peut pas dépasser 255 caractères',
    }),
    source_scraping: Joi.string().max(100).required().messages({
      'string.empty': 'La source de scraping est requise',
      'string.max': 'La source ne peut pas dépasser 100 caractères',
      'any.required': 'La source de scraping est requise',
    }),
  }),
};

// Validation pour la mise à jour d'un prospect
export const updateProspectSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'L\'ID doit être un nombre',
      'number.positive': 'L\'ID doit être positif',
      'any.required': 'L\'ID est requis',
    }),
  }),
  body: Joi.object({
    nom_entreprise: Joi.string().min(1).max(255).messages({
      'string.empty': 'Le nom de l\'entreprise ne peut pas être vide',
      'string.max': 'Le nom de l\'entreprise ne peut pas dépasser 255 caractères',
    }),
    nom_contact: Joi.string().max(255).allow(null, '').messages({
      'string.max': 'Le nom du contact ne peut pas dépasser 255 caractères',
    }),
    email: Joi.string().email().max(255).allow(null, '').messages({
      'string.email': 'L\'email doit être valide',
      'string.max': 'L\'email ne peut pas dépasser 255 caractères',
    }),
    telephone: Joi.string()
      .max(50)
      .pattern(/^[\d\s\-\+\(\)\.]+$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Le numéro de téléphone contient des caractères invalides',
        'string.max': 'Le téléphone ne peut pas dépasser 50 caractères',
      }),
    adresse: Joi.string().allow(null, '').messages({}),
    url_site: Joi.string().uri().max(255).allow(null, '').messages({
      'string.uri': 'L\'URL du site doit être valide',
      'string.max': 'L\'URL ne peut pas dépasser 255 caractères',
    }),
    source_scraping: Joi.string().max(100).messages({
      'string.max': 'La source ne peut pas dépasser 100 caractères',
    }),
  }).min(1), // Au moins un champ doit être fourni
};

// Validation pour récupérer un prospect par ID
export const getProspectByIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'L\'ID doit être un nombre',
      'number.positive': 'L\'ID doit être positif',
      'any.required': 'L\'ID est requis',
    }),
  }),
};

// Validation pour supprimer un prospect
export const deleteProspectSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'L\'ID doit être un nombre',
      'number.positive': 'L\'ID doit être positif',
      'any.required': 'L\'ID est requis',
    }),
  }),
};

// Validation pour la récupération de tous les prospects (avec filtres)
export const getAllProspectsSchema = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      'number.base': 'La limite doit être un nombre',
      'number.min': 'La limite doit être au moins 1',
      'number.max': 'La limite ne peut pas dépasser 100',
    }),
    offset: Joi.number().integer().min(0).default(0).messages({
      'number.base': 'L\'offset doit être un nombre',
      'number.min': 'L\'offset ne peut pas être négatif',
    }),
    source: Joi.string().max(100).allow('').messages({
      'string.max': 'La source ne peut pas dépasser 100 caractères',
    }),
    tag: Joi.string().max(100).allow('').messages({
      'string.max': 'Le tag ne peut pas dépasser 100 caractères',
    }),
    search: Joi.string().max(255).allow('').messages({
      'string.max': 'La recherche ne peut pas dépasser 255 caractères',
    }),
  }),
};

// Validation pour ajouter un tag à un prospect
export const addTagToProspectSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'L\'ID du prospect doit être un nombre',
      'number.positive': 'L\'ID du prospect doit être positif',
      'any.required': 'L\'ID du prospect est requis',
    }),
  }),
  body: Joi.object({
    tag_id: Joi.number().integer().positive().required().messages({
      'number.base': 'L\'ID du tag doit être un nombre',
      'number.positive': 'L\'ID du tag doit être positif',
      'any.required': 'L\'ID du tag est requis',
    }),
  }),
};

// Validation pour retirer un tag d'un prospect
export const removeTagFromProspectSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'L\'ID du prospect doit être un nombre',
      'number.positive': 'L\'ID du prospect doit être positif',
      'any.required': 'L\'ID du prospect est requis',
    }),
    tag_id: Joi.number().integer().positive().required().messages({
      'number.base': 'L\'ID du tag doit être un nombre',
      'number.positive': 'L\'ID du tag doit être positif',
      'any.required': 'L\'ID du tag est requis',
    }),
  }),
};
