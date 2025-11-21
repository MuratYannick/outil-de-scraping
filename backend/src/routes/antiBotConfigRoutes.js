import express from 'express';
import {
  getConfig,
  getAllConfigs,
  saveConfig,
  testConfig,
  getStatus
} from '../controllers/antiBotConfigController.js';

const router = express.Router();

/**
 * Routes pour la gestion de la configuration anti-bot PAR SCRAPER
 */

// GET /api/antibot/config - Récupérer la configuration de TOUS les scrapers
router.get('/config', getAllConfigs);

// GET /api/antibot/config/:scraperId - Récupérer la configuration d'un scraper spécifique
router.get('/config/:scraperId', getConfig);

// PUT /api/antibot/config/:scraperId - Sauvegarder la configuration d'un scraper
router.put('/config/:scraperId', saveConfig);

// POST /api/antibot/test/:scraperId - Tester la configuration d'un scraper
router.post('/test/:scraperId', testConfig);

// GET /api/antibot/status - Récupérer le statut des stratégies (global + par scraper)
router.get('/status', getStatus);

export default router;
