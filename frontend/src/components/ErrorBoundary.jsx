import React from 'react';

/**
 * ErrorBoundary - Composant de gestion globale des erreurs React
 *
 * Attrape les erreurs JavaScript dans tout l'arbre des composants enfants,
 * log ces erreurs, et affiche une interface de secours au lieu de crasher.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour que le prochain rendu affiche l'UI de secours
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log l'erreur dans la console pour le débogage
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Stocker les détails de l'erreur dans l'état
    this.setState({
      error,
      errorInfo,
    });

    // Optionnel : Envoyer l'erreur à un service de monitoring (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // UI de secours personnalisée
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8">
            {/* Icône d'erreur */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-red-100 p-4">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Message d'erreur */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Une erreur est survenue
            </h1>

            <p className="text-gray-600 text-center mb-6">
              Désolé, quelque chose s'est mal passé. Veuillez réessayer ou contacter le support si le problème persiste.
            </p>

            {/* Détails de l'erreur (mode développement uniquement) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Détails techniques
                </summary>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <strong>Erreur :</strong>
                    <pre className="mt-1 bg-red-50 p-2 rounded overflow-x-auto text-xs">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack trace :</strong>
                      <pre className="mt-1 bg-red-50 p-2 rounded overflow-x-auto text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Réessayer
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
