/**
 * Script de test : Analyse du taux de réussite de scraping
 * Test avec stratégie STEALTH SEUL pour Pages Jaunes et Google Maps
 * Objectif : 50 prospects par source
 */

import { PagesJaunesScraper } from '../src/services/scrapers/pagesJaunesScraper.js';
import GoogleMapsService from '../src/services/googleMapsService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  const separator = '═'.repeat(80);
  log(`\n${separator}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${separator}`, 'cyan');
}

function logSubSection(title) {
  log(`\n${'─'.repeat(80)}`, 'blue');
  log(`  ${title}`, 'blue');
  log(`${'─'.repeat(80)}`, 'blue');
}

/**
 * Teste le scraping Pages Jaunes
 */
async function testPagesJaunes() {
  logSection('TEST 1: PAGES JAUNES - Stratégie STEALTH SEUL');

  log('Configuration:', 'yellow');
  log(`  • Stratégie: ${process.env.ANTIBOT_STRATEGY}`, 'yellow');
  log(`  • Stealth activé: ${process.env.STEALTH_ENABLED}`, 'yellow');
  log(`  • Proxies activés: ${process.env.PROXY_ENABLED}`, 'yellow');
  log(`  • CAPTCHA activé: ${process.env.CAPTCHA_SOLVER_ENABLED}`, 'yellow');
  log(`  • Objectif: 50 prospects`, 'yellow');

  const scraper = new PagesJaunesScraper();

  const testCases = [
    { keyword: 'restaurant', location: 'Paris', maxResults: 20 },
    { keyword: 'plombier', location: 'Lyon', maxResults: 20 },
    { keyword: 'boulangerie', location: 'Marseille', maxResults: 10 }
  ];

  let totalProspects = 0;
  let totalAttempts = 0;
  const results = [];

  for (const testCase of testCases) {
    if (totalProspects >= 50) break;

    logSubSection(`Recherche: "${testCase.keyword}" à "${testCase.location}"`);

    try {
      log(`⏳ Lancement du scraping...`, 'cyan');

      const startTime = Date.now();
      const result = await scraper.scrape(
        testCase.keyword,
        testCase.location,
        {
          maxPages: 2,
          maxResults: testCase.maxResults,
          excludeDuplicates: false
        }
      );
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      totalAttempts++;

      if (result.success && result.prospects.length > 0) {
        totalProspects += result.prospects.length;

        log(`✅ SUCCÈS`, 'green');
        log(`   • Prospects extraits: ${result.prospects.length}`, 'green');
        log(`   • Pages scrapées: ${result.pages_scraped}`, 'green');
        log(`   • Durée: ${duration}s`, 'green');
        log(`   • Total cumulé: ${totalProspects}/50`, 'green');

        // Afficher quelques exemples
        log(`\n   📋 Exemples de prospects extraits:`, 'cyan');
        result.prospects.slice(0, 3).forEach((p, i) => {
          log(`      ${i + 1}. ${p.nom_entreprise || 'N/A'}`, 'cyan');
          log(`         Tel: ${p.telephone || 'N/A'} | Ville: ${p.ville || 'N/A'}`, 'cyan');
        });

        results.push({
          keyword: testCase.keyword,
          location: testCase.location,
          success: true,
          prospectsCount: result.prospects.length,
          duration
        });
      } else {
        log(`❌ ÉCHEC - Aucun prospect extrait`, 'red');
        log(`   • Message: ${result.error || 'Aucune donnée trouvée'}`, 'red');
        log(`   • Durée: ${duration}s`, 'red');

        results.push({
          keyword: testCase.keyword,
          location: testCase.location,
          success: false,
          prospectsCount: 0,
          error: result.error || 'Aucune donnée',
          duration
        });
      }
    } catch (error) {
      totalAttempts++;
      log(`❌ ERREUR: ${error.message}`, 'red');

      results.push({
        keyword: testCase.keyword,
        location: testCase.location,
        success: false,
        prospectsCount: 0,
        error: error.message
      });
    }

    // Pause entre les requêtes
    if (totalProspects < 50) {
      log(`\n⏸️  Pause de 5 secondes...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  await scraper.close();

  // Résumé
  logSubSection('RÉSUMÉ PAGES JAUNES');
  log(`Total de tentatives: ${totalAttempts}`, 'cyan');
  log(`Prospects obtenus: ${totalProspects}/50 (${((totalProspects/50)*100).toFixed(1)}%)`, 'cyan');
  log(`Taux de réussite: ${((results.filter(r => r.success).length / totalAttempts) * 100).toFixed(1)}%`, 'cyan');

  return {
    source: 'Pages Jaunes',
    totalProspects,
    totalAttempts,
    successRate: ((results.filter(r => r.success).length / totalAttempts) * 100).toFixed(1),
    objectiveReached: totalProspects >= 50,
    details: results
  };
}

/**
 * Teste le scraping Google Maps
 */
async function testGoogleMaps() {
  logSection('TEST 2: GOOGLE MAPS - Stratégie STEALTH SEUL');

  log('Configuration:', 'yellow');
  log(`  • Stratégie: scraper (Playwright)`, 'yellow');
  log(`  • Stealth activé: ${process.env.STEALTH_ENABLED}`, 'yellow');
  log(`  • Proxies activés: ${process.env.PROXY_ENABLED}`, 'yellow');
  log(`  • CAPTCHA activé: ${process.env.CAPTCHA_SOLVER_ENABLED}`, 'yellow');
  log(`  • Objectif: 50 prospects`, 'yellow');

  const scraper = new GoogleMapsService();

  const testCases = [
    { keyword: 'restaurant', location: 'Paris', maxResults: 20 },
    { keyword: 'café', location: 'Lyon', maxResults: 20 },
    { keyword: 'coiffeur', location: 'Marseille', maxResults: 10 }
  ];

  let totalProspects = 0;
  let totalAttempts = 0;
  const results = [];

  for (const testCase of testCases) {
    if (totalProspects >= 50) break;

    logSubSection(`Recherche: "${testCase.keyword}" à "${testCase.location}"`);

    try {
      log(`⏳ Lancement du scraping...`, 'cyan');

      const startTime = Date.now();
      const result = await scraper.search({
        keyword: testCase.keyword,
        location: testCase.location,
        maxResults: testCase.maxResults
      });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      totalAttempts++;

      if (result && result.length > 0) {
        totalProspects += result.length;

        log(`✅ SUCCÈS`, 'green');
        log(`   • Prospects extraits: ${result.length}`, 'green');
        log(`   • Durée: ${duration}s`, 'green');
        log(`   • Total cumulé: ${totalProspects}/50`, 'green');

        // Afficher quelques exemples
        log(`\n   📋 Exemples de prospects extraits:`, 'cyan');
        result.slice(0, 3).forEach((p, i) => {
          log(`      ${i + 1}. ${p.nom_entreprise || 'N/A'}`, 'cyan');
          log(`         Adresse: ${p.adresse || 'N/A'}`, 'cyan');
        });

        results.push({
          keyword: testCase.keyword,
          location: testCase.location,
          success: true,
          prospectsCount: result.length,
          duration
        });
      } else {
        log(`❌ ÉCHEC - Aucun prospect extrait`, 'red');
        log(`   • Message: Aucune donnée trouvée`, 'red');
        log(`   • Durée: ${duration}s`, 'red');

        results.push({
          keyword: testCase.keyword,
          location: testCase.location,
          success: false,
          prospectsCount: 0,
          error: 'Aucune donnée',
          duration
        });
      }
    } catch (error) {
      totalAttempts++;
      log(`❌ ERREUR: ${error.message}`, 'red');

      results.push({
        keyword: testCase.keyword,
        location: testCase.location,
        success: false,
        prospectsCount: 0,
        error: error.message
      });
    }

    // Pause entre les requêtes
    if (totalProspects < 50) {
      log(`\n⏸️  Pause de 5 secondes...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Résumé
  logSubSection('RÉSUMÉ GOOGLE MAPS');
  log(`Total de tentatives: ${totalAttempts}`, 'cyan');
  log(`Prospects obtenus: ${totalProspects}/50 (${((totalProspects/50)*100).toFixed(1)}%)`, 'cyan');
  log(`Taux de réussite: ${((results.filter(r => r.success).length / totalAttempts) * 100).toFixed(1)}%`, 'cyan');

  return {
    source: 'Google Maps',
    totalProspects,
    totalAttempts,
    successRate: ((results.filter(r => r.success).length / totalAttempts) * 100).toFixed(1),
    objectiveReached: totalProspects >= 50,
    details: results
  };
}

/**
 * Main
 */
async function main() {
  logSection('🧪 ANALYSE DU TAUX DE RÉUSSITE - STRATÉGIE STEALTH SEUL');

  log('\n📊 Objectif: Obtenir 50 prospects par source', 'bright');
  log('🎯 Stratégie: STEALTH SEUL (sans proxies, sans CAPTCHA solver)', 'bright');
  log('📅 Date: ' + new Date().toLocaleString('fr-FR'), 'bright');

  const results = {
    pagesJaunes: null,
    googleMaps: null
  };

  try {
    // Test Pages Jaunes
    results.pagesJaunes = await testPagesJaunes();

    // Pause entre les deux sources
    log('\n⏸️  Pause de 10 secondes avant Google Maps...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Test Google Maps
    results.googleMaps = await testGoogleMaps();

  } catch (error) {
    log(`\n❌ ERREUR CRITIQUE: ${error.message}`, 'red');
    console.error(error);
  }

  // Rapport final
  logSection('📊 RAPPORT FINAL - ANALYSE DU TAUX DE RÉUSSITE');

  log('\n🔍 PAGES JAUNES:', 'bright');
  if (results.pagesJaunes) {
    log(`   • Prospects obtenus: ${results.pagesJaunes.totalProspects}/50`,
        results.pagesJaunes.objectiveReached ? 'green' : 'red');
    log(`   • Taux de réussite: ${results.pagesJaunes.successRate}%`,
        parseFloat(results.pagesJaunes.successRate) >= 50 ? 'green' : 'red');
    log(`   • Tentatives: ${results.pagesJaunes.totalAttempts}`, 'cyan');
  } else {
    log(`   • Non testé`, 'red');
  }

  log('\n🗺️  GOOGLE MAPS:', 'bright');
  if (results.googleMaps) {
    log(`   • Prospects obtenus: ${results.googleMaps.totalProspects}/50`,
        results.googleMaps.objectiveReached ? 'green' : 'red');
    log(`   • Taux de réussite: ${results.googleMaps.successRate}%`,
        parseFloat(results.googleMaps.successRate) >= 50 ? 'green' : 'red');
    log(`   • Tentatives: ${results.googleMaps.totalAttempts}`, 'cyan');
  } else {
    log(`   • Non testé`, 'red');
  }

  // Conclusion
  log('\n📝 CONCLUSION:', 'bright');

  const pjReached = results.pagesJaunes?.objectiveReached;
  const gmReached = results.googleMaps?.objectiveReached;

  if (pjReached && gmReached) {
    log('✅ Objectif atteint pour les deux sources avec STEALTH SEUL', 'green');
  } else if (pjReached || gmReached) {
    log('⚠️  Objectif partiellement atteint (une seule source fonctionne)', 'yellow');
    if (!pjReached) {
      log('   → Pages Jaunes nécessite une stratégie plus avancée (Proxies ou CAPTCHA)', 'yellow');
    }
    if (!gmReached) {
      log('   → Google Maps nécessite une stratégie plus avancée (Proxies ou API Places)', 'yellow');
    }
  } else {
    log('❌ Objectif NON atteint - STEALTH SEUL insuffisant', 'red');
    log('   → Recommandation: Activer PROXIES ou CAPTCHA SOLVER', 'red');
  }

  log('\n💡 RECOMMANDATIONS:', 'bright');
  log('   1. Si budget disponible: Activer API Google Places ($20/1000 requêtes)', 'cyan');
  log('   2. Si budget limité: Activer CAPTCHA Solver ($1.5-$3/1000)', 'cyan');
  log('   3. Si budget élevé: Mode HYBRID (Proxies + Stealth + CAPTCHA)', 'cyan');

  logSection('🏁 FIN DES TESTS');

  // Sauvegarder les résultats
  const reportPath = path.join(__dirname, 'success-rate-report.json');
  const fs = await import('fs');
  fs.writeFileSync(reportPath, JSON.stringify({
    date: new Date().toISOString(),
    strategy: 'STEALTH_SEUL',
    results
  }, null, 2));

  log(`\n📄 Rapport sauvegardé: ${reportPath}`, 'green');
}

// Exécution
main().catch(console.error);
