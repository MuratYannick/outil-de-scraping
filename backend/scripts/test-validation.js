/**
 * Script de test pour la validation Joi
 * Teste les différents scénarios de validation des routes
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

let testsPassedCount = 0;
let testsFailedCount = 0;

/**
 * Test helper function
 */
async function runTest(testName, testFn) {
  try {
    log(`\n🧪 Test: ${testName}`, 'blue');
    await testFn();
    testsPassedCount++;
    log(`✅ PASSÉ`, 'green');
  } catch (error) {
    testsFailedCount++;
    log(`❌ ÉCHOUÉ: ${error.message}`, 'red');
    if (error.response?.data) {
      console.log('   Détails:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

/**
 * Tests de validation pour les prospects
 */
async function testProspectValidation() {
  log('\n═══════════════════════════════════════', 'yellow');
  log('  Tests de Validation - Prospects', 'yellow');
  log('═══════════════════════════════════════', 'yellow');

  // Test 1: Création avec données valides
  await runTest('Création prospect avec données valides', async () => {
    const validProspect = {
      nom_entreprise: 'Test Entreprise',
      email: 'test@example.com',
      telephone: '01 23 45 67 89',
      source_scraping: 'Test',
    };

    const response = await axios.post(`${API_BASE_URL}/prospects`, validProspect);
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Status attendu 200/201, reçu ${response.status}`);
    }
  });

  // Test 2: Création sans nom_entreprise (requis)
  await runTest('Création prospect sans nom_entreprise (doit échouer)', async () => {
    const invalidProspect = {
      email: 'test@example.com',
      source_scraping: 'Test',
    };

    try {
      await axios.post(`${API_BASE_URL}/prospects`, invalidProspect);
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Status attendu 400, reçu ${error.response?.status}`);
      }
      // C'est le comportement attendu
    }
  });

  // Test 3: Création avec email invalide
  await runTest('Création prospect avec email invalide (doit échouer)', async () => {
    const invalidProspect = {
      nom_entreprise: 'Test',
      email: 'email-invalide',
      source_scraping: 'Test',
    };

    try {
      await axios.post(`${API_BASE_URL}/prospects`, invalidProspect);
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Status attendu 400, reçu ${error.response?.status}`);
      }
    }
  });

  // Test 4: GET avec paramètres de pagination invalides
  await runTest('GET prospects avec limite > 100 (doit échouer)', async () => {
    try {
      await axios.get(`${API_BASE_URL}/prospects?limit=150`);
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Status attendu 400, reçu ${error.response?.status}`);
      }
    }
  });

  // Test 5: GET prospect avec ID invalide
  await runTest('GET prospect avec ID non numérique (doit échouer)', async () => {
    try {
      await axios.get(`${API_BASE_URL}/prospects/abc`);
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Status attendu 400, reçu ${error.response?.status}`);
      }
    }
  });
}

/**
 * Tests de validation pour les tags
 */
async function testTagValidation() {
  log('\n═══════════════════════════════════════', 'yellow');
  log('  Tests de Validation - Tags', 'yellow');
  log('═══════════════════════════════════════', 'yellow');

  // Test 1: Création avec données valides
  await runTest('Création tag avec données valides', async () => {
    const validTag = {
      nom: 'Test Tag ' + Date.now(),
    };

    const response = await axios.post(`${API_BASE_URL}/tags`, validTag);
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Status attendu 200/201, reçu ${response.status}`);
    }
  });

  // Test 2: Création sans nom (requis)
  await runTest('Création tag sans nom (doit échouer)', async () => {
    try {
      await axios.post(`${API_BASE_URL}/tags`, {});
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Status attendu 400, reçu ${error.response?.status}`);
      }
    }
  });

  // Test 3: GET tag avec ID invalide
  await runTest('GET tag avec ID non numérique (doit échouer)', async () => {
    try {
      await axios.get(`${API_BASE_URL}/tags/invalide`);
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Status attendu 400, reçu ${error.response?.status}`);
      }
    }
  });
}

/**
 * Tests de validation pour le scraping
 */
