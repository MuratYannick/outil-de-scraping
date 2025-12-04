/**
 * Script de nettoyage et fusion des doublons dans la base de données
 *
 * Détecte et fusionne les prospects en doublon en utilisant :
 * - Même ville + adresses similaires (normalisation)
 * - Noms d'entreprise proches (similarité de chaînes)
 *
 * Lors de la fusion :
 * - Conserve le prospect avec le plus de données
 * - Fusionne les sources
 * - Fusionne les tags
 * - Enrichit avec les données manquantes
 * - Supprime le doublon
 */

import dotenv from 'dotenv';
import readline from 'readline';
import { sequelize, Prospect, Tag, SourceScraping } from '../src/models/index.js';
import { addressesMatch } from '../src/utils/addressNormalizer.js';

dotenv.config();

// Interface readline pour les confirmations
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} Distance de Levenshtein
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialiser la matrice
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Remplir la matrice
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Suppression
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcule la similarité entre deux chaînes
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} Score de similarité entre 0 et 1
 */
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  // Normaliser les chaînes : minuscules, sans accents, sans apostrophes/tirets
  const normalize = (s) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/['\-]/g, ' ')          // Remplacer apostrophes et tirets par des espaces
    .replace(/\s+/g, ' ')            // Normaliser les espaces
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
    return 0.95; // Très similaire (mêmes mots, ordre différent)
  }

  // Comparer l'intersection des mots significatifs
  const commonWords = words1.filter(w => words2.includes(w));
  const wordSimilarity = (2 * commonWords.length) / (words1.length + words2.length);

  if (wordSimilarity >= 0.65) {
    return 0.9; // Très similaire (65%+ de mots en commun)
  }

  // Vérifier si l'un contient l'autre (ignorer les mots en plus)
  // Si le nom court représente au moins 30% du nom long, considérer comme très similaire
  // (typique des cas où le nom long = nom court + complément commercial)
  if (s1.includes(s2)) {
    const ratio = s2.length / s1.length;
    return ratio >= 0.3 ? 0.9 : ratio; // Bonus si >= 30%
  }
  if (s2.includes(s1)) {
    const ratio = s1.length / s2.length;
    return ratio >= 0.3 ? 0.9 : ratio; // Bonus si >= 30%
  }

  // Calculer la distance de Levenshtein
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  // Convertir en score de similarité (0 = différent, 1 = identique)
  return 1 - distance / maxLength;
}

/**
 * Vérifie si deux prospects sont des doublons potentiels
 * @param {Object} p1 - Premier prospect
 * @param {Object} p2 - Deuxième prospect
 * @returns {Object} { isDuplicate: boolean, reason: string, similarity: number }
 */
function areDuplicates(p1, p2) {
  // Ne pas comparer un prospect avec lui-même
  if (p1.id === p2.id) {
    return { isDuplicate: false, reason: 'Même prospect' };
  }

  // Critère 1 OBLIGATOIRE : Même code postal
  // (Utiliser le code postal plutôt que la ville car plusieurs villes peuvent avoir le même nom)
  if (!p1.code_postal || !p2.code_postal || p1.code_postal !== p2.code_postal) {
    return { isDuplicate: false, reason: 'Codes postaux différents ou manquants' };
  }

  // Calculer la similarité des noms (utilisé dans les deux chemins)
  let nameSimilarity = 0;
  if (p1.nom_entreprise && p2.nom_entreprise) {
    nameSimilarity = stringSimilarity(p1.nom_entreprise, p2.nom_entreprise);
  }

  // CHEMIN A : Les deux ont une adresse
  // → Requiert ADRESSE similaire ET NOM similaire (85%)
  if (p1.adresse && p2.adresse) {
    const addressMatch = addressesMatch(p1.adresse, p2.adresse);

    if (addressMatch && nameSimilarity >= 0.85) {
      return {
        isDuplicate: true,
        reason: `Même code postal + adresses similaires + noms similaires (${(nameSimilarity * 100).toFixed(1)}%)`,
        similarity: nameSimilarity
      };
    }

    // Si l'adresse match mais pas le nom (ou inversement), ce n'est PAS un doublon
    // (évite de fusionner différentes entreprises dans le même immeuble)
    return { isDuplicate: false, reason: 'Adresse ou nom insuffisamment similaire' };
  }

  // CHEMIN B : Pas d'adresse (ou une des deux manque)
  // → Requiert NOM similaire (85%) ET au moins un contact identique (téléphone, email, ou URL)
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

    // Noms similaires mais aucun contact ne correspond
    // (évite de fusionner plusieurs agences de la même entreprise dans la même ville)
    return { isDuplicate: false, reason: 'Noms similaires mais aucun contact correspondant' };
  }

  return { isDuplicate: false, reason: 'Pas de similarité suffisante' };
}

/**
 * Compte le nombre de champs remplis dans un prospect
 * @param {Object} prospect - Prospect
 * @returns {number} Nombre de champs non null/undefined/vide
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
 * @param {Object} p1 - Premier prospect
 * @param {Object} p2 - Deuxième prospect
 * @returns {Object} { keepId, deleteId, mergedData }
 */
