import express from 'express';
import {
  lancerScraping,
  getScrapingStatus,
  cancelScraping,
  getAllTasks,
  getScrapingStats,
} from '../controllers/scrapingController.js';

const router = express.Router();

/**
 * @route   POST /api/scraping/lancer
 * @desc    Lancer une nouvelle tâche de scraping
 * @body    { keyword, location, source?, maxPages?, maxResults? }
 */
router.post('/lancer', lancerScraping);

/**
 * @route   GET /api/scraping/status/:task_id
 * @desc    Récupérer le statut d'une tâche
 */
router.get('/status/:task_id', getScrapingStatus);

/**
 * @route   POST /api/scraping/cancel/:task_id
 * @desc    Annuler une tâche en cours
 */
router.post('/cancel/:task_id', cancelScraping);

/**
 * @route   GET /api/scraping/tasks
 * @desc    Récupérer toutes les tâches (avec filtres optionnels)
 * @query   { status?, limit? }
 */
router.get('/tasks', getAllTasks);

/**
 * @route   GET /api/scraping/stats
 * @desc    Récupérer les statistiques du gestionnaire de tâches
 */
router.get('/stats', getScrapingStats);

export default router;
