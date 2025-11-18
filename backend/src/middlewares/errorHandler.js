/**
 * Middleware de gestion centralisée des erreurs
 *
 * Ce middleware attrape toutes les erreurs et les formate de manière cohérente
 */
const errorHandler = (err, req, res, next) => {
  // Log l'erreur pour le débogage
  console.error('[ErrorHandler]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Erreur de validation Joi (déjà gérée par le middleware validate)
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Les données fournies sont invalides',
      details: err.details,
    });
  }

  // Erreur Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Erreur de validation de la base de données',
      details: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Cette ressource existe déjà',
      details: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Référence invalide vers une ressource',
    });
  }

  // Erreur de ressource non trouvée
  if (err.status === 404 || err.message.includes('not found')) {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message || 'Ressource non trouvée',
    });
  }

  // Erreur d'autorisation
  if (err.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message || 'Non autorisé',
    });
  }

  if (err.status === 403) {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message || 'Accès interdit',
    });
  }

  // Erreur de syntaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'JSON invalide',
    });
  }

  // Erreur serveur par défaut
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Error',
    message:
      statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Une erreur interne est survenue'
        : err.message || 'Une erreur est survenue',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware pour les routes non trouvées (404)
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} non trouvée`,
  });
};

export { errorHandler, notFoundHandler };
