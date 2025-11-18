/**
 * Script de test pour la Phase 2 - Comportement Humain Réaliste
 * Teste: HumanBehavior (souris, scroll, clavier, User-Agent)
 */

import { getHumanBehavior, resetHumanBehavior } from '../src/services/humanBehavior.js';
import { getPlaywrightService, resetPlaywrightService } from '../src/services/playwrightService.js';

console.log('========================================');
console.log('🧪 TEST PHASE 2 - COMPORTEMENT HUMAIN');
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
 * Test 1: User-Agent Selection et Cohérence
 */
async function testUserAgentSelection() {
  console.log('Testing User-Agent selection and consistency...');

  resetHumanBehavior();
  const humanBehavior = getHumanBehavior();

  // Test 1: Sélection aléatoire
  const ua1 = humanBehavior.selectUserAgent();
  console.log(`✓ UA généré: ${ua1.config.os}/${ua1.config.browser}`);

  if (!ua1.userAgent || !ua1.config) {
    throw new Error('Invalid User-Agent structure');
  }

  // Test 2: Viewport cohérent
  const viewport1 = humanBehavior.getConsistentViewport();
  console.log(`✓ Viewport: ${viewport1.width}x${viewport1.height}`);

  if (!viewport1.width || !viewport1.height) {
    throw new Error('Invalid viewport');
  }

  // Test 3: Headers cohérents
  const headers1 = humanBehavior.getConsistentHeaders();
  console.log(`✓ Headers: ${Object.keys(headers1).length} headers générés`);

  if (!headers1.Accept || !headers1['Accept-Language']) {
    throw new Error('Missing required headers');
  }

  // Test 4: Sélection avec préférences
  const ua2 = humanBehavior.selectUserAgent({ os: 'macos', browser: 'safari' });
  console.log(`✓ UA avec préférences: ${ua2.config.os}/${ua2.config.browser}`);

  if (ua2.config.os !== 'macos') {
    throw new Error(`Expected macos, got ${ua2.config.os}`);
  }

  console.log(`✓ User-Agent selection works correctly`);
}

/**
 * Test 2: Génération de trajectoire de souris (Courbes de Bézier)
 */
async function testMousePathGeneration() {
  console.log('Testing mouse path generation (Bézier curves)...');

  resetHumanBehavior();
  const humanBehavior = getHumanBehavior();

  const start = { x: 100, y: 100 };
  const end = { x: 500, y: 300 };
  const steps = 20;

  const path = humanBehavior.generateMousePath(start, end, steps);

  console.log(`✓ Path generated: ${path.length} points`);

  // Vérifications
  if (path.length !== steps + 1) {
    throw new Error(`Expected ${steps + 1} points, got ${path.length}`);
  }

  // Vérifier que le premier point est le départ
  if (Math.abs(path[0].x - start.x) > 1 || Math.abs(path[0].y - start.y) > 1) {
    throw new Error('First point is not at start position');
  }

  // Vérifier que le dernier point est l'arrivée
  const lastPoint = path[path.length - 1];
  if (Math.abs(lastPoint.x - end.x) > 1 || Math.abs(lastPoint.y - end.y) > 1) {
    throw new Error('Last point is not at end position');
  }

  // Vérifier que les points sont progressifs (pas de sauts)
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));

    if (distance > 100) {
      throw new Error(`Jumps detected in path at point ${i}: distance=${distance}`);
    }
  }

  console.log(`✓ Mouse path is smooth and continuous`);
}

/**
 * Test 3: Fonction d'easing (accélération/décélération)
 */
async function testEasingFunction() {
  console.log('Testing easing function...');

  resetHumanBehavior();
  const humanBehavior = getHumanBehavior();

  // Tester les valeurs limites
  const start = humanBehavior.easeInOutCubic(0);
  const middle = humanBehavior.easeInOutCubic(0.5);
  const end = humanBehavior.easeInOutCubic(1);

  console.log(`✓ Easing(0): ${start.toFixed(4)}`);
  console.log(`✓ Easing(0.5): ${middle.toFixed(4)}`);
  console.log(`✓ Easing(1): ${end.toFixed(4)}`);

  if (Math.abs(start - 0) > 0.01) {
    throw new Error(`Expected easing(0) ≈ 0, got ${start}`);
  }

  if (Math.abs(end - 1) > 0.01) {
    throw new Error(`Expected easing(1) ≈ 1, got ${end}`);
  }

  if (Math.abs(middle - 0.5) > 0.01) {
    throw new Error(`Expected easing(0.5) ≈ 0.5, got ${middle}`);
  }

  console.log(`✓ Easing function works correctly`);
}

/**
 * Test 4: Scroll Progressif avec Page Réelle
 */
async function testSmoothScroll() {
  console.log('Testing smooth scroll with real page...');

  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  const context = await playwrightService.createContext();
  const page = await context.newPage();

  // Aller sur une page avec contenu scrollable
  console.log('Loading test page...');
  await page.goto('https://en.wikipedia.org/wiki/Web_scraping', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });

  // Scroll initial position
  const startScroll = await page.evaluate(() => window.pageYOffset);
  console.log(`✓ Position initiale: ${startScroll}px`);

  // Scroll progressif de 500px
  console.log('Performing smooth scroll (500px)...');
  await playwrightService.scrollSmoothly(page, 500, {
    duration: 1000,
    steps: 20,
    addOvershoot: true
  });

  // Vérifier la nouvelle position
  const endScroll = await page.evaluate(() => window.pageYOffset);
  console.log(`✓ Position finale: ${endScroll}px`);
  console.log(`✓ Distance scrollée: ${endScroll - startScroll}px`);

  // Vérifier que le scroll a bien eu lieu
  const scrollDistance = endScroll - startScroll;
  if (scrollDistance < 450 || scrollDistance > 550) {
    throw new Error(`Expected scroll ~500px, got ${scrollDistance}px`);
  }

  // Nettoyer
  await playwrightService.closeContext(context);
  await playwrightService.close();

  console.log(`✓ Smooth scroll works correctly`);
}

