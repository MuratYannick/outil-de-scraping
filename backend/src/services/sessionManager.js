/**
 * Session Manager pour la gestion des sessions de scraping
 * Gère les cookies, profils de navigateur et warm-up de session
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le dossier de stockage des sessions
const SESSIONS_DIR = path.join(__dirname, '../../sessions');
const COOKIES_DIR = path.join(SESSIONS_DIR, 'cookies');

/**
 * Initialise les dossiers de session si nécessaires
 */
async function ensureSessionDirectories() {
  try {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
    await fs.mkdir(COOKIES_DIR, { recursive: true });
  } catch (error) {
    console.error('[SessionManager] Erreur création dossiers:', error);
  }
}

class SessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> session data
    this.initialized = false;
  }

  /**
   * Initialise le gestionnaire de sessions
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log('[SessionManager] Initialisation...');
    await ensureSessionDirectories();

    this.initialized = true;
    console.log('[SessionManager] ✓ Initialisé');
  }

  /**
   * Génère un ID de session unique basé sur le domaine
   * @param {string} domain - Domaine cible (ex: "google.com")
   * @returns {string} Session ID
   */
  generateSessionId(domain) {
    const sanitizedDomain = domain.replace(/[^a-z0-9]/gi, '_');
    return `session_${sanitizedDomain}_${Date.now()}`;
  }

  /**
   * Sauvegarde les cookies d'un context
   * @param {BrowserContext} context - Context Playwright
   * @param {string} sessionId - ID de session
   */
  async saveCookies(context, sessionId) {
    try {
      const cookies = await context.cookies();
      const cookiesPath = path.join(COOKIES_DIR, `${sessionId}.json`);

      await fs.writeFile(
        cookiesPath,
        JSON.stringify(cookies, null, 2),
        'utf8'
      );

      console.log(`[SessionManager] ✓ Cookies sauvegardés: ${sessionId} (${cookies.length} cookies)`);

      return cookiesPath;
    } catch (error) {
      console.error('[SessionManager] ❌ Erreur sauvegarde cookies:', error);
      throw error;
    }
  }

  /**
   * Charge les cookies dans un context
   * @param {BrowserContext} context - Context Playwright
   * @param {string} sessionId - ID de session
   * @returns {boolean} True si chargé avec succès
   */
  async loadCookies(context, sessionId) {
    try {
      const cookiesPath = path.join(COOKIES_DIR, `${sessionId}.json`);

      // Vérifier si le fichier existe
      try {
        await fs.access(cookiesPath);
      } catch {
        console.log(`[SessionManager] ℹ️ Pas de cookies trouvés pour: ${sessionId}`);
        return false;
      }

      // Charger les cookies
      const cookiesData = await fs.readFile(cookiesPath, 'utf8');
      const cookies = JSON.parse(cookiesData);

      await context.addCookies(cookies);

      console.log(`[SessionManager] ✓ Cookies chargés: ${sessionId} (${cookies.length} cookies)`);

      return true;
    } catch (error) {
      console.error('[SessionManager] ❌ Erreur chargement cookies:', error);
      return false;
    }
  }

  /**
   * Supprime les cookies d'une session
   * @param {string} sessionId - ID de session
   */
  async deleteCookies(sessionId) {
    try {
      const cookiesPath = path.join(COOKIES_DIR, `${sessionId}.json`);
      await fs.unlink(cookiesPath);

      console.log(`[SessionManager] ✓ Cookies supprimés: ${sessionId}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('[SessionManager] ❌ Erreur suppression cookies:', error);
      }
    }
  }

  /**
   * Nettoie les cookies expirés (plus de 7 jours)
   */
  async cleanupOldCookies(maxAgeDays = 7) {
    try {
      const files = await fs.readdir(COOKIES_DIR);
      const now = Date.now();
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(COOKIES_DIR, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`[SessionManager] 🧹 Nettoyage: ${deletedCount} fichier(s) de cookies supprimé(s)`);
      }
    } catch (error) {
      console.error('[SessionManager] ❌ Erreur nettoyage cookies:', error);
    }
  }

  /**
   * Warm-up d'une session: visite la page d'accueil avant de scraper
   * Simule un comportement humain en naviguant naturellement
   * @param {Page} page - Page Playwright
   * @param {string} baseUrl - URL de base du site (ex: "https://www.google.com")
   * @param {Object} options - Options de warm-up
   */
  async warmupSession(page, baseUrl, options = {}) {
    const {
      scrollDown = true,
      randomDelay = true,
      minDelay = 2000,
      maxDelay = 5000
    } = options;

    try {
      console.log(`[SessionManager] 🔥 Warm-up session: ${baseUrl}`);

      // 1. Charger la page d'accueil
      await page.goto(baseUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      console.log('[SessionManager] ✓ Page d\'accueil chargée');

      // 2. Attendre un délai aléatoire (simule lecture)
      if (randomDelay) {
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        console.log(`[SessionManager] ⏳ Délai de lecture: ${Math.round(delay / 1000)}s`);
        await page.waitForTimeout(delay);
      }

      // 3. Scroll léger vers le bas (simule lecture de la page)
      if (scrollDown) {
        console.log('[SessionManager] 📜 Scroll vers le bas...');
        await page.evaluate(() => {
          window.scrollBy({
            top: Math.random() * 300 + 200,
            behavior: 'smooth'
          });
        });

        await page.waitForTimeout(1000);
      }

      // 4. Vérifier que la page est interactive
      await page.waitForLoadState('domcontentloaded');

      console.log('[SessionManager] ✓ Session warm-up terminé');

      return true;
    } catch (error) {
      console.error('[SessionManager] ❌ Erreur warm-up session:', error);
      return false;
    }
  }

  /**
   * Crée une nouvelle session avec profil persistant
   * @param {string} domain - Domaine cible
   * @param {Object} metadata - Métadonnées de session
   */
  createSession(domain, metadata = {}) {
    const sessionId = this.generateSessionId(domain);

    this.sessions.set(sessionId, {
      id: sessionId,
      domain,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      requestCount: 0,
      metadata
    });

    console.log(`[SessionManager] ✓ Session créée: ${sessionId}`);

    return sessionId;
  }

  /**
   * Récupère une session existante
   * @param {string} sessionId - ID de session
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.lastUsedAt = Date.now();
      session.requestCount++;
    }

    return session;
  }

  /**
   * Supprime une session
   * @param {string} sessionId - ID de session
   */
  async deleteSession(sessionId) {
    this.sessions.delete(sessionId);
    await this.deleteCookies(sessionId);

    console.log(`[SessionManager] ✓ Session supprimée: ${sessionId}`);
  }

  /**
   * Liste toutes les sessions actives
   */
  listSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Obtient les statistiques des sessions
   */
  getStats() {
    const sessions = this.listSessions();

    return {
      totalSessions: sessions.length,
      oldestSession: sessions.length > 0
        ? Math.min(...sessions.map(s => s.createdAt))
        : null,
      mostRecentSession: sessions.length > 0
        ? Math.max(...sessions.map(s => s.lastUsedAt))
        : null,
      totalRequests: sessions.reduce((sum, s) => sum + s.requestCount, 0)
    };
  }

  /**
   * Affiche les statistiques
   */
  logStats() {
    const stats = this.getStats();
    console.log('\n[SessionManager] 📊 Statistiques:');
    console.log(`  Sessions actives: ${stats.totalSessions}`);
    console.log(`  Requêtes totales: ${stats.totalRequests}`);

    if (stats.oldestSession) {
      const age = Date.now() - stats.oldestSession;
      console.log(`  Session la plus ancienne: ${Math.round(age / 1000 / 60)} min`);
    }
    console.log('');
  }
}

// Instance singleton
let sessionManagerInstance = null;

/**
 * Récupère l'instance singleton du SessionManager
 */
export function getSessionManager() {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

/**
 * Réinitialise l'instance (utile pour les tests)
 */
export function resetSessionManager() {
  sessionManagerInstance = null;
}

export default SessionManager;
