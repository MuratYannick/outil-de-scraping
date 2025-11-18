import Joi from 'joi';

/**
 * Schémas de validation pour les routes tags
 */

// Validation pour la création d'un tag
export const createTagSchema = {
  body: Joi.object({
    nom: Joi.string().min(1).max(100).required().messages({
      'string.empty': 'Le nom du tag est requis',
      'string.max': 'Le nom du tag ne peut pas dépasser 100 caractères',
      'any.required': 'Le nom du tag est requis',
    }),
  }),
};

// Validation pour la mise à jour d'un tag
export const updateTagSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'L\'ID doit être un nombre',
      'number.positive': 'L\'ID doit être positif',
      'any.required': 'L\'ID est requis',
    }),
  }),
  body: Joi.object({
    nom: Joi.string().min(1).max(100).required().messages({
      'string.empty': 'Le nom du tag est requis',
      'string.max': 'Le nom du tag ne peut pas dépasser 100 caractères',
      'any.required': 'Le nom du tag est requis',
    }),
  }),
};

// Validation pour récupérer un tag par ID
export const getTagByIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'L\'ID doit être un nombre',
      'number.positive': 'L\'ID doit être positif',
      'any.required': 'L\'ID est requis',
    }),
  }),
};

// Validation pour supprimer un tag
export const deleteTagSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'L\'ID doit être un nombre',
      'number.positive': 'L\'ID doit être positif',
      'any.required': 'L\'ID est requis',
    }),
  }),
};
