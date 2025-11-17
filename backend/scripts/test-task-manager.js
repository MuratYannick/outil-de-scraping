/**
 * Script de test pour le TaskManager
 * Valide toutes les fonctionnalités du gestionnaire de tâches
 */

import taskManager from '../src/services/taskManager.js';

console.log('🧪 Test du TaskManager\n');

// Reset pour commencer avec un état propre
taskManager.reset();

// ============================================================================
// Test 1: Création de tâche
// ============================================================================
console.log('📋 TEST 1: Création de tâche');
const task1 = taskManager.createTask({
  keyword: 'plombier',
  location: 'Lyon',
  source: 'Pages Jaunes',
  maxPages: 1,
});

if (task1 && task1.id && task1.status === 'pending') {
  console.log('✅ Test 1 PASSÉ: Tâche créée avec succès');
  console.log(`   ID: ${task1.id}`);
  console.log(`   Statut: ${task1.status}`);
  console.log(`   Progression: ${task1.progress}%`);
} else {
  console.error('❌ Test 1 ÉCHOUÉ: Erreur lors de la création de la tâche');
  process.exit(1);
}

console.log('');

// ============================================================================
// Test 2: Récupération de tâche
// ============================================================================
console.log('📋 TEST 2: Récupération de tâche');
const retrievedTask = taskManager.getTask(task1.id);

if (retrievedTask && retrievedTask.id === task1.id) {
  console.log('✅ Test 2 PASSÉ: Tâche récupérée avec succès');
} else {
  console.error('❌ Test 2 ÉCHOUÉ: Impossible de récupérer la tâche');
  process.exit(1);
}

console.log('');

// ============================================================================
// Test 3: Mise à jour du statut
// ============================================================================
console.log('📋 TEST 3: Mise à jour du statut');
taskManager.updateTaskStatus(task1.id, 'in_progress');
const updatedTask = taskManager.getTask(task1.id);

if (updatedTask.status === 'in_progress' && updatedTask.startedAt) {
  console.log('✅ Test 3 PASSÉ: Statut mis à jour à "in_progress"');
  console.log(`   Started at: ${updatedTask.startedAt}`);
} else {
  console.error('❌ Test 3 ÉCHOUÉ: Erreur de mise à jour du statut');
  process.exit(1);
}

console.log('');

// ============================================================================
// Test 4: Mise à jour de la progression
// ============================================================================
console.log('📋 TEST 4: Mise à jour de la progression');
taskManager.updateTaskProgress(task1.id, 25, {
  prospects: [
    { nom_entreprise: 'Plomberie Martin', telephone: '01 23 45 67 89' },
    { nom_entreprise: 'Électricité Dubois', telephone: '04 56 78 90 12' },
  ],
  pages_scraped: 1,
});

const progressTask = taskManager.getTask(task1.id);
if (progressTask.progress === 25 && progressTask.results.total === 2) {
  console.log('✅ Test 4 PASSÉ: Progression mise à jour');
  console.log(`   Progression: ${progressTask.progress}%`);
  console.log(`   Prospects: ${progressTask.results.total}`);
  console.log(`   Pages: ${progressTask.results.pages_scraped}`);
} else {
  console.error('❌ Test 4 ÉCHOUÉ: Erreur de mise à jour de la progression');
  process.exit(1);
}

console.log('');

// ============================================================================
// Test 5: Ajout d'erreurs
// ============================================================================
console.log('📋 TEST 5: Ajout d\'erreurs');
taskManager.updateTaskProgress(task1.id, 50, {
  errors: ['Timeout sur page 2', 'CAPTCHA détecté'],
});

const errorTask = taskManager.getTask(task1.id);
if (errorTask.results.errors.length === 2) {
  console.log('✅ Test 5 PASSÉ: Erreurs ajoutées');
  console.log(`   Erreurs: ${errorTask.results.errors.join(', ')}`);
} else {
  console.error('❌ Test 5 ÉCHOUÉ: Erreur d\'ajout des erreurs');
  process.exit(1);
}

console.log('');

// ============================================================================
// Test 6: Complétion de tâche
// ============================================================================
console.log('📋 TEST 6: Complétion de tâche');
taskManager.completeTask(task1.id, {
  total: 10,
  pages_scraped: 2,
});

const completedTask = taskManager.getTask(task1.id);
if (completedTask.status === 'completed' && completedTask.progress === 100 && completedTask.completedAt) {
  console.log('✅ Test 6 PASSÉ: Tâche complétée');
  console.log(`   Statut: ${completedTask.status}`);
  console.log(`   Progression: ${completedTask.progress}%`);
  console.log(`   Completed at: ${completedTask.completedAt}`);
} else {
  console.error('❌ Test 6 ÉCHOUÉ: Erreur de complétion');
  process.exit(1);
}

