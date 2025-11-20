import { getLinkedInScraper } from "../src/services/scrapers/linkedInScraper.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Script de test pour le scraper LinkedIn (Mode Public)
 *
 * ⚠️ LIMITATIONS À CONNAÎTRE :
 * - Volume limité : 5-10 profils par session
 * - Données de base uniquement (nom, titre, entreprise, localisation)
 * - Délais longs : 10-30 secondes entre chaque profil
 * - CAPTCHA possible en usage intensif
 * - Taux de succès cible : 50%+
 *
 * 📋 RECOMMANDATION : Usage ponctuel, pas de scraping massif
 */

async function testLinkedInScraper() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🧪 TEST LINKEDIN SCRAPER (MODE PUBLIC)");
  console.log("═══════════════════════════════════════════════════════\n");

  const scraper = getLinkedInScraper();

  // Configuration des tests
  const testCases = [
    {
      id: 1,
      keyword: "développeur full stack",
      location: "Paris",
      maxResults: 3,
      description: "Développeurs Full Stack à Paris"
    },
    {
      id: 2,
      keyword: "plombier",
      location: "Lyon",
      maxResults: 3,
      description: "Plombiers à Lyon"
    },
    {
      id: 3,
      keyword: "data scientist",
      location: "Marseille",
      maxResults: 3,
      description: "Data Scientists à Marseille"
    }
  ];

  let totalTests = 0;
  let successfulTests = 0;
  let failedTests = 0;
  let totalProspectsFound = 0;
  let captchaEncountered = false;

  console.log(`📊 Configuration des tests :`);
  console.log(`   - Nombre de cas de test : ${testCases.length}`);
  console.log(`   - Profils max par test : 3`);
  console.log(`   - Délais entre profils : 10-30 secondes`);
  console.log(`\n═══════════════════════════════════════════════════════\n`);

  // Exécuter chaque cas de test
  for (const testCase of testCases) {
    totalTests++;

    console.log(`\n┌─────────────────────────────────────────────────────┐`);
    console.log(`│ TEST ${testCase.id}/${testCases.length} : ${testCase.description.padEnd(45)} │`);
    console.log(`└─────────────────────────────────────────────────────┘\n`);

    console.log(`🔍 Paramètres :`);
    console.log(`   - Keyword    : "${testCase.keyword}"`);
    console.log(`   - Location   : "${testCase.location}"`);
    console.log(`   - Max Results: ${testCase.maxResults}`);
    console.log();

    try {
      const startTime = Date.now();

      // Callback de progression
      const onProgress = (data) => {
        console.log(`📈 Progression [${data.step}]: ${data.message} (${Math.round(data.progress)}%)`);
      };

      // Exécuter le scraping
      const prospects = await scraper.scrape(
        testCase.keyword,
        testCase.location,
        {
          maxResults: testCase.maxResults,
          onProgress
        }
      );

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      // Analyser les résultats
      if (prospects.length > 0) {
        successfulTests++;
        totalProspectsFound += prospects.length;

        console.log(`\n✅ TEST ${testCase.id} RÉUSSI`);
        console.log(`   - Prospects trouvés : ${prospects.length}/${testCase.maxResults}`);
        console.log(`   - Durée : ${duration}s`);
        console.log(`   - Taux de succès : ${Math.round((prospects.length / testCase.maxResults) * 100)}%`);

        // Afficher les prospects
        console.log(`\n   Prospects extraits :`);
        prospects.forEach((prospect, index) => {
          console.log(`\n   ${index + 1}. ${prospect.nom_contact || 'Nom inconnu'}`);
          console.log(`      - Titre : ${prospect.nom_entreprise ? `chez ${prospect.nom_entreprise}` : 'N/A'}`);
          console.log(`      - Localisation : ${prospect.adresse || 'N/A'}`);
          console.log(`      - URL : ${prospect.url_site || 'N/A'}`);
        });

      } else {
        failedTests++;

        console.log(`\n❌ TEST ${testCase.id} ÉCHOUÉ`);
        console.log(`   - Aucun prospect trouvé`);
        console.log(`   - Durée : ${duration}s`);

        // Vérifier si CAPTCHA détecté
        if (scraper.captchaDetected) {
          captchaEncountered = true;
          console.log(`   - ⚠️ CAPTCHA détecté - Arrêt des tests`);
          break;
        }
      }

    } catch (error) {
      failedTests++;

      console.log(`\n❌ TEST ${testCase.id} ERREUR`);
      console.log(`   - Message : ${error.message}`);

      // Arrêter si erreur critique
      if (error.message.includes("CAPTCHA") || error.message.includes("blocked")) {
        captchaEncountered = true;
        console.log(`   - ⚠️ Blocage détecté - Arrêt des tests`);
        break;
      }
    }

    // Délai entre les tests pour éviter détection
    if (testCase.id < testCases.length) {
      console.log(`\n⏳ Délai de 30 secondes avant le prochain test...\n`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  // Résumé final
  console.log(`\n\n═══════════════════════════════════════════════════════`);
  console.log(`📊 RÉSUMÉ DES TESTS`);
  console.log(`═══════════════════════════════════════════════════════\n`);

  console.log(`Tests exécutés      : ${totalTests}/${testCases.length}`);
  console.log(`Tests réussis       : ${successfulTests} (${Math.round((successfulTests / totalTests) * 100)}%)`);
  console.log(`Tests échoués       : ${failedTests}`);
  console.log(`Prospects trouvés   : ${totalProspectsFound}`);
  console.log(`CAPTCHA rencontré   : ${captchaEncountered ? '⚠️ OUI' : '✅ NON'}`);

  // Taux de succès global
  const successRate = Math.round((successfulTests / totalTests) * 100);
  console.log(`\nTaux de succès global : ${successRate}%`);

  // Verdict
  console.log(`\n───────────────────────────────────────────────────────`);
  if (successRate >= 70) {
    console.log(`🎉 VERDICT : EXCELLENT (≥ 70%)`);
  } else if (successRate >= 50) {
    console.log(`✅ VERDICT : BON (≥ 50%)`);
  } else if (successRate >= 30) {
    console.log(`⚠️  VERDICT : ACCEPTABLE (≥ 30%)`);
  } else {
    console.log(`❌ VERDICT : INSUFFISANT (< 30%)`);
  }

  // Recommandations
  console.log(`\n📋 RECOMMANDATIONS :`);

  if (captchaEncountered) {
    console.log(`   ⚠️ CAPTCHA détecté : Réduire le volume de scraping`);
    console.log(`   - Utiliser des proxies résidentiels`);
    console.log(`   - Augmenter les délais entre profils (30-60s)`);
    console.log(`   - Limiter à 3-5 profils par session`);
  }

  if (successRate < 50) {
    console.log(`   ⚠️ Taux de succès faible :`);
    console.log(`   - Vérifier les sélecteurs CSS (peuvent avoir changé)`);
    console.log(`   - Tester avec des proxies`);
    console.log(`   - Vérifier les logs pour identifier les erreurs`);
  }

  if (successRate >= 50 && !captchaEncountered) {
    console.log(`   ✅ Scraper fonctionnel pour usage ponctuel`);
    console.log(`   - Limiter à 5-10 profils par session`);
    console.log(`   - Respecter délais de 10-30s entre profils`);
    console.log(`   - Utiliser en mode HYBRID (anti-détection)`);
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`🏁 TESTS TERMINÉS`);
  console.log(`═══════════════════════════════════════════════════════\n`);
}

// Lancer les tests
testLinkedInScraper()
  .then(() => {
    console.log("✓ Tests terminés avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ Erreur lors des tests:", error);
    process.exit(1);
  });
