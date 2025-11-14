import axios from 'axios';
import { antiBotConfig } from '../config/antiBotConfig.js';

/**
 * Service de résolution automatique de CAPTCHA
 * Support pour 2Captcha, Anti-Captcha et CapMonster
 */

class CaptchaSolverService {
  constructor() {
    this.config = antiBotConfig.captchaSolver;
    this.provider = this.config.provider;
    this.initialized = false;
  }

  /**
   * Initialise le service de résolution CAPTCHA
   */
  async initialize() {
    if (this.initialized) {
      console.log('[CaptchaSolver] Déjà initialisé');
      return;
    }

    if (!this.config.enabled) {
      console.log('[CaptchaSolver] Service désactivé');
      return;
    }

    if (!this.provider) {
      throw new Error('Aucun provider de CAPTCHA solver configuré');
    }

    // Valider la configuration du provider
    await this._validateProvider();

    this.initialized = true;
    console.log(`[CaptchaSolver] ✓ Service initialisé avec provider: ${this.provider}`);
  }

  /**
   * Valide la configuration du provider sélectionné
   * @private
   */
  async _validateProvider() {
    switch (this.provider) {
      case '2captcha':
        if (!this.config['2captcha'].apiKey) {
          throw new Error('API Key 2Captcha manquante');
        }
        break;

      case 'anticaptcha':
        if (!this.config.anticaptcha.apiKey) {
          throw new Error('API Key Anti-Captcha manquante');
        }
        break;

      case 'capmonster':
        if (!this.config.capmonster.apiKey) {
          throw new Error('API Key CapMonster manquante');
        }
        break;

      default:
        throw new Error(`Provider CAPTCHA non supporté: ${this.provider}`);
    }
  }

  /**
   * Détecte la présence d'un CAPTCHA sur la page
   * @param {Page} page - Page Playwright
   * @returns {Object|null} Informations sur le CAPTCHA détecté
   */
  async detectCaptcha(page) {
    try {
      // Détection reCAPTCHA v2
      const recaptchaV2 = await page.locator('iframe[src*="recaptcha/api2"]').count();
      if (recaptchaV2 > 0) {
        const siteKey = await this._extractRecaptchaV2SiteKey(page);
        return {
          type: 'recaptcha_v2',
          siteKey,
          pageUrl: page.url()
        };
      }

      // Détection reCAPTCHA v3
      const recaptchaV3 = await page.locator('script[src*="recaptcha/api.js"]').count();
      if (recaptchaV3 > 0) {
        const siteKey = await this._extractRecaptchaV3SiteKey(page);
        return {
          type: 'recaptcha_v3',
          siteKey,
          pageUrl: page.url()
        };
      }

      // Détection hCaptcha
      const hcaptcha = await page.locator('iframe[src*="hcaptcha.com"]').count();
      if (hcaptcha > 0) {
        const siteKey = await this._extractHCaptchaSiteKey(page);
        return {
          type: 'hcaptcha',
          siteKey,
          pageUrl: page.url()
        };
      }

      // Détection image CAPTCHA générique
      const imageCaptcha = await page.locator('img[alt*="captcha"], img[src*="captcha"]').count();
      if (imageCaptcha > 0) {
        const imageUrl = await page.locator('img[alt*="captcha"], img[src*="captcha"]').first().getAttribute('src');
        return {
          type: 'image_captcha',
          imageUrl,
          pageUrl: page.url()
        };
      }

      return null;
    } catch (error) {
      console.error('[CaptchaSolver] Erreur détection CAPTCHA:', error.message);
      return null;
    }
  }

