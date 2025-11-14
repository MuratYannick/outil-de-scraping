import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Controller pour gérer la configuration anti-bot
 * Permet de lire, sauvegarder et tester les configurations
 */

// Chemin vers le fichier .env
const ENV_PATH = path.resolve(__dirname, '../../.env');

/**
 * GET /api/antibot/config
 * Récupère la configuration actuelle depuis le fichier .env
 */
export async function getConfig(req, res) {
  try {
    // Lire le fichier .env
    const envConfig = dotenv.parse(fs.readFileSync(ENV_PATH));

    // Construire l'objet de configuration
    const config = {
      strategy: envConfig.ANTIBOT_STRATEGY || 'none',
      proxies: {
        enabled: envConfig.PROXY_ENABLED === 'true',
        provider: envConfig.PROXY_PROVIDER || 'custom',
        proxyList: envConfig.PROXY_LIST || '',
        rotation: envConfig.PROXY_ROTATION || 'round-robin',
        // Ne pas retourner les credentials sensibles
        hasBrightDataCreds: !!(envConfig.BRIGHTDATA_USERNAME && envConfig.BRIGHTDATA_PASSWORD),
        hasOxylabsCreds: !!(envConfig.OXYLABS_USERNAME && envConfig.OXYLABS_PASSWORD),
        hasSmartProxyCreds: !!(envConfig.SMARTPROXY_USERNAME && envConfig.SMARTPROXY_PASSWORD)
      },
      captcha: {
        enabled: envConfig.CAPTCHA_SOLVER_ENABLED === 'true',
        provider: envConfig.CAPTCHA_SOLVER_PROVIDER || '2captcha',
        hasApiKey: !!(envConfig.TWOCAPTCHA_API_KEY || envConfig.ANTICAPTCHA_API_KEY || envConfig.CAPMONSTER_API_KEY)
      },
      stealth: {
        enabled: envConfig.STEALTH_ENABLED === 'true',
        browserProfilePath: envConfig.BROWSER_PROFILE_PATH || './browser-profiles/default',
        humanBehavior: true // Toujours activé par défaut
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('[AntiBotConfigController] Erreur lecture config:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la lecture de la configuration',
      error: error.message
    });
  }
}

/**
 * PUT /api/antibot/config
 * Sauvegarde la configuration dans le fichier .env
 */
export async function saveConfig(req, res) {
  try {
    const { strategy, proxies, captcha, stealth } = req.body;

    // Lire le fichier .env actuel
    let envContent = fs.readFileSync(ENV_PATH, 'utf-8');

    // Fonction helper pour mettre à jour une ligne dans le .env
    const updateEnvLine = (key, value) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Ajouter la ligne si elle n'existe pas
        envContent += `\n${key}=${value}`;
      }
    };

    // Mettre à jour la stratégie globale
    updateEnvLine('ANTIBOT_STRATEGY', strategy);

    // Mettre à jour les proxies
    updateEnvLine('PROXY_ENABLED', proxies.enabled ? 'true' : 'false');
    if (proxies.provider) {
      updateEnvLine('PROXY_PROVIDER', proxies.provider);
    }
    if (proxies.proxyList !== undefined) {
      updateEnvLine('PROXY_LIST', proxies.proxyList);
    }
    if (proxies.rotation) {
      updateEnvLine('PROXY_ROTATION', proxies.rotation);
    }

    // Mettre à jour le CAPTCHA solver
    updateEnvLine('CAPTCHA_SOLVER_ENABLED', captcha.enabled ? 'true' : 'false');
    if (captcha.provider) {
      updateEnvLine('CAPTCHA_SOLVER_PROVIDER', captcha.provider);
    }
    // Note: API keys ne sont pas modifiées ici pour la sécurité
    // L'utilisateur doit les ajouter manuellement dans le .env

    // Mettre à jour Stealth
    updateEnvLine('STEALTH_ENABLED', stealth.enabled ? 'true' : 'false');
    if (stealth.browserProfilePath) {
      updateEnvLine('BROWSER_PROFILE_PATH', stealth.browserProfilePath);
    }

    // Sauvegarder le fichier .env
    fs.writeFileSync(ENV_PATH, envContent, 'utf-8');

    // Recharger les variables d'environnement
    dotenv.config({ override: true });

    console.log('[AntiBotConfigController] Configuration sauvegardée:', {
      strategy,
      proxies: { enabled: proxies.enabled, provider: proxies.provider },
      captcha: { enabled: captcha.enabled, provider: captcha.provider },
      stealth: { enabled: stealth.enabled }
    });

    res.json({
      success: true,
      message: 'Configuration sauvegardée avec succès',
      data: {
        strategy,
        proxies: {
          enabled: proxies.enabled,
          provider: proxies.provider
        },
        captcha: {
          enabled: captcha.enabled,
          provider: captcha.provider
        },
        stealth: {
          enabled: stealth.enabled
        }
      }
    });
  } catch (error) {
    console.error('[AntiBotConfigController] Erreur sauvegarde config:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde de la configuration',
      error: error.message
    });
  }
}

