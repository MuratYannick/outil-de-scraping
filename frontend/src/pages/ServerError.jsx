import { Link } from 'react-router-dom';

/**
 * Page 500 - Erreur serveur
 */
const ServerError = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icône 500 */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-600">500</h1>
          <div className="text-6xl mb-4">⚠️</div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Erreur serveur
        </h2>
        <p className="text-gray-600 mb-8">
          Désolé, une erreur interne est survenue sur nos serveurs. Nos équipes ont été notifiées et travaillent à résoudre le problème.
        </p>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Réessayer
          </button>
          <Link
            to="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium inline-flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Retour à l'accueil
          </Link>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-12 text-left bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Que faire en attendant ?
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-1">•</span>
              <span>Réessayez dans quelques minutes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-1">•</span>
              <span>Vérifiez votre connexion internet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-1">•</span>
              <span>Contactez le support si le problème persiste</span>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Code d'erreur : <span className="font-mono font-semibold">500 Internal Server Error</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
