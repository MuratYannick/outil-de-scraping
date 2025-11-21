import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  SCRAPER_IDS,
  ANTIBOT_STRATEGIES,
  getScraperConfig,
  updateScraperConfig,
  antiBotConfig
} from '../config/antiBotConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Controller pour gérer la configuration anti-bot PAR SCRAPER
 * Permet de lire, sauvegarder et tester les configurations
 */

// Chemin vers le fichier .env
const ENV_PATH = path.resolve(__dirname, '../../.env');

/**
 * GET /api/antibot/config/:scraperId
 * Récupère la configuration d'un scraper spécifique
 */
export async function getConfig(req, res) {
  try {
    const { scraperId } = req.params;

    // Valider le scraper ID
    const validIds = Object.values(SCRAPER_IDS);
    if (!validIds.includes(scraperId)) {
      return res.status(400).json({
        success: false,
        message: `Scraper invalide. Valeurs acceptées: ${validIds.join(', ')}`
      });
    }

    // Récupérer la configuration du scraper
    const scraperConfig = getScraperConfig(scraperId);

    // Construire l'objet de réponse
    const config = {
      scraperId,
      strategy: scraperConfig.activeStrategy,
      proxies: {
        enabled: scraperConfig.proxies.enabled,
        provider: scraperConfig.proxies.provider || 'custom',
        proxyList: scraperConfig.proxies.customList.join('\n'),
        rotation: scraperConfig.proxies.rotation,
        // Ne pas retourner les credentials sensibles
        hasBrightDataCreds: !!(
          antiBotConfig.sharedProviders.proxies.brightdata.username &&
          antiBotConfig.sharedProviders.proxies.brightdata.password
        ),
        hasOxylabsCreds: !!(
          antiBotConfig.sharedProviders.proxies.oxylabs.username &&
          antiBotConfig.sharedProviders.proxies.oxylabs.password
        ),
        hasSmartProxyCreds: !!(
          antiBotConfig.sharedProviders.proxies.smartproxy.username &&
          antiBotConfig.sharedProviders.proxies.smartproxy.password
        )
      },
      captcha: {
        enabled: scraperConfig.captchaSolver.enabled,
        provider: scraperConfig.captchaSolver.provider || '2captcha',
        hasApiKey: !!(
          antiBotConfig.sharedProviders.captchaSolver['2captcha'].apiKey ||
          antiBotConfig.sharedProviders.captchaSolver.anticaptcha.apiKey ||
          antiBotConfig.sharedProviders.captchaSolver.capmonster.apiKey
        )
      },
      stealth: {
        enabled: scraperConfig.stealth.enabled,
        browserProfilePath: scraperConfig.stealth.persistentProfile.path,
        humanBehavior: scraperConfig.stealth.humanBehavior.enabled
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
 * GET /api/antibot/config
 * Récupère la configuration de TOUS les scrapers
 */
export async function getAllConfigs(req, res) {
  try {
    const configs = {};

    // Récupérer la config de chaque scraper
    for (const scraperId of Object.values(SCRAPER_IDS)) {
      const scraperConfig = getScraperConfig(scraperId);

      configs[scraperId] = {
        scraperId,
        strategy: scraperConfig.activeStrategy,
        proxies: {
          enabled: scraperConfig.proxies.enabled,
          provider: scraperConfig.proxies.provider || 'custom',
          proxyList: scraperConfig.proxies.customList.join('\n'),
          rotation: scraperConfig.proxies.rotation
        },
        captcha: {
          enabled: scraperConfig.captchaSolver.enabled,
          provider: scraperConfig.captchaSolver.provider || '2captcha'
        },
        stealth: {
          enabled: scraperConfig.stealth.enabled,
          browserProfilePath: scraperConfig.stealth.persistentProfile.path,
          humanBehavior: scraperConfig.stealth.humanBehavior.enabled
        }
      };
    }

    res.json({
      success: true,
      data: configs,
      scrapers: Object.values(SCRAPER_IDS)
    });
  } catch (error) {
    console.error('[AntiBotConfigController] Erreur lecture configs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la lecture des configurations',
      error: error.message
    });
  }
}

/**
 * PUT /api/antibot/config/:scraperId
 * Sauvegarde la configuration d'un scraper spécifique
 */
export async function saveConfig(req, res) {
  try {
    const { scraperId } = req.params;
    const { strategy, proxies, captcha, stealth } = req.body;

    // Valider le scraper ID
    const validIds = Object.values(SCRAPER_IDS);
    if (!validIds.includes(scraperId)) {
      return res.status(400).json({
        success: false,
        message: `Scraper invalide. Valeurs acceptées: ${validIds.join(', ')}`
      });
    }

    // Préparer la nouvelle configuration
    const newConfig = {
      activeStrategy: strategy,
      proxies: {
        enabled: proxies.enabled,
        provider: proxies.provider,
        customList: proxies.proxyList ? proxies.proxyList.split('\n').filter(p => p.trim()) : [],
        rotation: proxies.rotation || 'round-robin'
      },
      captchaSolver: {
        enabled: captcha.enabled,
        provider: captcha.provider
        // Note: apiKey est stocké dans sharedProviders, pas ici
      },
      stealth: {
        enabled: stealth.enabled,
        persistentProfile: {
          enabled: true,
          path: stealth.browserProfilePath || './browser-profiles/default'
        },
        humanBehavior: {
          enabled: stealth.humanBehavior !== undefined ? stealth.humanBehavior : true
        }
      }
    };

    // Mettre à jour la configuration du scraper
    updateScraperConfig(scraperId, newConfig);

    // Sauvegarder dans le .env pour persistance (optionnel)
    await updateEnvFile(scraperId, strategy, proxies, captcha, stealth);

    console.log(`[AntiBotConfigController] Configuration sauvegardée pour ${scraperId}:`, {
      strategy,
      proxies: { enabled: proxies.enabled, provider: proxies.provider },
      captcha: { enabled: captcha.enabled, provider: captcha.provider },
      stealth: { enabled: stealth.enabled }
    });

    res.json({
      success: true,
      message: `Configuration sauvegardée avec succès pour ${scraperId}`,
      data: {
        scraperId,
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
 * Helper: Mettre à jour le fichier .env avec la config d'un scraper
 */
async function updateEnvFile(scraperId, strategy, proxies, captcha, stealth) {
  try {
    let envContent = fs.readFileSync(ENV_PATH, 'utf-8');

    const updateEnvLine = (key, value) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    };

    // Format de clé : ANTIBOT_STRATEGY_PAGES_JAUNES, ANTIBOT_STRATEGY_GOOGLE_MAPS, etc.
    const scraperEnvKey = `ANTIBOT_STRATEGY_${scraperId.replace(/([A-Z])/g, '_$1').toUpperCase()}`.replace('__', '_');
    updateEnvLine(scraperEnvKey, strategy);

    // Mettre à jour les flags enabled pour ce scraper
    const scraperPrefix = scraperId.toUpperCase().replace(/([A-Z])/g, '_$1').replace('__', '_');

    // Note: Pour simplifier, on garde les configs proxies/captcha/stealth partagées
    // On pourrait aussi créer des variables par scraper si nécessaire

    updateEnvLine('PROXY_ENABLED', proxies.enabled ? 'true' : 'false');
    if (proxies.provider) {
      updateEnvLine('PROXY_PROVIDER', proxies.provider);
    }
    if (proxies.proxyList !== undefined) {
      updateEnvLine('PROXY_LIST', proxies.proxyList.replace(/\n/g, ','));
    }
    if (proxies.rotation) {
      updateEnvLine('PROXY_ROTATION', proxies.rotation);
    }

    updateEnvLine('CAPTCHA_SOLVER_ENABLED', captcha.enabled ? 'true' : 'false');
    if (captcha.provider) {
      updateEnvLine('CAPTCHA_SOLVER_PROVIDER', captcha.provider);
    }

    updateEnvLine('STEALTH_ENABLED', stealth.enabled ? 'true' : 'false');
    if (stealth.browserProfilePath) {
      updateEnvLine('BROWSER_PROFILE_PATH', stealth.browserProfilePath);
    }

    fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
    dotenv.config({ override: true });

    console.log(`[AntiBotConfigController] .env mis à jour pour ${scraperId}`);
  } catch (error) {
    console.error('[AntiBotConfigController] Erreur update .env:', error);
    // Ne pas faire échouer la requête si le .env échoue
  }
}

/**
 * POST /api/antibot/test/:scraperId
 * Lance un test de scraping avec la configuration d'un scraper spécifique
 */
export async function testConfig(req, res) {
  try {
    const { scraperId } = req.params;

    // Valider le scraper ID
    const validIds = Object.values(SCRAPER_IDS);
    if (!validIds.includes(scraperId)) {
      return res.status(400).json({
        success: false,
        message: `Scraper invalide. Valeurs acceptées: ${validIds.join(', ')}`
      });
    }

    let scraper;
    let testParams;

    // Charger le scraper approprié
    switch (scraperId) {
      case SCRAPER_IDS.PAGES_JAUNES:
        const { PagesJaunesScraper } = await import('../services/scrapers/pagesJaunesScraper.js');
        scraper = new PagesJaunesScraper();
        testParams = { keyword: 'plombier', location: '75001', maxPages: 1, maxResults: 5 };
        break;

      case SCRAPER_IDS.GOOGLE_MAPS:
        const { scrapeGoogleMaps } = await import('../services/googleMapsService.js');
        // Test avec le scraper Playwright (pas l'API)
        console.log('[AntiBotConfigController] Test Google Maps scraper...');
        const gmResult = await scrapeGoogleMaps('plombier', 'Paris', { maxResults: 5 });
        return res.json({
          success: true,
          data: {
            testSuccess: gmResult.success,
            blocked: !gmResult.success,
            prospectsExtracted: gmResult.prospects?.length || 0,
            message: gmResult.success
              ? `Test réussi ! ${gmResult.prospects.length} prospect(s) extrait(s).`
              : 'Le scraping a été bloqué.',
            prospects: gmResult.prospects?.slice(0, 3) || []
          }
        });

      case SCRAPER_IDS.LINKEDIN:
        const { LinkedInScraper } = await import('../services/scrapers/linkedInScraper.js');
        scraper = new LinkedInScraper();
        testParams = { keyword: 'développeur', location: 'Paris', maxResults: 5 };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Scraper non supporté pour les tests'
        });
    }

    console.log(`[AntiBotConfigController] Lancement test de scraping pour ${scraperId}...`);

    // Lancer le test
    const result = await scraper.scrape(
      testParams.keyword,
      testParams.location,
      { maxPages: testParams.maxPages, maxResults: testParams.maxResults }
    );

    const isBlocked = result.prospects.length === 0;
    const success = !isBlocked;

    console.log(`[AntiBotConfigController] Test ${scraperId} terminé:`, {
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
          ? `Le scraping a été bloqué par ${scraperId}. La configuration actuelle est insuffisante.`
          : `Test réussi ! ${result.prospects.length} prospect(s) extrait(s).`,
        prospects: result.prospects.slice(0, 3),
        metadata: result.metadata || {}
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
 * Récupère le statut des différentes stratégies anti-bot (global)
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
        needsApiKey: !(
          envConfig.TWOCAPTCHA_API_KEY ||
          envConfig.ANTICAPTCHA_API_KEY ||
          envConfig.CAPMONSTER_API_KEY
        )
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
      },
      scrapers: {}
    };

    // Ajouter le statut de chaque scraper
    for (const scraperId of Object.values(SCRAPER_IDS)) {
      const scraperConfig = getScraperConfig(scraperId);
      status.scrapers[scraperId] = {
        activeStrategy: scraperConfig.activeStrategy,
        proxiesEnabled: scraperConfig.proxies.enabled,
        captchaEnabled: scraperConfig.captchaSolver.enabled,
        stealthEnabled: scraperConfig.stealth.enabled
      };
    }

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
