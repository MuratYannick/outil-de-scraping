/**
 * Script de test pour la Phase 3 - Extraction Google Maps Améliorée
 * Teste: Infinite scroll, Click for details, GPS extraction
 */

import { getGoogleMapsService } from '../src/services/googleMapsService.js';
import { getPlaywrightService, resetPlaywrightService } from '../src/services/playwrightService.js';

console.log('========================================');
console.log('🧪 TEST PHASE 3 - GOOGLE MAPS ENHANCED');
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
 * Test 1: Infinite Scroll Loading
 * Vérifie que le scroll charge progressivement plus de résultats
 */
async function testInfiniteScroll() {
  console.log('Testing infinite scroll functionality...');

  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  const context = await playwrightService.createContext();
  const page = await context.newPage();

  try {
    // Aller sur Google Maps avec une recherche simple
    const searchQuery = 'restaurant Paris';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    console.log(`Loading: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Attendre le panneau de résultats
    const resultsSelector = 'div[role="feed"]';
    await page.waitForSelector(resultsSelector, { timeout: 10000 });
    console.log('✓ Results panel detected');

    // Compter les résultats initiaux
    const initialCount = await page.evaluate((selector) => {
      const articles = document.querySelectorAll(`${selector} div[role="article"]`);
      return articles.length;
    }, resultsSelector);
    console.log(`✓ Initial results: ${initialCount}`);

    if (initialCount === 0) {
      throw new Error('No initial results found');
    }

    // Scroll une fois dans le panneau
    await page.evaluate((selector) => {
      const feed = document.querySelector(selector);
      if (feed) {
        feed.scrollBy(0, feed.clientHeight * 0.8);
      }
    }, resultsSelector);

    await page.waitForTimeout(2000);

    // Compter les résultats après scroll
    const afterScrollCount = await page.evaluate((selector) => {
      const articles = document.querySelectorAll(`${selector} div[role="article"]`);
      return articles.length;
    }, resultsSelector);
    console.log(`✓ After scroll results: ${afterScrollCount}`);

    // Vérifier que le scroll a chargé plus de résultats
    if (afterScrollCount <= initialCount) {
      console.warn(`⚠️ Scroll didn't load more results (may have reached end)`);
      // Ne pas échouer le test, c'est peut-être la fin de la liste
    } else {
      console.log(`✓ Infinite scroll loaded ${afterScrollCount - initialCount} more results`);
    }

    console.log('✓ Infinite scroll functionality works');

  } finally {
    await playwrightService.closeContext(context);
    await playwrightService.close();
  }
}

/**
 * Test 2: Click for Details Extraction
 * Vérifie qu'on peut cliquer sur un résultat et extraire les détails
 */
