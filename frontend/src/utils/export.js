/**
 * Utilitaires pour l'export de données
 */

/**
 * Exporter des données en CSV
 * @param {Array} data - Données à exporter
 * @param {string} filename - Nom du fichier
 */
export const exportToCSV = (data, filename = 'prospects.csv') => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Headers CSV
  const headers = [
    'ID',
    'Entreprise',
    'Contact',
    'Email',
    'Téléphone',
    'Adresse',
    'Site Web',
    'Source',
    'Tags',
    'Date Ajout',
  ];

  // Convertir les données en lignes CSV
  const rows = data.map(prospect => [
    prospect.id,
    prospect.nom_entreprise || '',
    prospect.nom_contact || '',
    prospect.email || '',
    prospect.telephone || '',
    prospect.adresse || '',
    prospect.url_site || '',
    prospect.source_scraping || '',
    prospect.tags ? prospect.tags.map(tag => tag.nom).join('; ') : '',
    prospect.date_ajout ? new Date(prospect.date_ajout).toLocaleDateString('fr-FR') : '',
  ]);

  // Construire le CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Créer un Blob et télécharger
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`[Export] ${data.length} prospects exportés en CSV`);
};

/**
 * Exporter des données en JSON
 * @param {Array} data - Données à exporter
 * @param {string} filename - Nom du fichier
 */
export const exportToJSON = (data, filename = 'prospects.json') => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Convertir en JSON avec indentation
  const jsonContent = JSON.stringify(data, null, 2);

  // Créer un Blob et télécharger
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`[Export] ${data.length} prospects exportés en JSON`);
};

/**
 * Copier des données dans le presse-papiers (format texte)
 * @param {Array} data - Données à copier
 */
export const copyToClipboard = async (data) => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à copier');
    return;
  }

  // Format texte simple
  const textContent = data
    .map(
      prospect =>
        `${prospect.nom_entreprise}${prospect.nom_contact ? ' - ' + prospect.nom_contact : ''}
Email: ${prospect.email || 'N/A'}
Tél: ${prospect.telephone || 'N/A'}
${prospect.adresse || ''}
${prospect.url_site || ''}
---`
    )
    .join('\n\n');

  try {
    await navigator.clipboard.writeText(textContent);
    alert(`${data.length} prospect(s) copié(s) dans le presse-papiers`);
  } catch (error) {
    console.error('[Export] Erreur copie presse-papiers:', error);
    alert('Erreur lors de la copie dans le presse-papiers');
  }
};
