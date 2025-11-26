/**
 * Script de migration pour ajouter un index unique sur (nom_entreprise, adresse)
 * Empêche les doublons de prospects ayant le même nom ET la même adresse
 *
 * À exécuter avec: node scripts/migrate-add-unique-index.js
 */

import { sequelize } from '../src/models/index.js';

async function migrate() {
  console.log('🔄 Migration : Ajout index unique (nom_entreprise, adresse)\n');

  try {
    // Vérifier si l'index existe déjà
    console.log('1️⃣ Vérification de l\'index existant...');
    const [indexes] = await sequelize.query(`
      SHOW INDEX FROM prospects WHERE Key_name = 'unique_entreprise_adresse';
    `);

    if (indexes.length > 0) {
      console.log('⚠️  L\'index unique_entreprise_adresse existe déjà');
      console.log('   Voulez-vous le recréer ? (Cela nécessite de supprimer les doublons d\'abord)');
      process.exit(0);
    }

    console.log('✅ Index n\'existe pas encore\n');

    // Vérifier s'il existe des doublons
    console.log('2️⃣ Vérification des doublons existants...');
    const [duplicates] = await sequelize.query(`
      SELECT nom_entreprise, adresse, COUNT(*) as count
      FROM prospects
      WHERE nom_entreprise IS NOT NULL AND adresse IS NOT NULL
      GROUP BY nom_entreprise, adresse
      HAVING COUNT(*) > 1;
    `);

    if (duplicates.length > 0) {
      console.log(`⚠️  ${duplicates.length} doublons détectés !\n`);
      console.log('Exemples de doublons :');
      duplicates.slice(0, 5).forEach(dup => {
        console.log(`   - "${dup.nom_entreprise}" à "${dup.adresse}" (${dup.count} fois)`);
      });
      console.log('\n❌ ERREUR: Impossible de créer l\'index unique avec des doublons');
      console.log('\n💡 Solution: Exécutez d\'abord le script de nettoyage :');
      console.log('   node scripts/clean-duplicates.js');
      process.exit(1);
    }

    console.log('✅ Aucun doublon détecté\n');

    // Créer l'index unique
    console.log('3️⃣ Création de l\'index unique...');
    await sequelize.query(`
      CREATE UNIQUE INDEX unique_entreprise_adresse
      ON prospects(nom_entreprise, adresse);
    `);
    console.log('✅ Index créé avec succès\n');

    // Vérifier que l'index a été créé
    console.log('4️⃣ Vérification finale...');
    const [finalCheck] = await sequelize.query(`
      SHOW INDEX FROM prospects WHERE Key_name = 'unique_entreprise_adresse';
    `);

    if (finalCheck.length > 0) {
      console.log('✅ Index vérifié :');
      console.log(`   Nom: ${finalCheck[0].Key_name}`);
      console.log(`   Colonnes: ${finalCheck.map(i => i.Column_name).join(', ')}`);
      console.log(`   Unique: ${finalCheck[0].Non_unique === 0 ? 'Oui' : 'Non'}`);
    }

    console.log('\n✅ Migration terminée avec succès !');
    console.log('\n💡 Les futurs scrapings ne créeront plus de doublons (nom + adresse identiques)');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur durant la migration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrate();
