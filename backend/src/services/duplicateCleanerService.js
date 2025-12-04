/**
 * Service de nettoyage et fusion des doublons
 * Logique réutilisable extraite du script clean-merge-duplicates.js
 */

import { Prospect, Tag, SourceScraping, sequelize } from '../models/index.js';
import { addressesMatch } from '../utils/addressNormalizer.js';

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcule la similarité entre deux chaînes
 */
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const normalize = (s) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const s1 = normalize(str1);
  const s2 = normalize(str2);

  if (s1 === s2) return 1;

  // Vérifier si les mots sont les mêmes (ordre différent acceptable)
  const words1 = s1.split(' ').filter(w => w.length > 2).sort();
  const words2 = s2.split(' ').filter(w => w.length > 2).sort();
  const wordsStr1 = words1.join(' ');
  const wordsStr2 = words2.join(' ');

  if (wordsStr1 === wordsStr2) {
    return 0.95;
  }

  // Comparer l'intersection des mots significatifs
  const commonWords = words1.filter(w => words2.includes(w));
  const wordSimilarity = (2 * commonWords.length) / (words1.length + words2.length);

  if (wordSimilarity >= 0.65) {
    return 0.9;
  }

  // Vérifier si l'un contient l'autre
  if (s1.includes(s2)) {
    const ratio = s2.length / s1.length;
    return ratio >= 0.3 ? 0.9 : ratio;
  }
  if (s2.includes(s1)) {
    const ratio = s1.length / s2.length;
    return ratio >= 0.3 ? 0.9 : ratio;
  }

  // Calculer la distance de Levenshtein
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - distance / maxLength;
}

/**
 * Vérifie si deux prospects sont des doublons potentiels
 */
function areDuplicates(p1, p2) {
  if (p1.id === p2.id) {
    return { isDuplicate: false, reason: 'Même prospect' };
  }

  // Critère 1 OBLIGATOIRE : Même code postal
  if (!p1.code_postal || !p2.code_postal || p1.code_postal !== p2.code_postal) {
    return { isDuplicate: false, reason: 'Codes postaux différents ou manquants' };
  }

  // Calculer la similarité des noms
  let nameSimilarity = 0;
  if (p1.nom_entreprise && p2.nom_entreprise) {
    nameSimilarity = stringSimilarity(p1.nom_entreprise, p2.nom_entreprise);
  }

  // CHEMIN A : Les deux ont une adresse
  if (p1.adresse && p2.adresse) {
    const addressMatch = addressesMatch(p1.adresse, p2.adresse);

    if (addressMatch && nameSimilarity >= 0.85) {
      return {
        isDuplicate: true,
        reason: `Même code postal + adresses similaires + noms similaires (${(nameSimilarity * 100).toFixed(1)}%)`,
        similarity: nameSimilarity
      };
    }

    return { isDuplicate: false, reason: 'Adresse ou nom insuffisamment similaire' };
  }

  // CHEMIN B : Pas d'adresse
  if (nameSimilarity >= 0.85) {
    // Vérifier le téléphone
    if (p1.telephone && p2.telephone) {
      const phone1 = p1.telephone.replace(/\s+/g, '');
      const phone2 = p2.telephone.replace(/\s+/g, '');
      if (phone1 === phone2) {
        return {
          isDuplicate: true,
          reason: `Même code postal + noms similaires (${(nameSimilarity * 100).toFixed(1)}%) + même téléphone`,
          similarity: nameSimilarity
        };
      }
    }

    // Vérifier l'email
    if (p1.email && p2.email && p1.email === p2.email) {
      return {
        isDuplicate: true,
        reason: `Même code postal + noms similaires (${(nameSimilarity * 100).toFixed(1)}%) + même email`,
        similarity: nameSimilarity
      };
    }

    // Vérifier l'URL site
    if (p1.url_site && p2.url_site && p1.url_site === p2.url_site) {
      return {
        isDuplicate: true,
        reason: `Même code postal + noms similaires (${(nameSimilarity * 100).toFixed(1)}%) + même URL site`,
        similarity: nameSimilarity
      };
    }

    return { isDuplicate: false, reason: 'Noms similaires mais aucun contact correspondant' };
  }

  return { isDuplicate: false, reason: 'Pas de similarité suffisante' };
}

