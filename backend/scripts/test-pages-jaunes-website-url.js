/**
 * Script de test pour vérifier l'extraction de l'URL du site web depuis Pages Jaunes
 * Teste avec l'exemple réel : Caron Plomberie
 */

import { JSDOM } from 'jsdom';

// HTML réel de la carte Caron Plomberie (simplifié pour le test)
const htmlCard = `
<li id="bi-50803883" class="bi bi-generic bi-propay bi-propay-desktop-wide">
  <div class="bi-with-visual">
    <div class="bi-content">
      <div class="bi-header-title">
        <a class="bi-denomination pj-link" href="/pros/50803883">
          <h3 class="truncate-2-lines">Caron Plomberie</h3>
        </a>
      </div>
      <div class="bi-address small">
        <a title="Voir le plan" class="pj-lb pj-link" href="#">
          16 avenue Edith Cavell 83400 Hyères
          <span class="icon icon-autour-meteo"></span>
          <span class="label-adresse">Voir le plan</span>
        </a>
        <a title="Site web nouvelle fenêtre" class="hidden-phone bi-website pj-lb pj-link" target="_blank" href="http://www.caronplomberie.fr" rel="noopener">
          <span class="icon icon-lien" aria-hidden="true"></span>
          Site web
        </a>
      </div>
    </div>
  </div>
</li>
`;

console.log('🧪 Test d\'extraction de l\'URL du site web depuis Pages Jaunes\n');
console.log('='.repeat(80) + '\n');

// Simuler l'extraction côté navigateur (comme dans extractProspectData)
const dom = new JSDOM(htmlCard);
const el = dom.window.document.querySelector('li');

const result = {
  nom_entreprise: null,
  adresse: null,
  url_site: null,
};

// Nom de l'entreprise
const nameSelectors = [
  '.bi-denomination h3',
  '.bi-denomination',
  '[class*="denomination"]',
  'h2',
  'h3',
  '[itemprop="name"]'
];
for (const selector of nameSelectors) {
  const nameEl = el.querySelector(selector);
  if (nameEl && nameEl.textContent.trim()) {
    result.nom_entreprise = nameEl.textContent.trim();
    break;
  }
}

// Adresse
const addressSelectors = [
  '.bi-address',
  '[class*="address"]',
  '[itemprop="address"]'
];
for (const selector of addressSelectors) {
  const addrEl = el.querySelector(selector);
  if (addrEl && addrEl.textContent.trim()) {
    let address = addrEl.textContent.trim()
      .replace(/\s+/g, " ")
      .replace(/Voir le plan/gi, "")
      .replace(/Site web/gi, "")
      .trim();
    result.adresse = address;
    break;
  }
}

// Site web - NOUVEAU SELECTEUR
const websiteSelectors = [
  'a.bi-website',              // Format 2024: lien direct avec classe bi-website
  '.bi-address a.bi-website',  // Alternative: dans le bloc adresse
  'a[data-pjlid]',
  'a[class*="website"]',
  'a[class*="site-internet"]',
  '.bi-website a'
];

console.log('🔍 Test des sélecteurs pour le site web:\n');
let selectorUsed = null;

for (const selector of websiteSelectors) {
  const webEl = el.querySelector(selector);
  console.log(`   Sélecteur: "${selector}"`);

  if (webEl) {
    const href = webEl.getAttribute("href");
    console.log(`      ✓ Élément trouvé`);
    console.log(`      href="${href}"`);

    // Vérifier que ce n'est pas un lien interne Pages Jaunes
    if (href && !href.includes('pagesjaunes.fr') && !href.startsWith('#')) {
      result.url_site = href;
      selectorUsed = selector;
      console.log(`      ✅ URL valide extraite !`);
      break;
    } else {
      console.log(`      ⚠️  URL invalide (lien interne)`);
    }
  } else {
    console.log(`      ✗ Élément non trouvé`);
  }
  console.log();
}

console.log('='.repeat(80) + '\n');
console.log('📊 RÉSULTATS DE L\'EXTRACTION:\n');
console.log(`Nom entreprise: "${result.nom_entreprise}"`);
console.log(`Adresse: "${result.adresse}"`);
console.log(`URL site: "${result.url_site}"`);

console.log('\n' + '='.repeat(80) + '\n');

// Validation
const expectedUrl = 'http://www.caronplomberie.fr';
const expectedName = 'Caron Plomberie';

let success = true;

if (result.nom_entreprise !== expectedName) {
  console.log(`❌ ÉCHEC: Nom entreprise incorrect`);
  console.log(`   Attendu: "${expectedName}"`);
  console.log(`   Obtenu: "${result.nom_entreprise}"`);
  success = false;
}

if (result.url_site !== expectedUrl) {
  console.log(`❌ ÉCHEC: URL site web incorrect`);
  console.log(`   Attendu: "${expectedUrl}"`);
  console.log(`   Obtenu: "${result.url_site}"`);
  success = false;
}

if (!result.adresse || !result.adresse.includes('Hyères')) {
  console.log(`❌ ÉCHEC: Adresse incorrecte ou manquante`);
  console.log(`   Obtenu: "${result.adresse}"`);
  success = false;
}

if (success) {
  console.log('✅ TOUS LES TESTS SONT PASSÉS !');
  console.log(`\n🎯 Sélecteur utilisé: "${selectorUsed}"`);
  console.log(`✅ L'URL du site web "${expectedUrl}" a été correctement extraite.`);
  console.log(`✅ Le scraper Pages Jaunes va maintenant récupérer les URLs des sites web.`);
} else {
  console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
  process.exit(1);
}

console.log('\n' + '='.repeat(80) + '\n');
