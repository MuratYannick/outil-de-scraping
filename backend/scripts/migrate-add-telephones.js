/**
 * Script de migration : Ajouter telephone_2 et telephone_3 à la table prospects
 *
 * Ce script ajoute deux colonnes supplémentaires pour stocker jusqu'à 3 numéros de téléphone
 * par prospect.
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le .env depuis le dossier backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Créer une nouvelle instance Sequelize avec les variables d'environnement
const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'mysql',
  logging: false,
});

async function migrate() {
  try {
    console.log('🔄 Démarrage de la migration : ajout de telephone_2 et telephone_3...\n');

    // Vérifier la connexion
    await sequelize.authenticate();
    console.log('✓ Connexion à la base de données établie\n');

    // Vérifier quelles colonnes existent déjà
    const [existingColumns] = await sequelize.query(`
      SHOW COLUMNS FROM prospects WHERE Field IN ('telephone_2', 'telephone_3');
    `);

    const existingColumnNames = existingColumns.map(col => col.Field);
    console.log('📋 Colonnes existantes:', existingColumnNames.length > 0 ? existingColumnNames.join(', ') : 'aucune');

    // Ajouter telephone_2 si elle n'existe pas
    if (!existingColumnNames.includes('telephone_2')) {
      await sequelize.query(`
        ALTER TABLE prospects
        ADD COLUMN telephone_2 VARCHAR(20) DEFAULT NULL;
      `);
      console.log('✓ Colonne telephone_2 ajoutée');
    } else {
      console.log('ℹ Colonne telephone_2 existe déjà');
    }

    // Ajouter telephone_3 si elle n'existe pas
    if (!existingColumnNames.includes('telephone_3')) {
      await sequelize.query(`
        ALTER TABLE prospects
        ADD COLUMN telephone_3 VARCHAR(20) DEFAULT NULL;
      `);
      console.log('✓ Colonne telephone_3 ajoutée');
    } else {
      console.log('ℹ Colonne telephone_3 existe déjà');
    }

    console.log('');

    // Vérifier que les colonnes ont été ajoutées
    const [results] = await sequelize.query(`
      SHOW COLUMNS FROM prospects WHERE Field IN ('telephone', 'telephone_2', 'telephone_3');
    `);

    console.log('📋 Colonnes téléphone dans la table prospects:');
    results.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    console.log('\n✅ Migration terminée avec succès!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrate();
