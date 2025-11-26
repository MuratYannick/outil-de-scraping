import taskManager from '../services/taskManager.js';
import { PagesJaunesScraper } from '../services/scrapers/pagesJaunesScraper.js';
import { getGoogleMapsService } from '../services/googleMapsService.js';
import { getLinkedInScraper } from '../services/scrapers/linkedInScraper.js';
import { Prospect, Tag } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * @route   POST /api/scraping/lancer
 * @desc    Lancer une tâche de scraping asynchrone
 * @access  Public
 */
export const lancerScraping = async (req, res) => {
  try {
    const { keyword, location, source = 'Pages Jaunes', maxPages = 1, maxResults = 10 } = req.body;

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
      maxPages,
      maxResults,
    });

    // Lancer le scraping de manière asynchrone
    scrapeAsync(task.id, keyword, location, { maxPages, maxResults, source });

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

    const { source = 'Pages Jaunes', maxPages = 1, maxResults = 10 } = options;
    let prospects = [];

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

      const result = await scraper.scrape(keyword, location, {
        maxPages,
        maxResults,
        onProgress: (progress, data) => {
          taskManager.updateTaskProgress(taskId, progress, data);
        },
      });

      prospects = result.prospects;
    }

    // Sauvegarder les prospects en base de données
    const savedProspects = await saveProspects(prospects, keyword);

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
      taskResult.pages_scraped = result?.pages_scraped || 1;
      taskResult.success = result?.success || false;
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
 * Sauvegarder les prospects en base de données
 * Gère les doublons automatiquement
 * @param {Array} prospects - Liste des prospects à sauvegarder
 * @param {string} keyword - Mot-clé pour créer un tag
 * @returns {Array} Prospects sauvegardés
 */
async function saveProspects(prospects, keyword) {
  const savedProspects = [];

  // Créer ou récupérer le tag basé sur le keyword
  const [tag] = await Tag.findOrCreate({
    where: { nom: keyword.charAt(0).toUpperCase() + keyword.slice(1) },
  });

  for (const prospectData of prospects) {
    try {
      // Vérifier les doublons par email ou URL
      const existingProspect = await Prospect.findOne({
        where: {
          [Op.or]: [
            prospectData.email ? { email: prospectData.email } : null,
            prospectData.url_site ? { url_site: prospectData.url_site } : null,
          ].filter(Boolean),
        },
      });

      if (existingProspect) {
        console.log(`[ScrapingController] Doublon détecté: ${prospectData.nom_entreprise}`);
        continue; // Skip duplicates
      }

      // Créer le prospect
      const prospect = await Prospect.create({
        nom_entreprise: prospectData.nom_entreprise,
        nom_contact: prospectData.nom_contact || null,
        email: prospectData.email || null,
        telephone: prospectData.telephone || null,
        adresse: prospectData.adresse || null,
        url_site: prospectData.url_site || null,
        source_scraping: prospectData.source_scraping || 'Pages Jaunes',
        latitude: prospectData.latitude || null,
        longitude: prospectData.longitude || null,
        note: prospectData.note || null,
        ville: prospectData.ville || null,
        code_postal: prospectData.code_postal || null,
      });

      // Associer le tag
      await prospect.addTag(tag);

      // Recharger avec les tags pour le retour
      await prospect.reload({
        include: [{ model: Tag, as: 'tags' }],
      });

      savedProspects.push(prospect);
      console.log(`[ScrapingController] Prospect sauvegardé: ${prospect.nom_entreprise}`);
    } catch (error) {
      console.error(`[ScrapingController] Erreur sauvegarde prospect:`, error);
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
