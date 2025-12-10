/**
 * Utilitaires de gestion des délais et temporisation
 * Centralise toutes les fonctions liées au timing pour éviter la duplication
 * @module timingUtils
 */

/**
 * Attend un délai spécifique
 *
 * @param {number} ms - Durée en millisecondes
 * @returns {Promise<void>} Promise qui se résout après le délai
 *
 * @example
 * await delay(1000); // Attend 1 seconde
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attend un délai aléatoire entre min et max
 * Utile pour simuler un comportement humain
 *
 * @param {number} min - Durée minimum en millisecondes (défaut: 1000)
 * @param {number} max - Durée maximum en millisecondes (défaut: 3000)
 * @param {boolean} log - Afficher un log du délai généré (défaut: false)
 * @returns {Promise<number>} Promise qui se résout avec le délai réellement attendu
 *
 * @example
 * await randomDelay(500, 2000); // Attend entre 0.5 et 2 secondes
 * const waited = await randomDelay(1000, 5000, true); // Avec log
 */
export async function randomDelay(min = 1000, max = 3000, log = false) {
  const delayMs = Math.floor(Math.random() * (max - min + 1)) + min;

  if (log) {
    console.log(`[TimingUtils] ⏳ Délai aléatoire: ${delayMs}ms (min: ${min}ms, max: ${max}ms)`);
  }

  await delay(delayMs);
  return delayMs;
}

/**
 * Attend avec un délai exponentiel (backoff) en cas d'erreur
 * Utile pour gérer les retry après échec
 *
 * @param {number} attemptNumber - Numéro de la tentative (commence à 0)
 * @param {Object} options - Options de backoff
 * @param {number} options.baseDelay - Délai de base en ms (défaut: 1000)
 * @param {number} options.maxDelay - Délai maximum en ms (défaut: 30000)
 * @param {number} options.factor - Facteur multiplicateur (défaut: 2)
 * @param {boolean} options.jitter - Ajouter du jitter aléatoire (défaut: true)
 * @returns {Promise<number>} Promise qui se résout avec le délai attendu
 *
 * @example
 * // Tentative 0: ~1s, tentative 1: ~2s, tentative 2: ~4s
 * for (let i = 0; i < 3; i++) {
 *   try {
 *     await riskyOperation();
 *     break;
 *   } catch (error) {
 *     await waitWithBackoff(i);
 *   }
 * }
 */
export async function waitWithBackoff(attemptNumber, options = {}) {
  const {
    baseDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    jitter = true
  } = options;

  // Calcul du délai exponentiel
  let delayMs = Math.min(baseDelay * Math.pow(factor, attemptNumber), maxDelay);

  // Ajouter du jitter aléatoire (±20%) pour éviter les thundering herd
  if (jitter) {
    const jitterAmount = delayMs * 0.2;
    delayMs += (Math.random() * 2 * jitterAmount) - jitterAmount;
  }

  delayMs = Math.floor(delayMs);

  console.log(`[TimingUtils] 🔄 Backoff tentative ${attemptNumber + 1}: ${delayMs}ms`);

  await delay(delayMs);
  return delayMs;
}

/**
 * Attend avec un timeout maximum
 * Lève une erreur si le délai dépasse le timeout
 *
 * @param {Promise} promise - Promise à attendre
 * @param {number} timeoutMs - Timeout en millisecondes
 * @param {string} errorMessage - Message d'erreur personnalisé (optionnel)
 * @returns {Promise<any>} Résultat de la promise
 * @throws {Error} Si le timeout est dépassé
 *
 * @example
 * try {
 *   const result = await waitWithTimeout(fetchData(), 5000);
 * } catch (error) {
 *   console.error('Timeout atteint:', error);
 * }
 */
export async function waitWithTimeout(promise, timeoutMs, errorMessage = `Timeout de ${timeoutMs}ms dépassé`) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Attend que la condition soit vraie avec polling
 * Utile pour attendre qu'un élément apparaisse, qu'un état change, etc.
 *
 * @param {Function} conditionFn - Fonction qui retourne true quand la condition est remplie
 * @param {Object} options - Options de polling
 * @param {number} options.interval - Intervalle entre les vérifications en ms (défaut: 100)
 * @param {number} options.timeout - Timeout maximum en ms (défaut: 30000)
 * @param {string} options.timeoutMessage - Message d'erreur si timeout (optionnel)
 * @returns {Promise<void>}
 * @throws {Error} Si le timeout est dépassé
 *
 * @example
 * await waitForCondition(
 *   () => document.querySelector('.loaded'),
 *   { interval: 200, timeout: 5000 }
 * );
 */