function decideMergeStrategy(p1, p2) {
  // Compter les champs remplis
  const p1Fields = countFilledFields(p1);
  const p2Fields = countFilledFields(p2);

  // Garder celui avec le plus de données
  const keep = p1Fields >= p2Fields ? p1 : p2;
  const remove = p1Fields >= p2Fields ? p2 : p1;

  // Créer les données fusionnées (prendre la meilleure valeur pour chaque champ)
  const mergedData = {};
  const fields = [
    'nom_entreprise', 'nom_contact', 'email', 'telephone',
    'adresse', 'ville', 'code_postal', 'latitude', 'longitude',
    'url_site', 'note'
  ];

  for (const field of fields) {
    const keepValue = keep[field];
    const removeValue = remove[field];

    // Prendre la valeur non vide, ou la plus longue si les deux sont remplies
    if (!keepValue && removeValue) {
      mergedData[field] = removeValue;
    } else if (keepValue && removeValue && removeValue.length > keepValue.length) {
      // Cas spécial : si l'autre valeur est plus complète
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
 * @param {number} keepId - ID du prospect à conserver
 * @param {number} deleteId - ID du prospect à supprimer
 * @param {Object} mergedData - Données à mettre à jour
 */
async function mergeProspects(keepId, deleteId, mergedData) {
  const t = await sequelize.transaction();

  try {
    // Récupérer les prospects avec leurs relations
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

    // Mettre à jour les données du prospect à conserver
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
 * Fonction principale
 */
async function main() {
  try {
    console.log('🧹 Nettoyage et fusion des doublons dans la base de données\n');
    console.log('='.repeat(80) + '\n');

    // Connexion à la base
    console.log('📡 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connecté\n');

    // Récupérer tous les prospects avec leurs relations
    console.log('📊 Chargement des prospects...');
    const prospects = await Prospect.findAll({
      include: [
        { model: Tag, as: 'tags' },
        { model: SourceScraping, as: 'sources' }
      ],
      order: [['ville', 'ASC'], ['nom_entreprise', 'ASC']]
    });

    console.log(`✅ ${prospects.length} prospects chargés\n`);

    // Grouper les prospects par ville pour optimiser les comparaisons
    const prospectsByCity = {};
    for (const prospect of prospects) {
      const city = prospect.ville || 'NO_CITY';
      if (!prospectsByCity[city]) {
        prospectsByCity[city] = [];
      }
      prospectsByCity[city].push(prospect);
    }

    console.log(`📍 ${Object.keys(prospectsByCity).length} villes distinctes\n`);

    // Détecter les doublons
    console.log('🔍 Détection des doublons...\n');
    const duplicatePairs = [];

    for (const city in prospectsByCity) {
      const cityProspects = prospectsByCity[city];

      if (cityProspects.length < 2) continue;

      console.log(`   Analyse de ${city}: ${cityProspects.length} prospects`);

      for (let i = 0; i < cityProspects.length; i++) {
        for (let j = i + 1; j < cityProspects.length; j++) {
          const result = areDuplicates(cityProspects[i], cityProspects[j]);

          if (result.isDuplicate) {
            duplicatePairs.push({
              p1: cityProspects[i],
              p2: cityProspects[j],
              reason: result.reason,
              similarity: result.similarity
            });
          }
        }
      }
    }

    console.log(`\n✅ ${duplicatePairs.length} doublon(s) détecté(s)\n`);

    if (duplicatePairs.length === 0) {
      console.log('🎉 Aucun doublon trouvé ! La base de données est propre.');
      rl.close();
      await sequelize.close();
      return;
    }

    // Afficher les doublons détectés
    console.log('='.repeat(80) + '\n');
    console.log('📋 LISTE DES DOUBLONS DÉTECTÉS:\n');

    duplicatePairs.forEach((pair, index) => {
      console.log(`${index + 1}. ${pair.reason}`);
      console.log(`   Prospect A (#${pair.p1.id}): "${pair.p1.nom_entreprise}"`);
      console.log(`      Adresse: ${pair.p1.adresse || 'N/A'}`);
      console.log(`      Sources: ${pair.p1.sources.map(s => s.nom).join(', ')}`);
      console.log(`      Tags: ${pair.p1.tags.map(t => t.nom).join(', ')}`);
      console.log(`   Prospect B (#${pair.p2.id}): "${pair.p2.nom_entreprise}"`);
      console.log(`      Adresse: ${pair.p2.adresse || 'N/A'}`);
      console.log(`      Sources: ${pair.p2.sources.map(s => s.nom).join(', ')}`);
      console.log(`      Tags: ${pair.p2.tags.map(t => t.nom).join(', ')}`);
      console.log();
    });

    console.log('='.repeat(80) + '\n');

    // Demander confirmation
    const answer = await askQuestion('⚠️  Voulez-vous fusionner ces doublons ? (oui/non): ');

    if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'o') {
      console.log('\n❌ Opération annulée par l\'utilisateur');
      rl.close();
      await sequelize.close();
      return;
    }

    // Fusionner les doublons
    console.log('\n🔀 Fusion des doublons en cours...\n');

    let mergedCount = 0;
    let errorCount = 0;

    for (const pair of duplicatePairs) {
      try {
        const strategy = decideMergeStrategy(pair.p1, pair.p2);

        console.log(`Fusion: #${strategy.keepId} ← #${strategy.deleteId}`);

        await mergeProspects(strategy.keepId, strategy.deleteId, strategy.mergedData);

        mergedCount++;
        console.log(`✅ Fusionné avec succès\n`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur lors de la fusion: ${error.message}\n`);
      }
    }

    console.log('='.repeat(80) + '\n');
    console.log('📊 RÉSULTATS:\n');
    console.log(`✅ Doublons fusionnés: ${mergedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`🗑️  Prospects supprimés: ${mergedCount}`);
    console.log(`✨ Base de données nettoyée !\n`);

    rl.close();
    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    rl.close();
    await sequelize.close();
    process.exit(1);
  }
}

// Lancer le script
main();
