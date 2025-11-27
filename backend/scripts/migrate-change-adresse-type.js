/**
 * Script de migration pour changer le type de la colonne adresse
 * de TEXT à VARCHAR(500) pour permettre l'index unique
 *
 * À exécuter avec: node scripts/migrate-change-adresse-type.js
 */

import { sequelize } from '../src/models/index.js';

async function migrate() {
  console.log('🔄 Migration : Changement du type de la colonne adresse\n');
  console.log('   TEXT → VARCHAR(500)\n');

  try {
    // Vérifier si des adresses dépassent 500 caractères
    console.log('1️⃣ Vérification des adresses existantes...');
    const [longAddresses] = await sequelize.query(`
      SELECT id, nom_entreprise, LENGTH(adresse) as adresse_length
      FROM prospects
      WHERE LENGTH(adresse) > 500;
    `);

    if (longAddresses.length > 0) {
      console.log(`\n⚠️  ATTENTION: ${longAddresses.length} adresse(s) dépassent 500 caractères:`);
      longAddresses.slice(0, 5).forEach(p => {
        console.log(`   - ID ${p.id}: ${p.nom_entreprise} (${p.adresse_length} caractères)`);
      });
      if (longAddresses.length > 5) {
        console.log(`   ... et ${longAddresses.length - 5} autre(s)`);
      }
      console.log('\n💡 Ces adresses seront tronquées à 500 caractères.');
      console.log('   Pour annuler, arrêtez le script maintenant (Ctrl+C).\n');

      // Attendre 5 secondes pour laisser le temps d'annuler
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log('✅ Toutes les adresses font moins de 500 caractères\n');
    }

    // Modifier le type de colonne
    console.log('2️⃣ Modification du type de colonne...');
    await sequelize.query(`
      ALTER TABLE prospects
      MODIFY COLUMN adresse VARCHAR(500);
    `);
    console.log('✅ Type de colonne modifié avec succès\n');

    // Vérifier la modification
    console.log('3️⃣ Vérification...');
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'prospects' AND COLUMN_NAME = 'adresse'
      AND TABLE_SCHEMA = DATABASE();
    `);

    if (columns.length > 0) {
      const col = columns[0];
      console.log('✅ Vérification réussie:');
      console.log(`   Colonne: ${col.COLUMN_NAME}`);
      console.log(`   Type: ${col.DATA_TYPE}`);
      console.log(`   Longueur max: ${col.CHARACTER_MAXIMUM_LENGTH}`);
    }

    console.log('\n✅ Migration terminée avec succès !');
    console.log('\n💡 Le serveur peut maintenant créer l\'index unique.');
    console.log('   Redémarrez le serveur pour que l\'index soit créé automatiquement.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur durant la migration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrate();