/**
 * POST /api/antibot/test
 * Lance un test de scraping avec la configuration actuelle
 */
export async function testConfig(req, res) {
  try {
    // Import dynamique du scraper
    const { PagesJaunesScraper } = await import('../services/scrapers/pagesJaunesScraper.js');

    const scraper = new PagesJaunesScraper();

    console.log('[AntiBotConfigController] Lancement test de scraping...');

    // Test simple : extraire 5 prospects de plombiers à Paris 75001
    const result = await scraper.scrape('plombier', '75001', {
      maxPages: 1,
      maxResults: 5
    });

    const isBlocked = result.prospects.length === 0;
    const success = !isBlocked;

    console.log('[AntiBotConfigController] Test terminé:', {
      success,
      prospectsCount: result.prospects.length,
      blocked: isBlocked
    });

    res.json({
      success: true,
      data: {
        testSuccess: success,
        blocked: isBlocked,
        prospectsExtracted: result.prospects.length,
        message: isBlocked
          ? 'Le scraping a été bloqué par Pages Jaunes. La configuration actuelle est insuffisante.'
          : `Test réussi ! ${result.prospects.length} prospect(s) extrait(s).`,
        prospects: result.prospects.slice(0, 3), // Retourner seulement les 3 premiers pour l'exemple
        metadata: {
          totalPages: result.metadata.totalPages,
          currentPage: result.metadata.currentPage,
          executionTime: result.metadata.executionTime
        }
      }
    });
  } catch (error) {
    console.error('[AntiBotConfigController] Erreur test:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test de scraping',
      error: error.message,
      data: {
        testSuccess: false,
        blocked: true,
        prospectsExtracted: 0
      }
    });
  }
}

/**
 * GET /api/antibot/status
 * Récupère le statut des différentes stratégies anti-bot
 */
export async function getStatus(req, res) {
  try {
    const envConfig = dotenv.parse(fs.readFileSync(ENV_PATH));

    const status = {
      proxies: {
        architecture: 'complete',
        tested: true,
        freeProxiesResult: 'blocked',
        paidProxiesResult: 'pending',
        needsCredentials: true
      },
      captcha: {
        architecture: 'complete',
        tested: true,
        detectionValidated: true,
        pagesJaunesResult: 'pending',
        needsApiKey: !(envConfig.TWOCAPTCHA_API_KEY || envConfig.ANTICAPTCHA_API_KEY || envConfig.CAPMONSTER_API_KEY)
      },
      stealth: {
        architecture: 'complete',
        tested: true,
        botSannysoftResult: '93% (52/56)',
        pagesJaunesResult: 'insufficient',
        recommendation: 'Must combine with Proxies or CAPTCHA'
      },
      hybrid: {
        ready: true,
        needsProxiesOrCaptcha: true
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('[AntiBotConfigController] Erreur status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut',
      error: error.message
    });
  }
}
