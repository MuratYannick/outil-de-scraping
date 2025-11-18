import Joi from 'joi';

/**
 * Schémas de validation pour les routes scraping
 */

// Validation pour lancer un scraping
export const lancerScrapingSchema = {
  body: Joi.object({
    keyword: Joi.string().min(1).max(255).required().messages({
      'string.empty': 'Le mot-clé de recherche est requis',
      'string.max': 'Le mot-clé ne peut pas dépasser 255 caractères',
      'any.required': 'Le mot-clé de recherche est requis',
    }),
    location: Joi.string().min(1).max(255).required().messages({
      'string.empty': 'La localisation est requise',
      'string.max': 'La localisation ne peut pas dépasser 255 caractères',
      'any.required': 'La localisation est requise',
    }),
    source: Joi.string()
      .valid('Pages Jaunes', 'Google Maps', 'LinkedIn')
      .default('Pages Jaunes')
      .messages({
        'any.only': 'La source doit être "Pages Jaunes", "Google Maps" ou "LinkedIn"',
      }),
    maxPages: Joi.number().integer().min(1).max(10).default(1).messages({
      'number.base': 'Le nombre de pages doit être un nombre',
      'number.min': 'Le nombre de pages doit être au moins 1',
      'number.max': 'Le nombre de pages ne peut pas dépasser 10',
    }),
    maxResults: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Le nombre de résultats doit être un nombre',
      'number.min': 'Le nombre de résultats doit être au moins 1',
      'number.max': 'Le nombre de résultats ne peut pas dépasser 100',
    }),
  }),
};

// Validation pour récupérer le statut d'une tâche
export const getScrapingStatusSchema = {
  params: Joi.object({
    task_id: Joi.string().uuid().required().messages({
      'string.guid': 'L\'ID de la tâche doit être un UUID valide',
      'any.required': 'L\'ID de la tâche est requis',
    }),
  }),
};

// Validation pour annuler une tâche
export const cancelScrapingSchema = {
  params: Joi.object({
    task_id: Joi.string().uuid().required().messages({
      'string.guid': 'L\'ID de la tâche doit être un UUID valide',
      'any.required': 'L\'ID de la tâche est requis',
    }),
  }),
};

// Validation pour récupérer toutes les tâches
export const getAllTasksSchema = {
  query: Joi.object({
    status: Joi.string()
      .valid('pending', 'in_progress', 'completed', 'failed', 'cancelled')
      .allow('')
      .messages({
        'any.only':
          'Le statut doit être "pending", "in_progress", "completed", "failed" ou "cancelled"',
      }),
    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      'number.base': 'La limite doit être un nombre',
      'number.min': 'La limite doit être au moins 1',
      'number.max': 'La limite ne peut pas dépasser 100',
    }),
  }),
};
