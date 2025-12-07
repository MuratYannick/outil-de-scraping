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
    telephone_2: Joi.string()
      .max(50)
      .pattern(/^[\d\s\-\+\(\)\.]+$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Le numéro de téléphone 2 contient des caractères invalides',
        'string.max': 'Le téléphone 2 ne peut pas dépasser 50 caractères',
      }),
    telephone_3: Joi.string()
      .max(50)
      .pattern(/^[\d\s\-\+\(\)\.]+$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Le numéro de téléphone 3 contient des caractères invalides',
        'string.max': 'Le téléphone 3 ne peut pas dépasser 50 caractères',
      }),
    adresse: Joi.string().allow(null, '').messages({}),
    code_postal: Joi.string().max(20).allow(null, '').messages({
      'string.max': 'Le code postal ne peut pas dépasser 20 caractères',
    }),
    ville: Joi.string().max(100).allow(null, '').messages({
      'string.max': 'La ville ne peut pas dépasser 100 caractères',
    }),
    url_site: Joi.string().uri().max(255).allow(null, '').messages({
      'string.uri': 'L\'URL du site doit être valide',
      'string.max': 'L\'URL ne peut pas dépasser 255 caractères',
    }),
    note: Joi.number().min(0).max(5).allow(null).messages({
      'number.base': 'La note doit être un nombre',
      'number.min': 'La note doit être au minimum 0',
      'number.max': 'La note doit être au maximum 5',
    }),
    latitude: Joi.number().min(-90).max(90).allow(null).messages({
      'number.base': 'La latitude doit être un nombre',
      'number.min': 'La latitude doit être au minimum -90',
      'number.max': 'La latitude doit être au maximum 90',
    }),
    longitude: Joi.number().min(-180).max(180).allow(null).messages({
      'number.base': 'La longitude doit être un nombre',
      'number.min': 'La longitude doit être au minimum -180',
      'number.max': 'La longitude doit être au maximum 180',
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
    telephone_2: Joi.string()
      .max(50)
      .pattern(/^[\d\s\-\+\(\)\.]+$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Le numéro de téléphone 2 contient des caractères invalides',
        'string.max': 'Le téléphone 2 ne peut pas dépasser 50 caractères',
      }),
    telephone_3: Joi.string()
      .max(50)
      .pattern(/^[\d\s\-\+\(\)\.]+$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': 'Le numéro de téléphone 3 contient des caractères invalides',
        'string.max': 'Le téléphone 3 ne peut pas dépasser 50 caractères',
      }),
    adresse: Joi.string().allow(null, '').messages({}),
    code_postal: Joi.string().max(20).allow(null, '').messages({
      'string.max': 'Le code postal ne peut pas dépasser 20 caractères',
    }),
    ville: Joi.string().max(100).allow(null, '').messages({
      'string.max': 'La ville ne peut pas dépasser 100 caractères',
    }),
    url_site: Joi.string().uri().max(255).allow(null, '').messages({
      'string.uri': 'L\'URL du site doit être valide',
      'string.max': 'L\'URL ne peut pas dépasser 255 caractères',
    }),
    note: Joi.number().min(0).max(5).allow(null).messages({
      'number.base': 'La note doit être un nombre',
      'number.min': 'La note doit être au minimum 0',
      'number.max': 'La note doit être au maximum 5',
    }),
    latitude: Joi.number().min(-90).max(90).allow(null).messages({
      'number.base': 'La latitude doit être un nombre',
      'number.min': 'La latitude doit être au minimum -90',
      'number.max': 'La latitude doit être au maximum 90',
    }),
    longitude: Joi.number().min(-180).max(180).allow(null).messages({
      'number.base': 'La longitude doit être un nombre',
      'number.min': 'La longitude doit être au minimum -180',
      'number.max': 'La longitude doit être au maximum 180',
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
    limit: Joi.number().integer().min(1).max(10000).default(20).messages({
      'number.base': 'La limite doit être un nombre',
      'number.min': 'La limite doit être au moins 1',
      'number.max': 'La limite ne peut pas dépasser 10000',
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
    sortBy: Joi.string().valid('nom_entreprise', 'ville', 'code_postal').allow('').messages({
      'any.only': 'Le tri doit être sur nom_entreprise, ville ou code_postal',
    }),
    sortOrder: Joi.string().valid('ASC', 'DESC').allow('').messages({
      'any.only': 'L\'ordre de tri doit être ASC ou DESC',
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