/**
 * Compte le nombre de champs remplis dans un prospect
 */
function countFilledFields(prospect) {
  const fields = [
    'nom_entreprise', 'nom_contact', 'email', 'telephone',
    'adresse', 'ville', 'code_postal', 'latitude', 'longitude',
    'url_site', 'note'
  ];

  return fields.filter(field => {
    const value = prospect[field];
    return value !== null && value !== undefined && value !== '';
  }).length;
}

/**
 * Fusionne deux prospects en conservant les meilleures données
 */
function decideMergeStrategy(p1, p2) {
  const p1Fields = countFilledFields(p1);
  const p2Fields = countFilledFields(p2);

  const keep = p1Fields >= p2Fields ? p1 : p2;
  const remove = p1Fields >= p2Fields ? p2 : p1;

  const mergedData = {};
  const fields = [
    'nom_entreprise', 'nom_contact', 'email', 'telephone',
    'adresse', 'ville', 'code_postal', 'latitude', 'longitude',
    'url_site', 'note'
  ];

  for (const field of fields) {
    const keepValue = keep[field];
    const removeValue = remove[field];

    if (!keepValue && removeValue) {
      mergedData[field] = removeValue;
    } else if (keepValue && removeValue && removeValue.length > keepValue.length) {
      if (field === 'nom_entreprise' || field === 'adresse') {
        mergedData[field] = removeValue;
      }
    }
  }

  return {
    keepId: keep.id,
    deleteId: remove.id,
    mergedData
  };
}

/**
 * Fusionne deux prospects dans la base de données
 */
