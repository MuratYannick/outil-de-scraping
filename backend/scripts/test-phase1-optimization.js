/**
 * Script de test pour la Phase 1 - Quick Wins
 * Teste: Mode HYBRID, RateLimiter, SessionManager
 */

import { getRateLimiter, RATE_LIMIT_PATTERNS, resetRateLimiter } from '../src/services/rateLimiter.js';
import { getSessionManager, resetSessionManager } from '../src/services/sessionManager.js';
import { getPlaywrightService, resetPlaywrightService } from '../src/services/playwrightService.js';
import { antiBotConfig } from '../src/config/antiBotConfig.js';

console.log('========================================');
console.log('🧪 TEST PHASE 1 - QUICK WINS');
console.log('========================================\n');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Helper pour exécuter un test
 */
async function runTest(name, testFn) {
  testsRun++;
  console.log(`\n[TEST ${testsRun}] ${name}`);
  console.log('─'.repeat(60));

  try {
    await testFn();
    testsPassed++;
    console.log(`✅ ${name} - PASSED\n`);
    return true;
  } catch (error) {
    testsFailed++;
    console.error(`❌ ${name} - FAILED`);
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

/**
 * Test 1: RateLimiter - Pattern NORMAL
 */
async function testRateLimiterNormal() {
  console.log('Testing RateLimiter with NORMAL pattern...');

  resetRateLimiter();
  const rateLimiter = getRateLimiter(RATE_LIMIT_PATTERNS.NORMAL);

  // Faire 5 requêtes avec le rate limiter
  console.log('Simulating 5 requests with rate limiting...');

  for (let i = 1; i <= 5; i++) {
    await rateLimiter.wait();
  }

  const stats = rateLimiter.getStats();
  rateLimiter.logStats();

  // Vérifications
  if (stats.requestCount !== 5) {
    throw new Error(`Expected 5 requests, got ${stats.requestCount}`);
  }

  if (stats.totalDelaySec < 5) {
    throw new Error(`Total delay too short: ${stats.totalDelaySec}s (expected > 5s)`);
  }

  console.log(`✓ RateLimiter NORMAL pattern works correctly`);
  console.log(`✓ Average delay: ${Math.round(stats.avgDelayPerRequest / 1000)}s per request`);
}

/**
 * Test 2: RateLimiter - Pattern HUMAN avec bursts
 */
async function testRateLimiterHuman() {
  console.log('Testing RateLimiter with HUMAN pattern (bursts)...');

  resetRateLimiter();
  const rateLimiter = getRateLimiter(RATE_LIMIT_PATTERNS.HUMAN);

  // Faire 8 requêtes (devrait inclure au moins une pause burst)
  console.log('Simulating 8 requests (should trigger burst pause)...');

  for (let i = 1; i <= 8; i++) {
    await rateLimiter.wait();
  }

  const stats = rateLimiter.getStats();
  rateLimiter.logStats();

  // Vérifications
  if (stats.requestCount !== 8) {
    throw new Error(`Expected 8 requests, got ${stats.requestCount}`);
  }

  // Devrait y avoir au moins une pause burst (5 requêtes + pause)
  if (stats.totalDelaySec < 15) {
    throw new Error(`Total delay too short: ${stats.totalDelaySec}s (expected > 15s with burst)`);
  }

  console.log(`✓ RateLimiter HUMAN pattern with bursts works correctly`);
}

/**
 * Test 3: SessionManager - Sauvegarde et chargement de cookies
 */
async function testSessionManagerCookies() {
  console.log('Testing SessionManager cookie management...');

  resetSessionManager();
  const sessionManager = getSessionManager();
  await sessionManager.initialize();

  // Créer une session
  const sessionId = sessionManager.createSession('google.com', { test: true });
  console.log(`✓ Session created: ${sessionId}`);

  // Créer un context Playwright minimal pour simuler
  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  const context = await playwrightService.createContext();
  const page = await context.newPage();

  // Aller sur une vraie page pour générer des cookies
  console.log('Loading google.com to generate cookies...');
  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Sauvegarder les cookies
  console.log('Saving cookies...');
  await sessionManager.saveCookies(context, sessionId);

  // Fermer le context
  await playwrightService.closeContext(context);

  // Créer un nouveau context et charger les cookies
  const newContext = await playwrightService.createContext();
  const loaded = await sessionManager.loadCookies(newContext, sessionId);

  if (!loaded) {
    throw new Error('Failed to load cookies');
  }

  console.log(`✓ Cookies saved and loaded successfully`);

  // Vérifier les stats de session
  const session = sessionManager.getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  console.log(`✓ Session data: ${session.requestCount} requests, domain: ${session.domain}`);

  // Nettoyer
  await playwrightService.closeContext(newContext);
  await sessionManager.deleteSession(sessionId);
  await playwrightService.close();

  console.log(`✓ Session cleanup successful`);
}

/**
 * Test 4: SessionManager - Warm-up de session
 */
async function testSessionWarmup() {
  console.log('Testing SessionManager session warm-up...');

  resetSessionManager();
  const sessionManager = getSessionManager();
  await sessionManager.initialize();

  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  const context = await playwrightService.createContext();
  const page = await context.newPage();

  // Test warm-up sur google.com
  console.log('Performing session warm-up...');
  const success = await playwrightService.warmupSession(page, 'https://www.google.com', {
    scrollDown: true,
    randomDelay: true,
    minDelay: 1000,
    maxDelay: 2000
  });

  if (!success) {
    throw new Error('Warm-up failed');
  }

  console.log(`✓ Session warm-up completed successfully`);

  // Nettoyer
  await playwrightService.closeContext(context);
  await playwrightService.close();
}

/**
 * Test 5: Mode HYBRID - Vérifier activation des sous-stratégies
 */
async function testHybridMode() {
  console.log('Testing HYBRID mode activation...');

  // Sauvegarder la config actuelle
  const originalStrategy = antiBotConfig.activeStrategy;

  // Activer mode HYBRID
  antiBotConfig.activeStrategy = 'hybrid';

  // Réinitialiser et créer un nouveau service
  resetPlaywrightService();
  const playwrightService = getPlaywrightService();

  // Initialiser (devrait activer les sous-stratégies automatiquement)
  await playwrightService.initialize();

  const stats = playwrightService.getStats();

  // Vérifier que les stratégies sont activées
  console.log('Active strategies:', stats.activeStrategies);

  // Stealth devrait toujours être activé en mode HYBRID
  if (!stats.activeStrategies.stealth) {
    throw new Error('Stealth not activated in HYBRID mode');
  }

  console.log(`✓ Stealth mode activated`);

  // SessionManager et RateLimiter devraient être activés
  if (!stats.activeStrategies.sessionManager) {
    throw new Error('SessionManager not activated');
  }

  console.log(`✓ SessionManager activated`);

  if (!stats.activeStrategies.rateLimiter) {
    throw new Error('RateLimiter not activated');
  }

  console.log(`✓ RateLimiter activated`);

  // Vérifier les stats du RateLimiter
  if (stats.rateLimiter) {
    console.log(`✓ RateLimiter pattern: ${stats.rateLimiter.pattern}`);

    if (stats.rateLimiter.pattern !== 'human') {
      throw new Error(`Expected 'human' pattern in HYBRID mode, got '${stats.rateLimiter.pattern}'`);
    }
  }

  // Nettoyer
  await playwrightService.close();

  // Restaurer config
  antiBotConfig.activeStrategy = originalStrategy;

  console.log(`✓ HYBRID mode working correctly`);
}

/**
 * Test 6: RateLimiter - Changement de pattern en cours
 */
async function testRateLimiterPatternSwitch() {
  console.log('Testing RateLimiter pattern switching...');

  resetRateLimiter();
  const rateLimiter = getRateLimiter(RATE_LIMIT_PATTERNS.CAUTIOUS);

  // Faire 2 requêtes en mode CAUTIOUS
  await rateLimiter.wait();
  await rateLimiter.wait();

  const statsCautious = rateLimiter.getStats();
  console.log(`✓ CAUTIOUS pattern: ${statsCautious.requestCount} requests, ${statsCautious.totalDelaySec}s total`);

  // Changer pour AGGRESSIVE
  rateLimiter.setPattern(RATE_LIMIT_PATTERNS.AGGRESSIVE);

  // Faire 2 requêtes en mode AGGRESSIVE
  await rateLimiter.wait();
  await rateLimiter.wait();

  const statsAggressive = rateLimiter.getStats();
  console.log(`✓ AGGRESSIVE pattern: ${statsAggressive.requestCount} requests, ${statsAggressive.totalDelaySec}s total`);

  if (statsAggressive.requestCount !== 4) {
    throw new Error(`Expected 4 total requests, got ${statsAggressive.requestCount}`);
  }

  console.log(`✓ Pattern switching works correctly`);
}

/**
 * Exécute tous les tests
 */
async function runAllTests() {
  console.log('Starting all tests...\n');

  await runTest('RateLimiter - Pattern NORMAL', testRateLimiterNormal);
  await runTest('RateLimiter - Pattern HUMAN avec bursts', testRateLimiterHuman);
  await runTest('SessionManager - Sauvegarde et chargement de cookies', testSessionManagerCookies);
  await runTest('SessionManager - Warm-up de session', testSessionWarmup);
  await runTest('Mode HYBRID - Activation des sous-stratégies', testHybridMode);
  await runTest('RateLimiter - Changement de pattern dynamique', testRateLimiterPatternSwitch);

  // Résumé
  console.log('\n========================================');
  console.log('📊 RÉSULTATS DES TESTS');
  console.log('========================================');
  console.log(`Total: ${testsRun} tests`);
  console.log(`✅ Réussis: ${testsPassed}`);
  console.log(`❌ Échoués: ${testsFailed}`);
  console.log(`📈 Taux de réussite: ${Math.round((testsPassed / testsRun) * 100)}%`);
  console.log('========================================\n');

  if (testsFailed > 0) {
    console.error('⚠️ Certains tests ont échoué. Vérifiez les logs ci-dessus.');
    process.exit(1);
  } else {
    console.log('🎉 Tous les tests sont passés avec succès!');
    process.exit(0);
  }
}

// Exécuter les tests
runAllTests().catch(error => {
  console.error('\n❌ ERREUR FATALE:', error);
  process.exit(1);
});
