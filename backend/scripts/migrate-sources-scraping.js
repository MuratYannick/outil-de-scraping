/**
 * Script de migration : Transformation du système de source unique vers sources multiples
 *
 * Ce script effectue les opérations suivantes :
 * 1. Crée la table sources_scraping
 * 2. Crée la table de liaison prospects_sources
 * 3. Insère les sources par défaut (Pages Jaunes, Google Maps, LinkedIn, Manual)
 * 4. Migre les données existantes de la colonne source_scraping vers la table de liaison
 * 5. Supprime la colonne source_scraping de la table prospects
 *
 * Usage: node scripts/migrate-sources-scraping.js
 */

import { Prospect, SourceScraping, sequelize } from '../src/models/index.js';
import { QueryTypes } from 'sequelize';

// Couleurs par défaut pour les sources
const DEFAULT_SOURCES = [
  { nom: 'Pages Jaunes', description: 'Annuaire professionnel français', couleur: '#FFD700', actif: true },
  { nom: 'Google Maps', description: 'Service de cartographie Google', couleur: '#4285F4', actif: true },
  { nom: 'LinkedIn', description: 'Réseau social professionnel', couleur: '#0077B5', actif: true },
  { nom: 'Manual', description: 'Saisie manuelle', couleur: '#6B7280', actif: true },
];

async function migrateSourcesScraping() {
  console.log('🔄 Début de la migration sources_scraping...\n');

  try {
    // Étape 1 : Créer la table sources_scraping
    console.log('📋 Étape 1/6 : Création de la table sources_scraping...');
    await sequelize.queryInterface.createTable('sources_scraping', {
      id: {
        type: 'INTEGER',
        primaryKey: true,
        autoIncrement: true,
      },
      nom: {
        type: 'VARCHAR(100)',
        allowNull: false,
        unique: true,
      },
      description: {
        type: 'TEXT',
        allowNull: true,
      },
      couleur: {
        type: 'VARCHAR(7)',
        allowNull: true,
        defaultValue: '#3B82F6',
      },
      actif: {
        type: 'BOOLEAN',
        allowNull: false,
        defaultValue: true,
      },
      date_creation: {
        type: 'DATETIME',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
    console.log('✅ Table sources_scraping créée\n');

    // Étape 2 : Créer la table de liaison prospects_sources
    console.log('📋 Étape 2/6 : Création de la table de liaison prospects_sources...');

    // Utiliser une requête SQL directe pour créer la table avec clé primaire composite
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS prospects_sources (
        prospect_id INT NOT NULL,
        source_id INT NOT NULL,
        date_association DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (prospect_id, source_id),
        FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (source_id) REFERENCES sources_scraping(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table prospects_sources créée\n');

    // Étape 3 : Insérer les sources par défaut
    console.log('📋 Étape 3/6 : Insertion des sources par défaut...');
    for (const source of DEFAULT_SOURCES) {
      await SourceScraping.create(source);
      console.log(`   ✓ Source "${source.nom}" créée`);
    }
    console.log('✅ Sources par défaut créées\n');

    // Étape 4 : Migrer les données existantes
    console.log('📋 Étape 4/6 : Migration des données existantes...');

    // Vérifier si la colonne source_scraping existe
    const [columns] = await sequelize.query(`
      SHOW COLUMNS FROM prospects LIKE 'source_scraping'
    `, { type: QueryTypes.SELECT });

    if (!columns) {
      console.log('⚠️  La colonne source_scraping n\'existe pas, migration des données ignorée\n');
    } else {
      // Récupérer tous les prospects avec leur source actuelle
      const prospects = await sequelize.query(`
        SELECT id, source_scraping FROM prospects WHERE source_scraping IS NOT NULL
      `, { type: QueryTypes.SELECT });

      console.log(`   📊 ${prospects.length} prospects à migrer`);

      let migratedCount = 0;
      let errors = 0;

      for (const prospect of prospects) {
        try {
          // Trouver l'ID de la source correspondante
          const source = await SourceScraping.findOne({
            where: { nom: prospect.source_scraping }
          });

          if (source) {
            // Créer l'association dans prospects_sources
            await sequelize.query(`
              INSERT INTO prospects_sources (prospect_id, source_id, date_association)
              VALUES (:prospectId, :sourceId, NOW())
              ON DUPLICATE KEY UPDATE date_association = date_association
            `, {
              replacements: {
                prospectId: prospect.id,
                sourceId: source.id,
              },
              type: QueryTypes.INSERT,
            });
            migratedCount++;
          } else {
            // Si la source n'existe pas, créer une source "Autre" ou utiliser "Manual"
            console.log(`   ⚠️  Source inconnue "${prospect.source_scraping}" pour prospect #${prospect.id}`);
            const manualSource = await SourceScraping.findOne({ where: { nom: 'Manual' } });
            if (manualSource) {
              await sequelize.query(`
                INSERT INTO prospects_sources (prospect_id, source_id, date_association)
                VALUES (:prospectId, :sourceId, NOW())
                ON DUPLICATE KEY UPDATE date_association = date_association
              `, {
                replacements: {
                  prospectId: prospect.id,
                  sourceId: manualSource.id,
                },
                type: QueryTypes.INSERT,
              });
              migratedCount++;
            }
          }
        } catch (error) {
          console.error(`   ❌ Erreur migration prospect #${prospect.id}:`, error.message);
          errors++;
        }
      }

      console.log(`✅ Migration terminée : ${migratedCount} prospects migrés, ${errors} erreurs\n`);
    }

    // Étape 5 : Supprimer la colonne source_scraping
    console.log('📋 Étape 5/6 : Suppression de la colonne source_scraping...');

    if (columns) {
      await sequelize.queryInterface.removeColumn('prospects', 'source_scraping');
      console.log('✅ Colonne source_scraping supprimée\n');
    } else {
      console.log('⚠️  Colonne source_scraping déjà supprimée\n');
    }

    // Étape 6 : Statistiques finales
    console.log('📋 Étape 6/6 : Statistiques finales...');
    const sourcesCount = await SourceScraping.count();
    const prospectsCount = await Prospect.count();
    const associationsCount = await sequelize.query(`
      SELECT COUNT(*) as count FROM prospects_sources
    `, { type: QueryTypes.SELECT });

    console.log(`   📊 ${sourcesCount} sources créées`);
    console.log(`   📊 ${prospectsCount} prospects en base`);
    console.log(`   📊 ${associationsCount[0].count} associations créées`);

    console.log('\n✅ Migration terminée avec succès ! 🎉');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    console.error(error);
    throw error;
  }
}

// Exécution du script
migrateSourcesScraping()
  .then(() => {
    console.log('\n👋 Fermeture de la connexion...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration échouée:', error.message);
    process.exit(1);
  });