  /**
   * Extrait la clé du site pour reCAPTCHA v2
   * @private
   */
  async _extractRecaptchaV2SiteKey(page) {
    try {
      const siteKey = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[src*="recaptcha/api2"]');
        if (iframe) {
          const src = iframe.getAttribute('src');
          const match = src.match(/k=([^&]+)/);
          return match ? match[1] : null;
        }
        return null;
      });
      return siteKey;
    } catch (error) {
      console.error('[CaptchaSolver] Erreur extraction siteKey reCAPTCHA v2:', error.message);
      return null;
    }
  }

  /**
   * Extrait la clé du site pour reCAPTCHA v3
   * @private
   */
  async _extractRecaptchaV3SiteKey(page) {
    try {
      const siteKey = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const text = script.textContent || '';
          const match = text.match(/grecaptcha\.execute\(['"]([^'"]+)['"]/);
          if (match) return match[1];
        }
        return null;
      });
      return siteKey;
    } catch (error) {
      console.error('[CaptchaSolver] Erreur extraction siteKey reCAPTCHA v3:', error.message);
      return null;
    }
  }

  /**
   * Extrait la clé du site pour hCaptcha
   * @private
   */
  async _extractHCaptchaSiteKey(page) {
    try {
      const siteKey = await page.evaluate(() => {
        const element = document.querySelector('[data-sitekey]');
        return element ? element.getAttribute('data-sitekey') : null;
      });
      return siteKey;
    } catch (error) {
      console.error('[CaptchaSolver] Erreur extraction siteKey hCaptcha:', error.message);
      return null;
    }
  }

  /**
   * Résout un CAPTCHA détecté
   * @param {Object} captchaInfo - Informations sur le CAPTCHA
   * @returns {Promise<string>} Token de résolution
   */
  async solveCaptcha(captchaInfo) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[CaptchaSolver] Résolution CAPTCHA type: ${captchaInfo.type}`);

    switch (this.provider) {
      case '2captcha':
        return await this._solve2Captcha(captchaInfo);

      case 'anticaptcha':
        return await this._solveAntiCaptcha(captchaInfo);

      case 'capmonster':
        return await this._solveCapMonster(captchaInfo);

      default:
        throw new Error(`Provider non supporté: ${this.provider}`);
    }
  }

  /**
   * Résolution avec 2Captcha
   * @private
   */
  async _solve2Captcha(captchaInfo) {
    const config = this.config['2captcha'];
    const baseUrl = 'https://2captcha.com';

    try {
      // Étape 1: Soumettre le CAPTCHA
      const submitUrl = `${baseUrl}/in.php`;
      const submitParams = {
        key: config.apiKey,
        json: 1
      };

      if (captchaInfo.type === 'recaptcha_v2') {
        submitParams.method = 'userrecaptcha';
        submitParams.googlekey = captchaInfo.siteKey;
        submitParams.pageurl = captchaInfo.pageUrl;
      } else if (captchaInfo.type === 'recaptcha_v3') {
        submitParams.method = 'userrecaptcha';
        submitParams.version = 'v3';
        submitParams.googlekey = captchaInfo.siteKey;
        submitParams.pageurl = captchaInfo.pageUrl;
        submitParams.action = 'verify';
        submitParams.min_score = 0.3;
      } else if (captchaInfo.type === 'hcaptcha') {
        submitParams.method = 'hcaptcha';
        submitParams.sitekey = captchaInfo.siteKey;
        submitParams.pageurl = captchaInfo.pageUrl;
      } else if (captchaInfo.type === 'image_captcha') {
        // Télécharger l'image et l'encoder en base64
        const imageBase64 = await this._downloadImageAsBase64(captchaInfo.imageUrl);
        submitParams.method = 'base64';
        submitParams.body = imageBase64;
      }

      console.log('[CaptchaSolver] Soumission du CAPTCHA à 2Captcha...');
      const submitResponse = await axios.post(submitUrl, null, { params: submitParams });

      if (submitResponse.data.status !== 1) {
        throw new Error(`2Captcha error: ${submitResponse.data.request}`);
      }

      const captchaId = submitResponse.data.request;
      console.log(`[CaptchaSolver] CAPTCHA soumis, ID: ${captchaId}`);

      // Étape 2: Polling pour obtenir le résultat
      const resultUrl = `${baseUrl}/res.php`;
      const startTime = Date.now();
      const timeout = config.timeout;

      while (Date.now() - startTime < timeout) {
        await this._delay(config.pollingInterval);

        console.log('[CaptchaSolver] Vérification du statut de résolution...');
        const resultResponse = await axios.get(resultUrl, {
          params: {
            key: config.apiKey,
            action: 'get',
            id: captchaId,
            json: 1
          }
        });

        if (resultResponse.data.status === 1) {
          const solution = resultResponse.data.request;
          console.log('[CaptchaSolver] ✓ CAPTCHA résolu avec succès');
          return solution;
        }

        if (resultResponse.data.request !== 'CAPCHA_NOT_READY') {
          throw new Error(`2Captcha error: ${resultResponse.data.request}`);
        }
      }

      throw new Error('Timeout: CAPTCHA non résolu dans le délai imparti');
    } catch (error) {
      console.error('[CaptchaSolver] ❌ Erreur 2Captcha:', error.message);
      throw error;
    }
  }

  /**
   * Résolution avec Anti-Captcha
   * @private
   */
  async _solveAntiCaptcha(captchaInfo) {
    const config = this.config.anticaptcha;
    const baseUrl = 'https://api.anti-captcha.com';

    try {
      // Étape 1: Créer la tâche
      const createTaskUrl = `${baseUrl}/createTask`;
      const task = {
        clientKey: config.apiKey,
        task: {}
      };

      if (captchaInfo.type === 'recaptcha_v2') {
        task.task = {
          type: 'RecaptchaV2TaskProxyless',
          websiteURL: captchaInfo.pageUrl,
          websiteKey: captchaInfo.siteKey
        };
      } else if (captchaInfo.type === 'recaptcha_v3') {
        task.task = {
          type: 'RecaptchaV3TaskProxyless',
          websiteURL: captchaInfo.pageUrl,
          websiteKey: captchaInfo.siteKey,
          minScore: 0.3
        };
      } else if (captchaInfo.type === 'hcaptcha') {
        task.task = {
          type: 'HCaptchaTaskProxyless',
          websiteURL: captchaInfo.pageUrl,
          websiteKey: captchaInfo.siteKey
        };
      }

      console.log('[CaptchaSolver] Création de la tâche Anti-Captcha...');
      const createResponse = await axios.post(createTaskUrl, task);

      if (createResponse.data.errorId !== 0) {
        throw new Error(`Anti-Captcha error: ${createResponse.data.errorDescription}`);
      }

      const taskId = createResponse.data.taskId;
      console.log(`[CaptchaSolver] Tâche créée, ID: ${taskId}`);

      // Étape 2: Polling pour obtenir le résultat
      const getResultUrl = `${baseUrl}/getTaskResult`;
      const startTime = Date.now();

      while (Date.now() - startTime < config.timeout) {
        await this._delay(config.pollingInterval);

        console.log('[CaptchaSolver] Vérification du statut...');
        const resultResponse = await axios.post(getResultUrl, {
          clientKey: config.apiKey,
          taskId: taskId
        });

        if (resultResponse.data.status === 'ready') {
          const solution = resultResponse.data.solution.gRecaptchaResponse || resultResponse.data.solution.token;
          console.log('[CaptchaSolver] ✓ CAPTCHA résolu avec succès');
          return solution;
        }

        if (resultResponse.data.errorId !== 0) {
          throw new Error(`Anti-Captcha error: ${resultResponse.data.errorDescription}`);
        }
      }

      throw new Error('Timeout: CAPTCHA non résolu dans le délai imparti');
    } catch (error) {
      console.error('[CaptchaSolver] ❌ Erreur Anti-Captcha:', error.message);
      throw error;
    }
  }

  /**
   * Résolution avec CapMonster
   * @private
   */
  async _solveCapMonster(captchaInfo) {
    const config = this.config.capmonster;
    const baseUrl = 'https://api.capmonster.cloud';

    try {
      // Étape 1: Créer la tâche
      const createTaskUrl = `${baseUrl}/createTask`;
      const task = {
        clientKey: config.apiKey,
        task: {}
      };

      if (captchaInfo.type === 'recaptcha_v2') {
        task.task = {
          type: 'RecaptchaV2TaskProxyless',
          websiteURL: captchaInfo.pageUrl,
          websiteKey: captchaInfo.siteKey
        };
      } else if (captchaInfo.type === 'recaptcha_v3') {
        task.task = {
          type: 'RecaptchaV3TaskProxyless',
          websiteURL: captchaInfo.pageUrl,
          websiteKey: captchaInfo.siteKey,
          minScore: 0.3
        };
      } else if (captchaInfo.type === 'hcaptcha') {
        task.task = {
          type: 'HCaptchaTaskProxyless',
          websiteURL: captchaInfo.pageUrl,
          websiteKey: captchaInfo.siteKey
        };
      }

      console.log('[CaptchaSolver] Création de la tâche CapMonster...');
      const createResponse = await axios.post(createTaskUrl, task);

      if (createResponse.data.errorId !== 0) {
        throw new Error(`CapMonster error: ${createResponse.data.errorDescription}`);
      }

      const taskId = createResponse.data.taskId;
      console.log(`[CaptchaSolver] Tâche créée, ID: ${taskId}`);

      // Étape 2: Polling pour obtenir le résultat
      const getResultUrl = `${baseUrl}/getTaskResult`;
      const startTime = Date.now();

      while (Date.now() - startTime < config.timeout) {
        await this._delay(config.pollingInterval);

        console.log('[CaptchaSolver] Vérification du statut...');
        const resultResponse = await axios.post(getResultUrl, {
          clientKey: config.apiKey,
          taskId: taskId
        });

        if (resultResponse.data.status === 'ready') {
          const solution = resultResponse.data.solution.gRecaptchaResponse || resultResponse.data.solution.token;
          console.log('[CaptchaSolver] ✓ CAPTCHA résolu avec succès');
          return solution;
        }

        if (resultResponse.data.errorId !== 0) {
          throw new Error(`CapMonster error: ${resultResponse.data.errorDescription}`);
        }
      }

      throw new Error('Timeout: CAPTCHA non résolu dans le délai imparti');
    } catch (error) {
      console.error('[CaptchaSolver] ❌ Erreur CapMonster:', error.message);
      throw error;
    }
  }

  /**
   * Télécharge une image et la convertit en base64
   * @private
   */
  async _downloadImageAsBase64(imageUrl) {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      return base64;
    } catch (error) {
      console.error('[CaptchaSolver] Erreur téléchargement image:', error.message);
      throw error;
    }
  }

  /**
   * Injecte la solution du CAPTCHA dans la page
   * @param {Page} page - Page Playwright
   * @param {string} solution - Token de résolution
   * @param {string} captchaType - Type de CAPTCHA
   */
  async injectSolution(page, solution, captchaType) {
    try {
      console.log('[CaptchaSolver] Injection de la solution dans la page...');

      if (captchaType === 'recaptcha_v2' || captchaType === 'recaptcha_v3') {
        await page.evaluate((token) => {
          document.getElementById('g-recaptcha-response').innerHTML = token;
        }, solution);
      } else if (captchaType === 'hcaptcha') {
        await page.evaluate((token) => {
          document.querySelector('[name="h-captcha-response"]').value = token;
        }, solution);
      }

      console.log('[CaptchaSolver] ✓ Solution injectée');
    } catch (error) {
      console.error('[CaptchaSolver] Erreur injection solution:', error.message);
      throw error;
    }
  }

  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Récupère les statistiques du service
   */
  getStats() {
    return {
      initialized: this.initialized,
      enabled: this.config.enabled,
      provider: this.provider
    };
  }
}

// Instance singleton
let captchaSolverServiceInstance = null;

/**
 * Récupère l'instance singleton du service
 */
export function getCaptchaSolverService() {
  if (!captchaSolverServiceInstance) {
    captchaSolverServiceInstance = new CaptchaSolverService();
  }
  return captchaSolverServiceInstance;
}

/**
 * Réinitialise l'instance (utile pour les tests)
 */
export function resetCaptchaSolverService() {
  captchaSolverServiceInstance = null;
}

export default CaptchaSolverService;
