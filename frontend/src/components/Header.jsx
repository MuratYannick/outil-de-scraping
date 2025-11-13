import React from "react";

/**
 * Composant Header de l'application
 */
export default function Header({ apiStatus }) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Outil de Scraping
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestion des prospects et scraping automatisé
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {apiStatus && (
              <div className="flex items-center space-x-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    apiStatus.connected ? "bg-green-500" : "bg-red-500"
                  }`}
                  title={apiStatus.connected ? "Connecté" : "Déconnecté"}
                ></div>
                <span className="text-sm text-gray-600">
                  {apiStatus.connected ? "API Connectée" : "API Déconnectée"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
