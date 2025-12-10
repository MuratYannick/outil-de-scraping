/**
 * Utilitaires de validation pour les formulaires
 * Extrait la logique de validation de ProspectDetailsModal.jsx
 */

/**
 * Patterns regex réutilisables pour validation
 */
export const VALIDATION_PATTERNS = {
  // Email standard RFC 5322 simplifié
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Téléphone français (plusieurs formats acceptés)
  // 01 23 45 67 89, 0123456789, +33 1 23 45 67 89, etc.
  phoneFR: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,

  // URL HTTP/HTTPS
  url: /^https?:\/\/.+/i,

  // Code postal français (5 chiffres)
  postalCodeFR: /^\d{5}$/,
};

/**
 * Messages d'erreur standards
 */
export const VALIDATION_MESSAGES = {
  required: 'Ce champ est obligatoire',
  invalidEmail: 'Adresse email invalide',
  invalidPhone: 'Numéro de téléphone invalide',
  invalidUrl: 'URL invalide (doit commencer par http:// ou https://)',
  invalidPostalCode: 'Code postal invalide (5 chiffres)',
  tooShort: (min) => `Minimum ${min} caractères requis`,
  tooLong: (max) => `Maximum ${max} caractères autorisés`,
};

/**
 * Valide un champ requis
 */
function validateRequired(value, fieldName = 'Ce champ') {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return VALIDATION_MESSAGES.required;
  }
  return null;
}

/**
 * Valide un email
 */
function validateEmail(value) {
  if (!value) return null; // Optionnel si vide

  if (!VALIDATION_PATTERNS.email.test(value)) {
    return VALIDATION_MESSAGES.invalidEmail;
  }

  return null;
}

/**
 * Valide un numéro de téléphone français
 */
function validatePhone(value) {
  if (!value) return null; // Optionnel si vide

  if (!VALIDATION_PATTERNS.phoneFR.test(value)) {
    return VALIDATION_MESSAGES.invalidPhone;
  }

  return null;
}

/**
 * Valide une URL
 */
function validateUrl(value) {
  if (!value) return null; // Optionnel si vide

  if (!VALIDATION_PATTERNS.url.test(value)) {
    return VALIDATION_MESSAGES.invalidUrl;
  }

  return null;
}

/**
 * Valide un code postal français
 */
function validatePostalCode(value) {
  if (!value) return null; // Optionnel si vide

  if (!VALIDATION_PATTERNS.postalCodeFR.test(value)) {
    return VALIDATION_MESSAGES.invalidPostalCode;
  }

  return null;
}

/**
 * Valide la longueur d'une chaîne
 */
function validateLength(value, { min, max } = {}) {
  if (!value) return null;

  const length = value.trim().length;

  if (min && length < min) {
    return VALIDATION_MESSAGES.tooShort(min);
  }

  if (max && length > max) {
    return VALIDATION_MESSAGES.tooLong(max);
  }

  return null;
}

/**
 * Valide un formulaire de prospect complet
 *
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Objet d'erreurs { field: errorMessage } ou {} si valide
 *
 * @example
 * const errors = validateProspectForm(formData);
 * if (Object.keys(errors).length > 0) {
 *   setErrors(errors);
 *   return;
 * }
 */
export function validateProspectForm(formData) {
  const errors = {};

  // Nom entreprise (obligatoire)
  const nomError = validateRequired(formData.nom_entreprise, 'Le nom de l\'entreprise');
  if (nomError) {
    errors.nom_entreprise = nomError;
  }

  // Email (optionnel mais doit être valide)
  const emailError = validateEmail(formData.email);
  if (emailError) {
    errors.email = emailError;
  }

  // Téléphone (optionnel mais doit être valide)
  const phoneError = validatePhone(formData.telephone);
  if (phoneError) {
    errors.telephone = phoneError;
  }

  // URL site (optionnel mais doit être valide)
  const urlError = validateUrl(formData.url_site);
  if (urlError) {
    errors.url_site = urlError;
  }

  // Code postal (optionnel mais doit être valide)
  const postalCodeError = validatePostalCode(formData.code_postal);
  if (postalCodeError) {
    errors.code_postal = postalCodeError;
  }

  // Longueur des champs
  if (formData.nom_entreprise) {
    const lengthError = validateLength(formData.nom_entreprise, { min: 2, max: 255 });
    if (lengthError && !errors.nom_entreprise) {
      errors.nom_entreprise = lengthError;
    }
  }

  if (formData.adresse) {
    const lengthError = validateLength(formData.adresse, { max: 500 });
    if (lengthError) {
      errors.adresse = lengthError;
    }
  }

  if (formData.ville) {
    const lengthError = validateLength(formData.ville, { max: 100 });
    if (lengthError) {
      errors.ville = lengthError;
    }
  }

  return errors;
}

/**
 * Valide un champ individuel
 * Utile pour validation en temps réel
 *
 * @param {string} fieldName - Nom du champ à valider
 * @param {any} value - Valeur du champ
 * @param {Object} rules - Règles de validation { required, email, phone, url, min, max }
 * @returns {string|null} Message d'erreur ou null si valide
 *
 * @example
 * const error = validateField('email', 'test@example.com', { email: true });
 * // => null (valide)
 *
 * const error2 = validateField('nom_entreprise', '', { required: true });
 * // => "Ce champ est obligatoire"
 */
export function validateField(fieldName, value, rules = {}) {
  // Required
  if (rules.required) {
    const error = validateRequired(value, fieldName);
    if (error) return error;
  }

  // Email
  if (rules.email) {
    const error = validateEmail(value);
    if (error) return error;
  }

  // Phone
  if (rules.phone) {
    const error = validatePhone(value);
    if (error) return error;
  }

  // URL
  if (rules.url) {
    const error = validateUrl(value);
    if (error) return error;
  }

  // Postal code
  if (rules.postalCode) {
    const error = validatePostalCode(value);
    if (error) return error;
  }

  // Length
  if (rules.min || rules.max) {
    const error = validateLength(value, { min: rules.min, max: rules.max });
    if (error) return error;
  }

  return null;
}

/**
 * Nettoie les erreurs pour un formulaire (enlève les champs null/undefined)
 *
 * @param {Object} errors - Objet d'erreurs
 * @returns {Object} Erreurs nettoyées
 */
export function cleanErrors(errors) {
  return Object.entries(errors).reduce((acc, [key, value]) => {
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
