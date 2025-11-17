import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';

/**
 * Gestionnaire de tâches asynchrones pour le scraping
 * Gère le cycle de vie des tâches (création, progression, completion)
 * Utilise EventEmitter pour le feedback en temps réel
 */
class TaskManager extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map(); // Store tasks in memory
    this.maxTasks = 100; // Maximum number of tasks to keep in memory
  }

  /**
   * Créer une nouvelle tâche
   * @param {Object} params - Paramètres de la tâche
   * @returns {Object} La tâche créée avec son ID
   */
  createTask(params = {}) {
    const taskId = uuidv4();
    const task = {
      id: taskId,
      status: 'pending', // pending, in_progress, completed, failed, cancelled
      progress: 0, // 0-100
      params, // Paramètres du scraping (keyword, location, source, etc.)
      results: {
        prospects: [],
        total: 0,
        pages_scraped: 0,
        errors: [],
      },
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      error: null,
    };

    this.tasks.set(taskId, task);
    this._cleanupOldTasks();

    console.log(`[TaskManager] Tâche créée: ${taskId}`);
    this.emit('task:created', { taskId, task });

    return task;
  }

  /**
   * Récupérer une tâche par son ID
   * @param {string} taskId - ID de la tâche
   * @returns {Object|null} La tâche ou null si non trouvée
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Mettre à jour le statut d'une tâche
   * @param {string} taskId - ID de la tâche
   * @param {string} status - Nouveau statut
   */
  updateTaskStatus(taskId, status) {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[TaskManager] Tâche non trouvée: ${taskId}`);
      return;
    }

    const oldStatus = task.status;
    task.status = status;

    if (status === 'in_progress' && !task.startedAt) {
      task.startedAt = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      task.completedAt = new Date().toISOString();
    }

    this.emit('task:status', { taskId, status, oldStatus });
    console.log(`[TaskManager] Tâche ${taskId}: ${oldStatus} → ${status}`);
  }

  /**
   * Mettre à jour la progression d'une tâche
   * @param {string} taskId - ID de la tâche
   * @param {number} progress - Progression (0-100)
   * @param {Object} data - Données supplémentaires (prospects, pages, etc.)
   */
  updateTaskProgress(taskId, progress, data = {}) {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[TaskManager] Tâche non trouvée: ${taskId}`);
      return;
    }

    task.progress = Math.min(100, Math.max(0, progress));

    // Mettre à jour les résultats
    if (data.prospects) {
      task.results.prospects = data.prospects;
      task.results.total = data.prospects.length;
    }
    if (data.pages_scraped !== undefined) {
      task.results.pages_scraped = data.pages_scraped;
    }
    if (data.errors) {
      task.results.errors = [...task.results.errors, ...data.errors];
    }

    this.emit('task:progress', { taskId, progress, data });
    console.log(`[TaskManager] Tâche ${taskId}: ${progress}% (${task.results.total} prospects)`);
  }

  /**
   * Marquer une tâche comme terminée avec succès
   * @param {string} taskId - ID de la tâche
   * @param {Object} results - Résultats finaux
   */
  completeTask(taskId, results = {}) {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[TaskManager] Tâche non trouvée: ${taskId}`);
      return;
    }

    task.status = 'completed';
    task.progress = 100;
    task.completedAt = new Date().toISOString();
    task.results = { ...task.results, ...results };

    this.emit('task:completed', { taskId, results: task.results });
    console.log(`[TaskManager] Tâche ${taskId} terminée: ${task.results.total} prospects`);
  }

  /**
   * Marquer une tâche comme échouée
   * @param {string} taskId - ID de la tâche
   * @param {Error|string} error - Erreur rencontrée
   */
  failTask(taskId, error) {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[TaskManager] Tâche non trouvée: ${taskId}`);
      return;
    }

    task.status = 'failed';
    task.completedAt = new Date().toISOString();
    task.error = error instanceof Error ? error.message : error;

    this.emit('task:failed', { taskId, error: task.error });
    console.error(`[TaskManager] Tâche ${taskId} échouée: ${task.error}`);
  }

  /**
   * Annuler une tâche en cours
   * @param {string} taskId - ID de la tâche
   * @returns {boolean} true si annulée, false sinon
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[TaskManager] Tâche non trouvée: ${taskId}`);
      return false;
    }

    if (task.status === 'completed' || task.status === 'failed') {
      console.warn(`[TaskManager] Impossible d'annuler une tâche ${task.status}`);
      return false;
    }

    task.status = 'cancelled';
    task.completedAt = new Date().toISOString();

    this.emit('task:cancelled', { taskId });
    console.log(`[TaskManager] Tâche ${taskId} annulée`);
    return true;
  }

  /**
   * Récupérer toutes les tâches
   * @param {Object} filter - Filtres (status, limit, etc.)
   * @returns {Array} Liste des tâches
   */
  getAllTasks(filter = {}) {
    let tasks = Array.from(this.tasks.values());

    // Filtrer par statut
    if (filter.status) {
      tasks = tasks.filter(task => task.status === filter.status);
    }

    // Trier par date de création (plus récent en premier)
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limiter le nombre de résultats
    if (filter.limit) {
      tasks = tasks.slice(0, filter.limit);
    }

    return tasks;
  }

  /**
   * Nettoyer les anciennes tâches pour libérer la mémoire
   * Garde les N tâches les plus récentes
   * @private
   */
  _cleanupOldTasks() {
    if (this.tasks.size <= this.maxTasks) {
      return;
    }

    const allTasks = Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const tasksToRemove = allTasks.slice(this.maxTasks);
    tasksToRemove.forEach(task => {
      this.tasks.delete(task.id);
    });

    console.log(`[TaskManager] Nettoyage: ${tasksToRemove.length} tâche(s) supprimée(s)`);
  }

  /**
   * Obtenir les statistiques du gestionnaire
   * @returns {Object} Statistiques
   */
  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    };
  }

  /**
   * Supprimer une tâche
   * @param {string} taskId - ID de la tâche
   * @returns {boolean} true si supprimée, false sinon
   */
  deleteTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[TaskManager] Tâche non trouvée: ${taskId}`);
      return false;
    }

    this.tasks.delete(taskId);
    console.log(`[TaskManager] Tâche ${taskId} supprimée`);
    return true;
  }

  /**
   * Réinitialiser le gestionnaire (supprimer toutes les tâches)
   * Utile pour les tests
   */
  reset() {
    const count = this.tasks.size;
    this.tasks.clear();
    console.log(`[TaskManager] Reset: ${count} tâche(s) supprimée(s)`);
  }
}

// Singleton instance
const taskManager = new TaskManager();

export default taskManager;
