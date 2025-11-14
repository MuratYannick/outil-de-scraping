import express from 'express';
import {
  getConfig,
  saveConfig,
  testConfig,
  getStatus
} from '../controllers/antiBotConfigController.js';

const router = express.Router();

/**
 * Routes pour la gestion de la configuration anti-bot
 */

// GET /api/antibot/config - Récupérer la configuration actuelle
router.get('/config', getConfig);

// PUT /api/antibot/config - Sauvegarder la configuration
router.put('/config', saveConfig);

// POST /api/antibot/test - Tester la configuration actuelle
router.post('/test', testConfig);

// GET /api/antibot/status - Récupérer le statut des stratégies
router.get('/status', getStatus);

export default router;
