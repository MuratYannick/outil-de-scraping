/**
 * Script de test pour vérifier que les numéros de téléphone
 * ne sont pas extraits dans le champ adresse
 *
 * Test avec des prospects qui n'ont pas d'adresse sur Google Maps
 */

import { getGoogleMapsService } from '../src/services/googleMapsService.js';

console.log('🧪 Test séparation Adresse vs Téléphone\n');
console.log('═'.repeat(80));

async function testAddressVsPhone() {
  try {
    console.log('📍 Recherche: "plombier" à "Paris 15"\n');
    console.log('But: Vérifier que les téléphones ne sont pas mis dans le champ adresse\n');

    // Créer une instance du service
    const googleMapsService = getGoogleMapsService();

    // Scraper avec limite de 10 résultats pour avoir plus de cas
    const results = await googleMapsService.search({
      keyword: 'plombier',
      location: 'Paris 15',
      maxResults: 10
    });

    console.log(`\n✅ Extraction terminée: ${results.length} prospects trouvés\n`);
    console.log('═'.repeat(80));

    // Analyser chaque prospect
    let correctSeparation = 0;
    let phoneInAddress = 0;
    let noAddress = 0;
    let withAddress = 0;

    const phonePattern = /\b0[1-9](?:[\s\.]?\d{2}){4}\b|\b\+33[\s\.]?[1-9](?:[\s\.]?\d{2}){4}\b/;

    results.forEach((prospect, index) => {
      console.log(`\n${index + 1}. ${prospect.nom_entreprise}`);
      console.log('─'.repeat(80));

      const hasAddress = prospect.adresse && prospect.adresse.trim() !== '';
      const hasPhone = prospect.telephone && prospect.telephone.trim() !== '';

      console.log(`   Adresse: ${prospect.adresse || 'N/A'}`);
      console.log(`   Téléphone: ${prospect.telephone || 'N/A'}`);

      // Vérifier si l'adresse contient un numéro de téléphone
      if (hasAddress && phonePattern.test(prospect.adresse)) {
        console.log(`   ❌ ERREUR: L'adresse contient un numéro de téléphone !`);
        phoneInAddress++;
      } else if (hasAddress) {
        console.log(`   ✅ OK: Adresse valide (pas de téléphone dedans)`);
        withAddress++;
        correctSeparation++;
      } else if (!hasAddress && hasPhone) {
        console.log(`   ✅ OK: Pas d'adresse mais téléphone présent (normal si pas d'adresse sur Maps)`);
        noAddress++;
        correctSeparation++;
      } else if (!hasAddress && !hasPhone) {
        console.log(`   ⚠️  WARNING: Ni adresse ni téléphone`);
        noAddress++;
        correctSeparation++;
      }
    });

    // Résumé
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RÉSUMÉ:');
    console.log('─'.repeat(80));
    console.log(`   Total prospects: ${results.length}`);
    console.log(`   ✅ Avec adresse valide: ${withAddress}`);
    console.log(`   ✅ Sans adresse (normal): ${noAddress}`);
    console.log(`   ❌ Téléphone dans adresse: ${phoneInAddress}`);
    console.log(`   Taux de séparation correcte: ${Math.round((correctSeparation / results.length) * 100)}%`);
    console.log('═'.repeat(80));

    // Verdict
    console.log('\n' + '═'.repeat(80));
    if (phoneInAddress === 0) {
      console.log('✅ TEST RÉUSSI: Aucun téléphone trouvé dans les adresses');
      console.log(`   ${withAddress}/${results.length} prospects ont une adresse valide`);
      console.log(`   ${noAddress}/${results.length} prospects n'ont pas d'adresse (normal)`);
      process.exit(0);
    } else {
      console.log(`❌ TEST ÉCHOUÉ: ${phoneInAddress} prospect(s) ont un téléphone dans le champ adresse`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testAddressVsPhone();