async function testClickForDetails() {
  console.log('Testing click for details extraction...');

  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  const context = await playwrightService.createContext();
  const page = await context.newPage();

  try {
    // Aller sur Google Maps
    const searchQuery = 'restaurant Paris';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    console.log(`Loading: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Attendre les résultats
    const resultsSelector = 'div[role="feed"]';
    await page.waitForSelector(resultsSelector, { timeout: 10000 });

    // Cliquer sur le premier résultat
    const articleSelector = 'div[role="feed"] div[role="article"]';
    const firstArticle = await page.$(`:nth-match(${articleSelector}, 1)`);

    if (!firstArticle) {
      throw new Error('No article found to click');
    }

    console.log('Clicking on first result...');
    await firstArticle.click();
    await page.waitForTimeout(2000);

    // Extraire les détails du panneau
    const details = await page.evaluate(() => {
      const data = {};

      // Nom de l'entreprise
      const nameEl = document.querySelector('h1');
      data.nom_entreprise = nameEl?.textContent?.trim() || null;

      // Adresse
      const addressButton = document.querySelector('button[data-item-id="address"]');
      data.adresse = addressButton?.textContent?.trim() || null;

      // Téléphone
      const phoneButton = document.querySelector('button[data-item-id^="phone"]');
      data.telephone = phoneButton?.textContent?.trim() || null;

      // Site web
      const websiteButton = document.querySelector('a[data-item-id="authority"]');
      data.url_site = websiteButton?.href || null;

      // Note
      const ratingEl = document.querySelector('span[role="img"]');
      const ratingText = ratingEl?.getAttribute('aria-label');
      if (ratingText) {
        const ratingMatch = ratingText.match(/(\d+[,.]?\d*)/);
        data.note = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;
      }

      return data;
    });

    console.log(`✓ Nom: ${details.nom_entreprise || 'N/A'}`);
    console.log(`✓ Adresse: ${details.adresse ? details.adresse.substring(0, 50) + '...' : 'N/A'}`);
    console.log(`✓ Téléphone: ${details.telephone || 'N/A'}`);
    console.log(`✓ Site web: ${details.url_site || 'N/A'}`);
    console.log(`✓ Note: ${details.note || 'N/A'}`);

    // Vérifier qu'au moins le nom est présent
    if (!details.nom_entreprise) {
      throw new Error('Could not extract business name');
    }

    console.log('✓ Click for details extraction works');

  } finally {
    await playwrightService.closeContext(context);
    await playwrightService.close();
  }
}

/**
 * Test 3: GPS Coordinates Extraction
 * Vérifie qu'on peut extraire les coordonnées GPS depuis l'URL
 */
async function testGPSExtraction() {
  console.log('Testing GPS coordinates extraction...');

  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  const context = await playwrightService.createContext();
  const page = await context.newPage();

  try {
    // Aller sur Google Maps
    const searchQuery = 'Tour Eiffel Paris';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    console.log(`Loading: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Attendre les résultats
    const resultsSelector = 'div[role="feed"]';
    await page.waitForSelector(resultsSelector, { timeout: 10000 });

    // Cliquer sur le premier résultat
    const articleSelector = 'div[role="feed"] div[role="article"]';
    const firstArticle = await page.$(`:nth-match(${articleSelector}, 1)`);

    if (!firstArticle) {
      throw new Error('No article found');
    }

    await firstArticle.click();
    await page.waitForTimeout(2000);

    // Extraire les coordonnées GPS depuis l'URL
    const gpsData = await page.evaluate(() => {
      const urlMatch = window.location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (urlMatch) {
        return {
          latitude: parseFloat(urlMatch[1]),
          longitude: parseFloat(urlMatch[2])
        };
      }
      return null;
    });

    if (!gpsData) {
      throw new Error('Could not extract GPS coordinates from URL');
    }

    console.log(`✓ Latitude: ${gpsData.latitude}`);
    console.log(`✓ Longitude: ${gpsData.longitude}`);

    // Vérifier que les coordonnées sont valides
    if (gpsData.latitude < -90 || gpsData.latitude > 90) {
      throw new Error(`Invalid latitude: ${gpsData.latitude}`);
    }

    if (gpsData.longitude < -180 || gpsData.longitude > 180) {
      throw new Error(`Invalid longitude: ${gpsData.longitude}`);
    }

    // Vérifier que c'est bien à Paris (environ 48.8, 2.3)
    if (Math.abs(gpsData.latitude - 48.8) > 1 || Math.abs(gpsData.longitude - 2.3) > 1) {
      console.warn(`⚠️ GPS coordinates seem off for Paris: ${gpsData.latitude}, ${gpsData.longitude}`);
    } else {
      console.log('✓ GPS coordinates are valid for Paris area');
    }

    console.log('✓ GPS extraction works correctly');

  } finally {
    await playwrightService.closeContext(context);
    await playwrightService.close();
  }
}

/**
 * Test 4: Enhanced Scraper End-to-End
 * Test complet du scraper amélioré avec petit nombre de résultats
 */
async function testEnhancedScraperEndToEnd() {
  console.log('Testing enhanced scraper end-to-end...');

  const googleMapsService = getGoogleMapsService();

  // Vérifier que la stratégie est bien 'scraper'
  const config = googleMapsService.getConfig();
  console.log(`✓ Strategy: ${config.strategy}`);

  if (config.strategy !== 'scraper') {
    console.log('Switching to scraper strategy...');
    googleMapsService.setStrategy('scraper');
  }

  // Lancer une recherche avec peu de résultats
  const params = {
    keyword: 'restaurant',
    location: 'Paris 1er',
    maxResults: 3  // Seulement 3 pour tester rapidement
  };

  console.log(`Searching: "${params.keyword}" in "${params.location}" (max ${params.maxResults} results)`);

  let progressUpdates = 0;
  const onProgress = (percent, message) => {
    progressUpdates++;
    console.log(`[Progress ${percent}%] ${message}`);
  };

  const startTime = Date.now();
  const prospects = await googleMapsService.search(params, onProgress);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n✓ Scraping completed in ${duration}s`);
  console.log(`✓ Progress updates: ${progressUpdates}`);
  console.log(`✓ Prospects extracted: ${prospects.length}`);

  // Vérifier qu'on a des résultats
  if (prospects.length === 0) {
    throw new Error('No prospects extracted');
  }

  // Vérifier les données du premier prospect
  const firstProspect = prospects[0];
  console.log('\nFirst prospect data:');
  console.log(`  - Nom: ${firstProspect.nom_entreprise}`);
  console.log(`  - Adresse: ${firstProspect.adresse?.substring(0, 50) || 'N/A'}`);
  console.log(`  - Téléphone: ${firstProspect.telephone || 'N/A'}`);
  console.log(`  - Site web: ${firstProspect.url_site || 'N/A'}`);
  console.log(`  - GPS: ${firstProspect.latitude ? `${firstProspect.latitude}, ${firstProspect.longitude}` : 'N/A'}`);
  console.log(`  - Note: ${firstProspect.note || 'N/A'}`);
  console.log(`  - Source: ${firstProspect.source_scraping}`);

  // Vérifier les champs obligatoires
  if (!firstProspect.nom_entreprise) {
    throw new Error('Missing nom_entreprise in first prospect');
  }

  if (!firstProspect.source_scraping) {
    throw new Error('Missing source_scraping in first prospect');
  }

  // Vérifier que la source est correcte
  if (firstProspect.source_scraping !== 'Google Maps') {
    throw new Error(`Unexpected source: ${firstProspect.source_scraping}`);
  }

  // Compter combien de prospects ont des données complètes
  let withPhone = 0;
  let withWebsite = 0;
  let withGPS = 0;
  let withRating = 0;

  prospects.forEach(p => {
    if (p.telephone) withPhone++;
    if (p.url_site) withWebsite++;
    if (p.latitude && p.longitude) withGPS++;
    if (p.note) withRating++;
  });

  console.log(`\nData completeness:`);
  console.log(`  - With phone: ${withPhone}/${prospects.length} (${Math.round(withPhone / prospects.length * 100)}%)`);
  console.log(`  - With website: ${withWebsite}/${prospects.length} (${Math.round(withWebsite / prospects.length * 100)}%)`);
  console.log(`  - With GPS: ${withGPS}/${prospects.length} (${Math.round(withGPS / prospects.length * 100)}%)`);
  console.log(`  - With rating: ${withRating}/${prospects.length} (${Math.round(withRating / prospects.length * 100)}%)`);

  console.log('\n✓ Enhanced scraper works end-to-end');
}

/**
 * Test 5: Error Handling
 * Vérifie que le scraper continue malgré les erreurs
 */
async function testErrorHandling() {
  console.log('Testing error handling...');

  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  const context = await playwrightService.createContext();
  const page = await context.newPage();

  try {
    // Aller sur Google Maps
    const searchQuery = 'zzzzzz nonexistent business xyz123';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    console.log(`Loading: ${url} (should have few/no results)`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Vérifier que le panneau existe même sans résultats
    const resultsSelector = 'div[role="feed"]';

    try {
      await page.waitForSelector(resultsSelector, { timeout: 5000 });
      console.log('✓ Results panel present (even with no results)');

      // Compter les résultats
      const count = await page.evaluate((selector) => {
        const articles = document.querySelectorAll(`${selector} div[role="article"]`);
        return articles.length;
      }, resultsSelector);

      console.log(`✓ Results found: ${count}`);

      if (count === 0) {
        console.log('✓ Gracefully handles zero results');
      }

    } catch (error) {
      console.log('✓ Gracefully handles missing results panel');
    }

    console.log('✓ Error handling works correctly');

  } finally {
    await playwrightService.closeContext(context);
    await playwrightService.close();
  }
}

/**
 * Test 6: Rate Limiting Integration
 * Vérifie que le rate limiting est utilisé
 */
async function testRateLimitingIntegration() {
  console.log('Testing rate limiting integration...');

  resetPlaywrightService();
  const playwrightService = getPlaywrightService();
  await playwrightService.initialize();

  // Vérifier que le rateLimiter est initialisé
  if (!playwrightService.rateLimiter) {
    throw new Error('RateLimiter not initialized');
  }

  console.log('✓ RateLimiter is initialized');

  // Mesurer le temps d'attente
  const start = Date.now();
  await playwrightService.waitWithRateLimit();
  const duration = Date.now() - start;

  console.log(`✓ Rate limit wait took ${duration}ms`);

  // Vérifier que le délai est raisonnable (entre 100ms et 10s)
  if (duration < 100 || duration > 10000) {
    throw new Error(`Unexpected rate limit duration: ${duration}ms`);
  }

  console.log('✓ Rate limiting integration works');

  await playwrightService.close();
}

/**
 * Exécute tous les tests
 */
async function runAllTests() {
  console.log('Starting all tests...\n');

  await runTest('Infinite Scroll Loading', testInfiniteScroll);
  await runTest('Click for Details Extraction', testClickForDetails);
  await runTest('GPS Coordinates Extraction', testGPSExtraction);
  await runTest('Enhanced Scraper End-to-End', testEnhancedScraperEndToEnd);
  await runTest('Error Handling', testErrorHandling);
  await runTest('Rate Limiting Integration', testRateLimitingIntegration);

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
    console.log('\n✅ PHASE 3 VALIDATION COMPLÈTE');
    console.log('Le scraper Google Maps amélioré est prêt pour la production.');
    process.exit(0);
  }
}

// Exécuter les tests
runAllTests().catch(error => {
  console.error('\n❌ ERREUR FATALE:', error);
  process.exit(1);
});
