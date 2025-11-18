/**
 * Middleware de validation Joi
 *
 * @param {Object} schema - Schéma Joi contenant les validations (body, query, params)
 * @returns {Function} Middleware Express
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Retourner toutes les erreurs, pas seulement la première
      allowUnknown: true, // Permettre les champs non spécifiés dans le schéma
      stripUnknown: true, // Supprimer les champs non spécifiés
    };

    // Valider le body, query et params
    const toValidate = {};
    if (schema.body) toValidate.body = req.body;
    if (schema.query) toValidate.query = req.query;
    if (schema.params) toValidate.params = req.params;

    const validationSchema = {
      body: schema.body,
      query: schema.query,
      params: schema.params,
    };

    // Valider chaque partie
    const errors = {};
    let hasErrors = false;

    Object.keys(toValidate).forEach((key) => {
      if (validationSchema[key]) {
        const { error, value } = validationSchema[key].validate(
          toValidate[key],
          validationOptions
        );

        if (error) {
          hasErrors = true;
          errors[key] = error.details.map((detail) => ({
            message: detail.message,
            path: detail.path,
            type: detail.type,
          }));
        } else {
          // Remplacer avec les valeurs validées et nettoyées
          req[key] = value;
        }
      }
    });

    if (hasErrors) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Les données fournies sont invalides',
        details: errors,
      });
    }

    next();
  };
};

export default validate;
