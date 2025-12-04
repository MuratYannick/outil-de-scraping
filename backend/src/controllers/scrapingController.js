import taskManager from '../services/taskManager.js';
import { PagesJaunesScraper } from '../services/scrapers/pagesJaunesScraper.js';
import { getGoogleMapsService } from '../services/googleMapsService.js';
import { getLinkedInScraper } from '../services/scrapers/linkedInScraper.js';
import { Prospect, Tag, SourceScraping } from '../models/index.js';
import { Op } from 'sequelize';
import { addressesMatch } from '../utils/addressNormalizer.js';

/**
 * @route   POST /api/scraping/lancer
 * @desc    Lancer une tâche de scraping asynchrone
 * @access  Public
 */
export const lancerScraping = async (req, res) => {
  try {
    const { keyword, location, source = 'Pages Jaunes', startPage = 1, maxPages = 1, maxResults = 10, excludeDuplicates = false } = req.body;

    // Validation des paramètres
    if (!keyword || !location) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Les paramètres "keyword" et "location" sont requis',
      });
    }

    // Créer une tâche
    const task = taskManager.createTask({
      keyword,
      location,
      source,
      startPage,
      maxPages,
      maxResults,
      excludeDuplicates,
    });

    // Lancer le scraping de manière asynchrone
    scrapeAsync(task.id, keyword, location, { startPage, maxPages, maxResults, source, excludeDuplicates });

    // Retourner immédiatement l'ID de la tâche
    res.status(202).json({
      task_id: task.id,
      status: task.status,
      message: 'Tâche de scraping créée et lancée',
      params: {
        keyword,
        location,
        source,
        maxPages,
        maxResults,
      },
    });
  } catch (error) {
    console.error('Error launching scraping:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Fonction asynchrone pour effectuer le scraping
 * @param {string} taskId - ID de la tâche
 * @param {string} keyword - Mot-clé de recherche
 * @param {string} location - Localisation
 * @param {Object} options - Options de scraping
 */
async function scrapeAsync(taskId, keyword, location, options = {}) {
  try {
    // Mettre à jour le statut à "in_progress"
    taskManager.updateTaskStatus(taskId, 'in_progress');

    const { source = 'Pages Jaunes', startPage = 1, maxPages = 1, maxResults = 10, excludeDuplicates = false } = options;
    let prospects = [];
    let scrapingResult = null; // Stocker le résultat complet du scraping

    // Créer une fonction de vérification de doublons en temps réel
    const isDuplicate = excludeDuplicates ? async (prospectData) => {
      // Vérifier d'abord par email ou URL (exact match)
      const existingExact = await Prospect.findOne({
        where: {
          [Op.or]: [
            prospectData.email ? { email: prospectData.email } : null,
            prospectData.url_site ? { url_site: prospectData.url_site } : null,
          ].filter(Boolean),
        },
      });

      if (existingExact) return true;

      // Vérifier par nom + adresse avec normalisation
      if (prospectData.nom_entreprise && prospectData.adresse) {
        const potentialDuplicates = await Prospect.findAll({
          where: {
            nom_entreprise: prospectData.nom_entreprise
          }
        });

        // Comparer les adresses normalisées
        for (const candidate of potentialDuplicates) {
          if (candidate.adresse && addressesMatch(prospectData.adresse, candidate.adresse)) {
            return true;
          }
        }
      }

      return false;
    } : null;

    // Choisir le scraper approprié selon la source
    if (source === 'Google Maps') {
      // Utiliser le service Google Maps (scraper ou API selon config)
      const googleMapsService = getGoogleMapsService();

      prospects = await googleMapsService.search(
        { keyword, location, maxResults },
        (progress, message) => {
          taskManager.updateTaskProgress(taskId, progress, { message });
        }
      );

    } else if (source === 'LinkedIn') {
      // LinkedIn (Mode Public - Limité)
      const linkedInScraper = getLinkedInScraper();

      console.log(`[ScrapingController] 📊 LinkedIn scraping - Mode Public`);
      console.log(`[ScrapingController] ⚠️ Limites : Max ${Math.min(maxResults, 10)} profils, délais longs`);

      prospects = await linkedInScraper.scrape(keyword, location, {
        maxResults: Math.min(maxResults, 10), // Forcer limite de 10 max
        onProgress: (data) => {
          taskManager.updateTaskProgress(taskId, data.progress, {
            message: data.message,
            step: data.step
          });
        },
      });

      // LinkedIn retourne directement un tableau de prospects (pas de result wrapper)
      // Pas besoin de transformation

    } else {
      // Pages Jaunes (par défaut)
      const scraper = new PagesJaunesScraper();

      console.log(`[ScrapingController] Mode excludeDuplicates: ${excludeDuplicates ? 'OUI' : 'NON'}`);

      scrapingResult = await scraper.scrape(keyword, location, {
        startPage,
        maxPages,
        maxResults,
        excludeDuplicates,
        isDuplicate, // Callback pour vérifier les doublons en temps réel
        onProgress: (progress, data) => {
          taskManager.updateTaskProgress(taskId, progress, data);
        },
      });

      prospects = scrapingResult.prospects;
    }

    // Sauvegarder les prospects en base de données avec leur source
    const savedProspects = await saveProspects(prospects, keyword, source);

    // Préparer les données de résultat selon la source
    let taskResult = {
      prospects: savedProspects,
      total: savedProspects.length,
      duplicates_skipped: prospects.length - savedProspects.length,
    };

    // Ajouter des métriques spécifiques selon la source
    if (source === 'LinkedIn') {
      taskResult.source = 'LinkedIn (Mode Public)';
      taskResult.captcha_detected = getLinkedInScraper().captchaDetected;
      taskResult.success = savedProspects.length > 0;
    } else if (source === 'Google Maps') {
      taskResult.source = 'Google Maps';
      taskResult.success = true;
    } else {
      // Pages Jaunes
      taskResult.pages_scraped = scrapingResult?.pages_scraped || 1;
      taskResult.success = scrapingResult?.success || false;
    }

    // Marquer la tâche comme terminée
    taskManager.completeTask(taskId, taskResult);

    console.log(`[ScrapingController] Tâche ${taskId} terminée: ${savedProspects.length} prospects sauvegardés`);
  } catch (error) {
    console.error(`[ScrapingController] Erreur tâche ${taskId}:`, error);
    taskManager.failTask(taskId, error);
  }
}

/**
 * Sauvegarder les prospects en base de données avec gestion des sources multiples
 * Gère les doublons et l'enrichissement automatique
 * @param {Array} prospects - Liste des prospects à sauvegarder
 * @param {string} keyword - Mot-clé pour créer un tag
 * @param {string} sourceName - Nom de la source de scraping (ex: 'Google Maps', 'Pages Jaunes')
 * @returns {Array} Prospects sauvegardés
 */
async function saveProspects(prospects, keyword, sourceName) {
  const savedProspects = [];

  // Créer ou récupérer le tag basé sur le keyword
  const [tag] = await Tag.findOrCreate({
    where: { nom: keyword.charAt(0).toUpperCase() + keyword.slice(1) },
  });

  // Récupérer ou créer la source de scraping
  const [source] = await SourceScraping.findOrCreate({
    where: { nom: sourceName },
    defaults: {
      description: `Source de scraping: ${sourceName}`,
      actif: true,
    }
  });

  console.log(`[ScrapingController] 📌 Source utilisée: ${source.nom} (ID: ${source.id})`);

  for (const prospectData of prospects) {
    try {
      // Étape 1 : Vérifier d'abord les doublons exacts (email, URL, GPS)
      let existingProspect = await Prospect.findOne({
        where: {
          [Op.or]: [
            // Même email
            prospectData.email ? { email: prospectData.email } : null,
            // Même URL
            prospectData.url_site ? { url_site: prospectData.url_site } : null,
            // Même nom ET mêmes coordonnées GPS
            prospectData.nom_entreprise && prospectData.latitude && prospectData.longitude ? {
              nom_entreprise: prospectData.nom_entreprise,
              latitude: prospectData.latitude,
              longitude: prospectData.longitude
            } : null,
          ].filter(Boolean),
        },
        include: [
          { model: Tag, as: 'tags' },
          { model: SourceScraping, as: 'sources' }
        ]
      });

      // Étape 2 : Si pas trouvé, vérifier par nom + adresse normalisée
      if (!existingProspect && prospectData.nom_entreprise && prospectData.adresse) {
        const potentialDuplicates = await Prospect.findAll({
          where: { nom_entreprise: prospectData.nom_entreprise },
          include: [
            { model: Tag, as: 'tags' },
            { model: SourceScraping, as: 'sources' }
          ]
        });

        // Comparer les adresses normalisées
        for (const candidate of potentialDuplicates) {
          if (candidate.adresse && addressesMatch(prospectData.adresse, candidate.adresse)) {
            existingProspect = candidate;
            console.log(`[ScrapingController] 🔍 Doublon détecté via normalisation d'adresse:`);
            console.log(`   - Base: "${candidate.adresse}"`);
            console.log(`   - Nouveau: "${prospectData.adresse}"`);
            break;
          }
        }
      }

      if (existingProspect) {
        console.log(`[ScrapingController] ⚠️  Doublon détecté: ${prospectData.nom_entreprise} (${prospectData.adresse || 'pas d\'adresse'})`);

        // Vérifier si cette source est déjà associée
        const hasSource = existingProspect.sources.some(s => s.id === source.id);
        if (!hasSource) {
          await existingProspect.addSource(source);
          console.log(`[ScrapingController] ✅ Source "${source.nom}" ajoutée au prospect existant`);
        } else {
          console.log(`[ScrapingController] ℹ️  Source "${source.nom}" déjà associée à ce prospect`);
        }

        // Enrichir les données existantes au lieu de skip
        const updatedFields = {};
        let hasUpdates = false;

        // Champs à enrichir uniquement si null/vide (données stables)
        const fieldsToEnrichIfNull = [
          'adresse', 'latitude', 'longitude', 'ville', 'code_postal'
        ];

        // Champs à toujours mettre à jour si différents (données qui peuvent changer)
        const fieldsToAlwaysUpdate = ['nom_contact', 'email', 'telephone', 'url_site', 'note'];

        // 1. Enrichir les champs null/vides
        fieldsToEnrichIfNull.forEach(field => {
          const existingValue = existingProspect[field];
          const newValue = prospectData[field];

          if ((existingValue === null || existingValue === undefined || existingValue === '') &&
              newValue !== null && newValue !== undefined && newValue !== '') {
            updatedFields[field] = newValue;
            hasUpdates = true;
          }
        });

        // 2. Mettre à jour les champs qui peuvent changer (si la nouvelle valeur est différente et non vide)
        fieldsToAlwaysUpdate.forEach(field => {
          const existingValue = existingProspect[field];
          const newValue = prospectData[field];

          // Mettre à jour si:
          // 1. La nouvelle valeur n'est pas null/undefined/vide
          // 2. ET la nouvelle valeur est différente de l'existante
          if (newValue !== null && newValue !== undefined && newValue !== '' &&
              existingValue !== newValue) {
            updatedFields[field] = newValue;
            hasUpdates = true;
            console.log(`[ScrapingController] 🔄 Mise à jour de ${field}: "${existingValue}" → "${newValue}"`);
          }
        });

        if (hasUpdates) {
          await existingProspect.update(updatedFields);
          console.log(`[ScrapingController] ✅ Données enrichies: ${Object.keys(updatedFields).join(', ')}`);
        } else {
          console.log(`[ScrapingController] ℹ️  Aucune nouvelle donnée à enrichir`);
        }

        // Ajouter le tag si pas déjà présent
        const hasTag = existingProspect.tags.some(t => t.id === tag.id);
        if (!hasTag) {
          await existingProspect.addTag(tag);
          console.log(`[ScrapingController] ✅ Tag "${tag.nom}" ajouté au prospect existant`);
        }

        // Recharger avec les relations pour le retour
        await existingProspect.reload({
          include: [
            { model: Tag, as: 'tags' },
            { model: SourceScraping, as: 'sources' }
          ],
        });

        savedProspects.push(existingProspect);
        continue; // Passer au prospect suivant
      }

      // Créer le nouveau prospect (sans source_scraping dans les champs)
      const prospect = await Prospect.create({
        nom_entreprise: prospectData.nom_entreprise,
        nom_contact: prospectData.nom_contact || null,
        email: prospectData.email || null,
        telephone: prospectData.telephone || null,
        adresse: prospectData.adresse || null,
        url_site: prospectData.url_site || null,
        latitude: prospectData.latitude || null,
        longitude: prospectData.longitude || null,
        note: prospectData.note || null,
        ville: prospectData.ville || null,
        code_postal: prospectData.code_postal || null,
      });

      // Associer la source de scraping
      await prospect.addSource(source);
      console.log(`[ScrapingController] ✅ Source "${source.nom}" associée au nouveau prospect`);

      // Associer le tag
      await prospect.addTag(tag);

      // Recharger avec les relations pour le retour
      await prospect.reload({
        include: [
          { model: Tag, as: 'tags' },
          { model: SourceScraping, as: 'sources' }
        ],
      });

      savedProspects.push(prospect);
      console.log(`[ScrapingController] ✅ Nouveau prospect sauvegardé: ${prospect.nom_entreprise}`);
    } catch (error) {
      console.error(`[ScrapingController] ❌ Erreur sauvegarde prospect:`, error);
    }
  }

  return savedProspects;
}

/**
 * @route   GET /api/scraping/status/:task_id
 * @desc    Récupérer le statut d'une tâche de scraping
 * @access  Public
 */
export const getScrapingStatus = async (req, res) => {
  try {
    const { task_id } = req.params;

    const task = taskManager.getTask(task_id);

    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Tâche non trouvée: ${task_id}`,
      });
    }

    res.json({
      task_id: task.id,
      status: task.status,
      progress: task.progress,
      params: task.params,
      results: {
        total: task.results.total,
        pages_scraped: task.results.pages_scraped,
        errors: task.results.errors,
      },
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      error: task.error,
    });
  } catch (error) {
    console.error('Error getting scraping status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/scraping/cancel/:task_id
 * @desc    Annuler une tâche de scraping en cours
 * @access  Public
 */
export const cancelScraping = async (req, res) => {
  try {
    const { task_id } = req.params;

    const cancelled = taskManager.cancelTask(task_id);

    if (!cancelled) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Impossible d\'annuler cette tâche (non trouvée ou déjà terminée)',
      });
    }

    res.json({
      task_id,
      status: 'cancelled',
      message: 'Tâche annulée avec succès',
    });
  } catch (error) {
    console.error('Error cancelling scraping:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/scraping/tasks
 * @desc    Récupérer toutes les tâches de scraping
 * @access  Public
 */
export const getAllTasks = async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;

    const tasks = taskManager.getAllTasks({
      status,
      limit: parseInt(limit),
    });

    res.json({
      data: tasks,
      total: tasks.length,
    });
  } catch (error) {
    console.error('Error getting all tasks:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/scraping/stats
 * @desc    Récupérer les statistiques du gestionnaire de tâches
 * @access  Public
 */
export const getScrapingStats = async (req, res) => {
  try {
    const stats = taskManager.getStats();

    res.json(stats);
  } catch (error) {
    console.error('Error getting scraping stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};