export async function waitForCondition(conditionFn, options = {}) {
  const {
    interval = 100,
    timeout = 30000,
    timeoutMessage = `Condition non remplie après ${timeout}ms`
  } = options;

  const startTime = Date.now();

  while (true) {
    // Vérifier la condition
    const result = await Promise.resolve(conditionFn());
    if (result) {
      return;
    }

    // Vérifier le timeout
    if (Date.now() - startTime > timeout) {
      throw new Error(timeoutMessage);
    }

    // Attendre avant la prochaine vérification
    await delay(interval);
  }
}

/**
 * Throttle: Limite l'exécution d'une fonction à un maximum par période
 * Utile pour limiter le taux d'appels API
 *
 * @param {Function} fn - Fonction à throttler
 * @param {number} limitMs - Période minimum entre deux exécutions en ms
 * @returns {Function} Fonction throttled
 *
 * @example
 * const throttledFetch = throttle(fetchData, 1000);
 * // Même appelé plusieurs fois, s'exécute max 1 fois par seconde
 */
export function throttle(fn, limitMs) {
  let lastCall = 0;
  let timeoutId = null;

  return async function (...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= limitMs) {
      lastCall = now;
      return await fn.apply(this, args);
    } else {
      // Attendre le temps restant
      const waitTime = limitMs - timeSinceLastCall;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      return new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          lastCall = Date.now();
          resolve(await fn.apply(this, args));
        }, waitTime);
      });
    }
  };
}

/**
 * Debounce: Retarde l'exécution d'une fonction jusqu'à ce qu'elle ne soit plus appelée
 * Utile pour les champs de recherche, events de scroll, etc.
 *
 * @param {Function} fn - Fonction à debouncer
 * @param {number} delayMs - Délai en ms
 * @returns {Function} Fonction debouncée
 *
 * @example
 * const debouncedSearch = debounce(search, 300);
 * // N'exécute search que 300ms après le dernier appel
 */
export function debounce(fn, delayMs) {
  let timeoutId = null;

  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        resolve(await fn.apply(this, args));
      }, delayMs);
    });
  };
}

/**
 * Mesure le temps d'exécution d'une fonction
 *
 * @param {Function} fn - Fonction à mesurer
 * @param {string} label - Label pour le log (optionnel)
 * @returns {Promise<{result: any, duration: number}>} Résultat et durée en ms
 *
 * @example
 * const { result, duration } = await measureTime(async () => {
 *   return await fetchData();
 * }, 'Fetch Data');
 * console.log(`Durée: ${duration}ms`);
 */
export async function measureTime(fn, label = 'Opération') {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    console.log(`[TimingUtils] ⏱️  ${label}: ${duration}ms`);

    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[TimingUtils] ❌ ${label} échoué après ${duration}ms:`, error.message);
    throw error;
  }
}

/**
 * Retry: Exécute une fonction avec retry automatique en cas d'échec
 *
 * @param {Function} fn - Fonction à exécuter
 * @param {Object} options - Options de retry
 * @param {number} options.maxAttempts - Nombre maximum de tentatives (défaut: 3)
 * @param {Function} options.shouldRetry - Fonction qui détermine si on doit retry (défaut: toujours)
 * @param {Object} options.backoff - Options de backoff (voir waitWithBackoff)
 * @param {Function} options.onRetry - Callback appelé avant chaque retry
 * @returns {Promise<any>} Résultat de la fonction
 * @throws {Error} Si toutes les tentatives échouent
 *
 * @example
 * const result = await retry(
 *   async () => await fetchData(),
 *   {
 *     maxAttempts: 5,
 *     shouldRetry: (error) => error.code === 'ETIMEDOUT',
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}:`, error.message)
 *   }
 * );
 */
export async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    shouldRetry = () => true,
    backoff = {},
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Vérifier si on doit retry
      if (!shouldRetry(error)) {
        throw error;
      }

      // Si c'est la dernière tentative, on ne retry pas
      if (attempt === maxAttempts - 1) {
        break;
      }

      // Callback avant retry
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Attendre avec backoff
      await waitWithBackoff(attempt, backoff);
    }
  }

  // Toutes les tentatives ont échoué
  throw new Error(
    `Échec après ${maxAttempts} tentatives. Dernière erreur: ${lastError.message}`
  );
}
