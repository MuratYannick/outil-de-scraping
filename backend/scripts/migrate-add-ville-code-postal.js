/**
 * Script de migration pour ajouter les colonnes ville et code_postal
 * À exécuter avec: node scripts/migrate-add-ville-code-postal.js
 */

import { sequelize } from '../src/models/index.js';

async function migrate() {
  console.log('🔄 Migration : Ajout des colonnes ville et code_postal\n');

  try {
    // Synchroniser le modèle avec la base (alter: true ajoute les colonnes manquantes)
    console.log('1️⃣ Synchronisation du modèle Prospect...');
    await sequelize.sync({ alter: true });
    console.log('✅ Synchronisation terminée\n');

    // Vérifier que les colonnes ont été ajoutées
    console.log('2️⃣ Vérification des colonnes...');
    const [results] = await sequelize.query(`
      DESCRIBE prospects;
    `);

    const villeColumn = results.find(col => col.Field === 'ville');
    const codePostalColumn = results.find(col => col.Field === 'code_postal');

    if (villeColumn && codePostalColumn) {
      console.log('✅ Colonne "ville" : AJOUTÉE');
      console.log(`   Type: ${villeColumn.Type}, Null: ${villeColumn.Null}`);
      console.log('✅ Colonne "code_postal" : AJOUTÉE');
      console.log(`   Type: ${codePostalColumn.Type}, Null: ${codePostalColumn.Null}`);
    } else {
      if (!villeColumn) console.log('❌ Colonne "ville" : NON TROUVÉE');
      if (!codePostalColumn) console.log('❌ Colonne "code_postal" : NON TROUVÉE');
      throw new Error('Les colonnes n\'ont pas été ajoutées correctement');
    }

    console.log('\n✅ Migration terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur durant la migration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrate();