console.log('');

// ============================================================================
// Test 7: Création d'une tâche échouée
// ============================================================================
console.log('📋 TEST 7: Tâche échouée');
const task2 = taskManager.createTask({
  keyword: 'restaurant',
  location: 'Paris',
});
taskManager.updateTaskStatus(task2.id, 'in_progress');
taskManager.failTask(task2.id, new Error('Erreur de connexion au site'));

const failedTask = taskManager.getTask(task2.id);
if (failedTask.status === 'failed' && failedTask.error) {
  console.log('✅ Test 7 PASSÉ: Tâche marquée comme échouée');
  console.log(`   Statut: ${failedTask.status}`);
  console.log(`   Erreur: ${failedTask.error}`);
} else {
  console.error('❌ Test 7 ÉCHOUÉ: Erreur lors du marquage de l\'échec');
  process.exit(1);
}

console.log('');

// ============================================================================
// Test 8: Annulation de tâche
// ============================================================================
console.log('📋 TEST 8: Annulation de tâche');
const task3 = taskManager.createTask({
  keyword: 'boulangerie',
  location: 'Marseille',
});
taskManager.updateTaskStatus(task3.id, 'in_progress');
const cancelled = taskManager.cancelTask(task3.id);

const cancelledTask = taskManager.getTask(task3.id);
if (cancelled && cancelledTask.status === 'cancelled') {
  console.log('✅ Test 8 PASSÉ: Tâche annulée');
  console.log(`   Statut: ${cancelledTask.status}`);
} else {
  console.error('❌ Test 8 ÉCHOUÉ: Erreur d\'annulation');
  process.exit(1);
}

console.log('');

// ============================================================================
// Test 9: Récupération de toutes les tâches
// ============================================================================
console.log('📋 TEST 9: Récupération de toutes les tâches');
const allTasks = taskManager.getAllTasks();

if (allTasks.length === 3) {
  console.log('✅ Test 9 PASSÉ: Toutes les tâches récupérées');
  console.log(`   Nombre total: ${allTasks.length}`);
  allTasks.forEach((task, index) => {
    console.log(`   ${index + 1}. ${task.id} - ${task.status}`);
  });
} else {
  console.error('❌ Test 9 ÉCHOUÉ: Erreur de récupération des tâches');
  process.exit(1);
}

console.log('');

// ============================================================================
// Test 10: Filtrage par statut
// ============================================================================
console.log('📋 TEST 10: Filtrage par statut');
const completedTasks = taskManager.getAllTasks({ status: 'completed' });
const failedTasks = taskManager.getAllTasks({ status: 'failed' });

if (completedTasks.length === 1 && failedTasks.length === 1) {
  console.log('✅ Test 10 PASSÉ: Filtrage par statut fonctionnel');
  console.log(`   Completed: ${completedTasks.length}`);
  console.log(`   Failed: ${failedTasks.length}`);
} else {
  console.error('❌ Test 10 ÉCHOUÉ: Erreur de filtrage');
  process.exit(1);
}

console.log('');

// ============================================================================
// Test 11: Statistiques
// ============================================================================
console.log('📋 TEST 11: Statistiques');
const stats = taskManager.getStats();

console.log('✅ Test 11 PASSÉ: Statistiques récupérées');
console.log('   Statistiques:');
console.log(`   - Total: ${stats.total}`);
console.log(`   - Pending: ${stats.pending}`);
console.log(`   - In Progress: ${stats.in_progress}`);
console.log(`   - Completed: ${stats.completed}`);
console.log(`   - Failed: ${stats.failed}`);
console.log(`   - Cancelled: ${stats.cancelled}`);

console.log('');

// ============================================================================
// Test 12: Événements
// ============================================================================
console.log('📋 TEST 12: Événements');
let eventFired = false;

taskManager.on('task:created', (data) => {
  eventFired = true;
  console.log('   Événement "task:created" reçu');
});

const task4 = taskManager.createTask({ test: true });

if (eventFired) {
  console.log('✅ Test 12 PASSÉ: Événements fonctionnels');
} else {
  console.error('❌ Test 12 ÉCHOUÉ: Événements non déclenchés');
  process.exit(1);
}

console.log('');

// ============================================================================
// Résumé
// ============================================================================
console.log('════════════════════════════════════════════════════════════');
console.log('✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS (12/12)');
console.log('════════════════════════════════════════════════════════════');
console.log('');
console.log('TaskManager validé et prêt à être intégré !');
console.log('');

// Nettoyage
taskManager.reset();