/**
 * Test 5: Frappe Clavier avec Page Réelle
 */
async function testHumanTyping() {
  console.log('Testing human-like typing...');

  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  const context = await playwrightService.createContext();
  const page = await context.newPage();

  // Aller sur une page avec champ de recherche
  console.log('Loading Google...');
  await page.goto('https://www.google.com', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });

  // Trouver le champ de recherche
  const searchSelector = 'textarea[name="q"]';
  await page.waitForSelector(searchSelector, { timeout: 5000 });

  // Focus direct sans clic (évite problèmes d'overlay)
  await page.focus(searchSelector);
  await new Promise(resolve => setTimeout(resolve, 500));

  // Taper de manière humaine
  const searchText = 'web scraping';
  console.log(`Typing: "${searchText}"...`);

  // Utiliser keyboard.type directement avec humanBehavior
  const humanBehavior = getHumanBehavior();
  await humanBehavior.typeHumanLike(page, searchSelector, searchText, {
    minDelay: 80,
    maxDelay: 150,
    errorProbability: 0.05,  // 5% de chances d'erreur
    thinkProbability: 0.1,   // 10% de chances de pause
    skipClick: true          // Skip click car déjà focusé
  });

  // Vérifier que le texte est bien là
  const inputValue = await page.inputValue('textarea[name="q"]');
  console.log(`✓ Text typed: "${inputValue}"`);

  if (inputValue !== searchText) {
    throw new Error(`Expected "${searchText}", got "${inputValue}"`);
  }

  // Nettoyer
  await playwrightService.closeContext(context);
  await playwrightService.close();

  console.log(`✓ Human-like typing works correctly`);
}

/**
 * Test 6: Scroll vers Élément
 */
async function testScrollToElement() {
  console.log('Testing scroll to element...');

  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  const context = await playwrightService.createContext();
  const page = await context.newPage();

  // Aller sur une page avec plusieurs sections
  console.log('Loading test page...');
  await page.goto('https://en.wikipedia.org/wiki/Web_scraping', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });

  // Trouver un élément plus bas dans la page
  const selector = 'h2#History';  // Section "History"
  await page.waitForSelector(selector, { timeout: 5000 });

  // Position avant scroll
  const startScroll = await page.evaluate(() => window.pageYOffset);
  console.log(`✓ Position initiale: ${startScroll}px`);

  // Scroll vers l'élément
  console.log(`Scrolling to element: ${selector}...`);
  await playwrightService.scrollToElement(page, selector, {
    offset: -100,
    duration: 1200,
    addOvershoot: true
  });

  // Position après scroll
  const endScroll = await page.evaluate(() => window.pageYOffset);
  console.log(`✓ Position finale: ${endScroll}px`);

  // Vérifier que le scroll a bien eu lieu
  if (endScroll <= startScroll) {
    throw new Error('Element scroll did not work');
  }

  // Nettoyer
  await playwrightService.closeContext(context);
  await playwrightService.close();

  console.log(`✓ Scroll to element works correctly`);
}

/**
 * Test 7: Intégration PlaywrightService avec HumanBehavior
 */
async function testPlaywrightIntegration() {
  console.log('Testing Playwright integration with HumanBehavior...');

  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  const stats = playwrightService.getStats();
  console.log('Active strategies:', stats.activeStrategies);

  // Vérifier que HumanBehavior est activé
  if (!stats.activeStrategies.humanBehavior) {
    throw new Error('HumanBehavior not activated in PlaywrightService');
  }

  console.log(`✓ HumanBehavior activated`);

  // Créer un context et vérifier User-Agent cohérent
  const context = await playwrightService.createContext();
  const page = await context.newPage();

  const userAgent = await page.evaluate(() => navigator.userAgent);
  console.log(`✓ User-Agent: ${userAgent.substring(0, 80)}...`);

  // Vérifier viewport
  const viewport = page.viewportSize();
  console.log(`✓ Viewport: ${viewport.width}x${viewport.height}`);

  if (!viewport.width || !viewport.height) {
    throw new Error('Invalid viewport');
  }

  // Nettoyer
  await playwrightService.closeContext(context);
  await playwrightService.close();

  console.log(`✓ Playwright integration works correctly`);
}

/**
 * Exécute tous les tests
 */
async function runAllTests() {
  console.log('Starting all tests...\n');

  await runTest('User-Agent Selection et Cohérence', testUserAgentSelection);
  await runTest('Génération Trajectoire Souris (Bézier)', testMousePathGeneration);
  await runTest('Fonction Easing (Accélération/Décélération)', testEasingFunction);
  await runTest('Scroll Progressif avec Page Réelle', testSmoothScroll);
  await runTest('Frappe Clavier Humaine avec Erreurs', testHumanTyping);
  await runTest('Scroll vers Élément', testScrollToElement);
  await runTest('Intégration PlaywrightService', testPlaywrightIntegration);

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