async function testScrapingValidation() {
  log('\n═══════════════════════════════════════', 'yellow');
  log('  Tests de Validation - Scraping', 'yellow');
  log('═══════════════════════════════════════', 'yellow');

  // Test 1: Lancement avec données valides
  await runTest('Lancement scraping avec données valides', async () => {
    const validScraping = {
      keyword: 'test',
      location: 'Paris',
      source: 'Pages Jaunes',
      maxPages: 1,
      maxResults: 5,
    };

    const response = await axios.post(`${API_BASE_URL}/scraping/lancer`, validScraping);
    if (response.status !== 202 && response.status !== 200) {
      throw new Error(`Status attendu 200/202, reçu ${response.status}`);
    }
  });

  // Test 2: Lancement sans keyword (requis)
  await runTest('Lancement scraping sans keyword (doit échouer)', async () => {
    const invalidScraping = {
      location: 'Paris',
    };

    try {
      await axios.post(`${API_BASE_URL}/scraping/lancer`, invalidScraping);
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Status attendu 400, reçu ${error.response?.status}`);
      }
    }
  });

  // Test 3: Lancement avec maxPages > 10
  await runTest('Lancement scraping avec maxPages > 10 (doit échouer)', async () => {
    const invalidScraping = {
      keyword: 'test',
      location: 'Paris',
      maxPages: 15,
    };

    try {
      await axios.post(`${API_BASE_URL}/scraping/lancer`, invalidScraping);
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Status attendu 400, reçu ${error.response?.status}`);
      }
    }
  });

  // Test 4: GET status avec task_id invalide (pas un UUID)
  await runTest('GET status avec task_id non-UUID (doit échouer)', async () => {
    try {
      await axios.get(`${API_BASE_URL}/scraping/status/invalid-id`);
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Status attendu 400, reçu ${error.response?.status}`);
      }
    }
  });
}

/**
 * Test du gestionnaire d'erreur global
 */
async function testErrorHandler() {
  log('\n═══════════════════════════════════════', 'yellow');
  log('  Tests du Gestionnaire d\'Erreur', 'yellow');
  log('═══════════════════════════════════════', 'yellow');

  // Test 1: Route inexistante (404)
  await runTest('Route inexistante (404)', async () => {
    try {
      await axios.get(`${API_BASE_URL}/route-inexistante`);
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 404) {
        throw new Error(`Status attendu 404, reçu ${error.response?.status}`);
      }
      if (!error.response?.data?.error || error.response.data.error !== 'Not Found') {
        throw new Error('Format de réponse d\'erreur incorrect');
      }
    }
  });

  // Test 2: Ressource inexistante (GET prospect qui n'existe pas)
  await runTest('Ressource inexistante (GET prospect 99999)', async () => {
    try {
      await axios.get(`${API_BASE_URL}/prospects/99999`);
      throw new Error('La requête aurait dû échouer');
    } catch (error) {
      if (error.response?.status !== 404) {
        throw new Error(`Status attendu 404, reçu ${error.response?.status}`);
      }
    }
  });
}

/**
 * Fonction principale
 */
async function main() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║      Tests de Validation et Gestion d\'Erreur         ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  try {
    // Vérifier que le serveur est démarré
    log('\n⏳ Vérification du serveur...', 'yellow');
    await axios.get('http://localhost:3001/health');
    log('✅ Serveur accessible\n', 'green');

    // Lancer les tests
    await testProspectValidation();
    await testTagValidation();
    await testScrapingValidation();
    await testErrorHandler();

    // Résumé
    log('\n═══════════════════════════════════════', 'yellow');
    log('  Résumé des Tests', 'yellow');
    log('═══════════════════════════════════════', 'yellow');
    log(`✅ Tests passés: ${testsPassedCount}`, 'green');
    log(`❌ Tests échoués: ${testsFailedCount}`, 'red');
    log(`📊 Total: ${testsPassedCount + testsFailedCount}`, 'blue');

    if (testsFailedCount === 0) {
      log('\n🎉 Tous les tests sont passés !', 'green');
      process.exit(0);
    } else {
      log('\n⚠️ Certains tests ont échoué', 'red');
      process.exit(1);
    }
  } catch (error) {
    log('\n❌ Erreur fatale:', 'red');
    console.error(error);
    log('\n💡 Assurez-vous que le serveur backend est démarré (npm run dev)', 'yellow');
    process.exit(1);
  }
}

main();
