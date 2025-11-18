import express from 'express';
import { getGoogleMapsService } from '../services/googleMapsService.js';

const router = express.Router();

/**
 * @route   GET /api/google-maps/config
 * @desc    Récupérer la configuration Google Maps actuelle
 * @access  Public
 */
router.get('/config', (req, res) => {
  try {
    const service = getGoogleMapsService();
    const config = service.getConfig();

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[GoogleMapsConfig] Error getting config:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/google-maps/config
 * @desc    Mettre à jour la stratégie Google Maps
 * @access  Public
 */
router.put('/config', (req, res) => {
  try {
    const { strategy } = req.body;

    if (!strategy) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Le paramètre "strategy" est requis',
      });
    }

    if (!['scraper', 'api'].includes(strategy)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'La stratégie doit être "scraper" ou "api"',
      });
    }

    const service = getGoogleMapsService();
    service.setStrategy(strategy);

    // Mettre à jour la variable d'environnement pour la session
    process.env.GOOGLE_MAPS_STRATEGY = strategy;

    res.json({
      success: true,
      message: `Stratégie Google Maps changée: ${strategy}`,
      config: service.getConfig(),
    });
  } catch (error) {
    console.error('[GoogleMapsConfig] Error updating config:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/google-maps/test
 * @desc    Tester la configuration actuelle
 * @access  Public
 */
router.post('/test', async (req, res) => {
  try {
    const service = getGoogleMapsService();
    const config = service.getConfig();

    if (config.strategy === 'api' && !config.apiKeyConfigured) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'GOOGLE_PLACES_API_KEY non configurée',
        suggestion: 'Veuillez ajouter votre clé API dans le fichier .env',
      });
    }

    // Test simple: rechercher "restaurant" à "Paris"
    const testResults = await service.search({
      keyword: 'restaurant',
      location: 'Paris',
      maxResults: 3,
    });

    res.json({
      success: true,
      message: `Test réussi avec la stratégie: ${config.strategy}`,
      results: {
        strategy: config.strategy,
        prospectsFound: testResults.length,
        sample: testResults.slice(0, 2), // Retourner 2 exemples
      },
    });
  } catch (error) {
    console.error('[GoogleMapsConfig] Error testing config:', error);
    res.status(500).json({
      success: false,
      error: 'Test Failed',
      message: error.message,
    });
  }
});

export default router;
