/**
 * Script d'analyse du DOM de Pages Jaunes
 * Capture le HTML et identifie les sélecteurs corrects
 */

import { getPlaywrightService } from '../src/services/playwrightService.js';
import { SCRAPER_IDS } from '../src/config/antiBotConfig.js';
import fs from 'fs';

console.log('🔍 Analyse du DOM de Pages Jaunes\n');
console.log('═'.repeat(80));

async function analyzePagesJaunesDOM() {
  const playwrightService = getPlaywrightService(SCRAPER_IDS.PAGES_JAUNES);

  try {
    // URL de test
    const url = 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier&ou=Paris&univers=pagesjaunes';

    console.log('\n📋 Initialisation...');
    await playwrightService.initialize();
    const context = await playwrightService.createContext();
    const page = await context.newPage();

    console.log(`\n🌐 Navigation vers: ${url}`);
    await playwrightService.navigateToPage(page, url, {
      waitUntil: "domcontentloaded"
    });

    // Attendre le chargement du contenu dynamique
    console.log('\n⏱️  Attente du chargement du contenu (10 secondes)...');
    await playwrightService.delay(10000);

    // Sauvegarder le HTML complet
    console.log('\n💾 Sauvegarde du HTML...');
    const html = await page.content();
    fs.writeFileSync('pages-jaunes-dom.html', html, 'utf8');
    console.log('✓ HTML sauvegardé dans: pages-jaunes-dom.html');

    // Analyser la structure
    console.log('\n🔍 Analyse de la structure...\n');

    const analysis = await page.evaluate(() => {
      const results = [];

      // Rechercher tous les conteneurs possibles qui ressemblent à des résultats
      const potentialSelectors = [
        'li', 'article', 'div[class*="item"]', 'div[class*="result"]',
        'div[class*="card"]', 'div[class*="listing"]', '[itemtype]',
        'div[data-test]', 'div[data-pj]', 'div[id*="result"]'
      ];

      for (const selector of potentialSelectors) {
        const elements = document.querySelectorAll(selector);

        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const el = elements[i];

          // Vérifier si cet élément contient du texte qui ressemble à un nom d'entreprise
          const text = el.textContent?.trim() || '';

          // Chercher des indices d'entreprise/téléphone/adresse
          const hasCompanyName = text.length > 5 && text.length < 200;
          const hasPhone = /\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/.test(text);
          const hasAddress = /\d+\s+[a-zA-Z\s]+,?\s*\d{5}/.test(text) || text.includes('rue') || text.includes('avenue');

          if (hasCompanyName || hasPhone || hasAddress) {
            // Récupérer tous les attributs class
            const classes = Array.from(el.classList || []);
            const id = el.id;
            const dataAttrs = {};

            for (const attr of el.attributes) {
              if (attr.name.startsWith('data-')) {
                dataAttrs[attr.name] = attr.value;
              }
            }

            // Chercher les sous-éléments intéressants
            const nameElement = el.querySelector('h2, h3, .title, [class*="name"], [class*="denomination"]');
            const phoneElement = el.querySelector('a[href^="tel:"], [class*="phone"], [class*="telephone"]');
            const addressElement = el.querySelector('[class*="address"], [class*="adresse"], address');
            const websiteElement = el.querySelector('a[class*="website"], a[class*="site"]');

            results.push({
              selector: selector,
              index: i,
              classes: classes,
              id: id || null,
              dataAttributes: dataAttrs,
              hasName: !!nameElement,
              hasPhone: !!phoneElement || hasPhone,
              hasAddress: !!addressElement || hasAddress,
              hasWebsite: !!websiteElement,
              textPreview: text.substring(0, 100),
              childrenInfo: {
                nameSelector: nameElement ? Array.from(nameElement.classList).join('.') : null,
                phoneSelector: phoneElement ? Array.from(phoneElement.classList).join('.') : null,
                addressSelector: addressElement ? Array.from(addressElement.classList).join('.') : null,
                websiteSelector: websiteElement ? Array.from(websiteElement.classList).join('.') : null,
              }
            });
          }
        }
      }

      return results;
    });

    // Afficher les résultats
    console.log('📊 ÉLÉMENTS POTENTIELS TROUVÉS:\n');
    console.log('─'.repeat(80));

    if (analysis.length === 0) {
      console.log('❌ Aucun élément de résultat trouvé!\n');
      console.log('💡 Vérifiez le fichier pages-jaunes-dom.html manuellement');
    } else {
      // Regrouper par sélecteur
      const grouped = {};
      for (const item of analysis) {
        if (!grouped[item.selector]) {
          grouped[item.selector] = [];
        }
        grouped[item.selector].push(item);
      }

      // Afficher les meilleurs candidats
      for (const [selector, items] of Object.entries(grouped)) {
        console.log(`\n🎯 Sélecteur: ${selector}`);
        console.log(`   Nombre d'éléments trouvés: ${items.length}`);

        const bestItem = items[0];
        console.log(`\n   Classes: ${bestItem.classes.join(', ') || 'aucune'}`);
        if (bestItem.id) console.log(`   ID: ${bestItem.id}`);
        if (Object.keys(bestItem.dataAttributes).length > 0) {
          console.log(`   Data attributes:`, bestItem.dataAttributes);
        }

        console.log(`\n   Contenu détecté:`);
        console.log(`     - Nom entreprise: ${bestItem.hasName ? '✓' : '✗'}`);
        console.log(`     - Téléphone: ${bestItem.hasPhone ? '✓' : '✗'}`);
        console.log(`     - Adresse: ${bestItem.hasAddress ? '✓' : '✗'}`);
        console.log(`     - Site web: ${bestItem.hasWebsite ? '✓' : '✗'}`);

        if (bestItem.childrenInfo.nameSelector) {
          console.log(`\n   Sous-sélecteurs:`);
          console.log(`     - Nom: .${bestItem.childrenInfo.nameSelector}`);
          if (bestItem.childrenInfo.phoneSelector)
            console.log(`     - Téléphone: .${bestItem.childrenInfo.phoneSelector}`);
          if (bestItem.childrenInfo.addressSelector)
            console.log(`     - Adresse: .${bestItem.childrenInfo.addressSelector}`);
          if (bestItem.childrenInfo.websiteSelector)
            console.log(`     - Site: .${bestItem.childrenInfo.websiteSelector}`);
        }

        console.log(`\n   Aperçu du texte:`);
        console.log(`   "${bestItem.textPreview}..."`);
        console.log('\n' + '─'.repeat(80));
      }
    }

    // Fermer
    await playwrightService.closeContext(context);

    console.log('\n✅ Analyse terminée!');
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Examinez le fichier pages-jaunes-dom.html');
    console.log('   2. Identifiez les meilleurs sélecteurs ci-dessus');
    console.log('   3. Mettez à jour pagesJaunesScraper.js avec les nouveaux sélecteurs\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

analyzePagesJaunesDOM();
