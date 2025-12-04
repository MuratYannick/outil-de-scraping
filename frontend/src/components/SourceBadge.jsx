import React from "react";

/**
 * Composant pour afficher les sources de scraping d'un prospect sous forme de badges colorés
 */
export default function SourceBadge({ prospect }) {
  // Si le prospect n'a pas de sources, ne rien afficher
  if (!prospect?.sources || prospect.sources.length === 0) {
    return <span className="text-xs text-gray-400">Aucune source</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {prospect.sources.map((source) => (
        <span
          key={source.id}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: `${source.couleur}20`, // 20 = opacité 12.5%
            color: source.couleur,
            border: `1px solid ${source.couleur}40`, // 40 = opacité 25%
          }}
          title={`Source: ${source.nom}${source.prospects_sources?.createdAt ? ` (ajoutée le ${new Date(source.prospects_sources.createdAt).toLocaleDateString('fr-FR')})` : ''}`}
        >
          {source.nom}
        </span>
      ))}
    </div>
  );
}