async function mergeProspects(keepId, deleteId, mergedData) {
  const t = await sequelize.transaction();

  try {
    const keepProspect = await Prospect.findByPk(keepId, {
      include: [
        { model: Tag, as: 'tags' },
        { model: SourceScraping, as: 'sources' }
      ],
      transaction: t
    });

    const deleteProspect = await Prospect.findByPk(deleteId, {
      include: [
        { model: Tag, as: 'tags' },
        { model: SourceScraping, as: 'sources' }
      ],
      transaction: t
    });

    // Mettre à jour les données
    if (Object.keys(mergedData).length > 0) {
      await keepProspect.update(mergedData, { transaction: t });
    }

    // Fusionner les tags
    for (const tag of deleteProspect.tags) {
      const hasTag = keepProspect.tags.some(t => t.id === tag.id);
      if (!hasTag) {
        await keepProspect.addTag(tag, { transaction: t });
      }
    }

    // Fusionner les sources
    for (const source of deleteProspect.sources) {
      const hasSource = keepProspect.sources.some(s => s.id === source.id);
      if (!hasSource) {
        await keepProspect.addSource(source, { transaction: t });
      }
    }

    // Supprimer le prospect en doublon
    await deleteProspect.destroy({ transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

/**
 * Détecte les doublons dans la base de données
 * @returns {Promise<Array>} Liste des paires de doublons détectés
 */
export async function detectDuplicates() {
  // Récupérer tous les prospects avec leurs relations
  const prospects = await Prospect.findAll({
    include: [
      { model: Tag, as: 'tags' },
      { model: SourceScraping, as: 'sources' }
    ],
    order: [['code_postal', 'ASC'], ['nom_entreprise', 'ASC']]
  });

  // Grouper par code postal pour optimiser
  const prospectsByPostalCode = {};
  for (const prospect of prospects) {
    const code = prospect.code_postal || 'NO_CODE';
    if (!prospectsByPostalCode[code]) {
      prospectsByPostalCode[code] = [];
    }
    prospectsByPostalCode[code].push(prospect);
  }

  // Détecter les doublons
  const duplicatePairs = [];

  for (const code in prospectsByPostalCode) {
    const codeProspects = prospectsByPostalCode[code];

    if (codeProspects.length < 2) continue;

    for (let i = 0; i < codeProspects.length; i++) {
      for (let j = i + 1; j < codeProspects.length; j++) {
        const result = areDuplicates(codeProspects[i], codeProspects[j]);

        if (result.isDuplicate) {
          duplicatePairs.push({
            p1: codeProspects[i],
            p2: codeProspects[j],
            reason: result.reason,
            similarity: result.similarity
          });
        }
      }
    }
  }

  return duplicatePairs;
}

/**
 * Nettoie et fusionne tous les doublons détectés
 * @returns {Promise<Object>} Résultats de l'opération
 */
export async function cleanAndMergeDuplicates() {
  const duplicatePairs = await detectDuplicates();

  if (duplicatePairs.length === 0) {
    return {
      success: true,
      duplicatesFound: 0,
      duplicatesMerged: 0,
      errors: 0,
      details: []
    };
  }

  let mergedCount = 0;
  let errorCount = 0;
  const details = [];

  for (const pair of duplicatePairs) {
    try {
      const strategy = decideMergeStrategy(pair.p1, pair.p2);

      await mergeProspects(strategy.keepId, strategy.deleteId, strategy.mergedData);

      mergedCount++;
      details.push({
        success: true,
        keptId: strategy.keepId,
        deletedId: strategy.deleteId,
        reason: pair.reason
      });
    } catch (error) {
      errorCount++;
      details.push({
        success: false,
        p1Id: pair.p1.id,
        p2Id: pair.p2.id,
        error: error.message
      });
    }
  }

  return {
    success: true,
    duplicatesFound: duplicatePairs.length,
    duplicatesMerged: mergedCount,
    errors: errorCount,
    details
  };
}

/**
 * Nettoie et fusionne une sélection spécifique de doublons
 * @param {Array} selectedPairs - Liste des paires de doublons à fusionner
 * @returns {Promise<Object>} Résultats de l'opération
 */
export async function cleanSelectedDuplicates(selectedPairs) {
  if (!selectedPairs || selectedPairs.length === 0) {
    return {
      success: true,
      duplicatesFound: 0,
      duplicatesMerged: 0,
      errors: 0,
      details: []
    };
  }

  let mergedCount = 0;
  let errorCount = 0;
  const details = [];

  for (const pair of selectedPairs) {
    try {
      // Récupérer les prospects complets depuis la base de données
      const p1 = await Prospect.findByPk(pair.prospect1.id, {
        include: [
          { model: Tag, as: 'tags' },
          { model: SourceScraping, as: 'sources' }
        ]
      });

      const p2 = await Prospect.findByPk(pair.prospect2.id, {
        include: [
          { model: Tag, as: 'tags' },
          { model: SourceScraping, as: 'sources' }
        ]
      });

      if (!p1 || !p2) {
        errorCount++;
        details.push({
          success: false,
          p1Id: pair.prospect1.id,
          p2Id: pair.prospect2.id,
          error: 'Un des prospects n\'existe plus'
        });
        continue;
      }

      const strategy = decideMergeStrategy(p1, p2);

      await mergeProspects(strategy.keepId, strategy.deleteId, strategy.mergedData);

      mergedCount++;
      details.push({
        success: true,
        keptId: strategy.keepId,
        deletedId: strategy.deleteId,
        reason: pair.reason
      });
    } catch (error) {
      errorCount++;
      details.push({
        success: false,
        p1Id: pair.prospect1.id,
        p2Id: pair.prospect2.id,
        error: error.message
      });
    }
  }

  return {
    success: true,
    duplicatesFound: selectedPairs.length,
    duplicatesMerged: mergedCount,
    errors: errorCount,
    details
  };
}
