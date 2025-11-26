/**
 * Script de nettoyage des doublons dans la table prospects
 * Identifie et supprime les prospects ayant le même nom_entreprise ET la même adresse
 *
 * Stratégie: Garde le prospect le plus récent (date_ajout la plus récente)
 *
 * À exécuter avec: node scripts/clean-duplicates.js
 */

import readline from 'readline';
import { sequelize } from '../src/models/index.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function cleanDuplicates() {
  console.log('🧹 Nettoyage des doublons dans la table prospects\n');
  console.log('═'.repeat(80));

  try {
    // 1. Trouver tous les doublons
    console.log('\n1️⃣ Recherche des doublons...\n');

    const [duplicates] = await sequelize.query(`
      SELECT nom_entreprise, adresse, COUNT(*) as count
      FROM prospects
      WHERE nom_entreprise IS NOT NULL AND adresse IS NOT NULL
      GROUP BY nom_entreprise, adresse
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `);

    if (duplicates.length === 0) {
      console.log('✅ Aucun doublon détecté !');
      console.log('   La base de données est propre.\n');
      rl.close();
      process.exit(0);
    }

    console.log(`⚠️  ${duplicates.length} doublons détectés\n`);

    // Calculer le nombre total de prospects à supprimer
    let totalToDelete = 0;
    duplicates.forEach(dup => {
      totalToDelete += (dup.count - 1); // On garde 1, on supprime les autres
    });

    console.log(`📊 Statistiques:`);
    console.log(`   Groupes de doublons: ${duplicates.length}`);
    console.log(`   Total prospects à supprimer: ${totalToDelete}`);
    console.log(`   Total prospects à conserver: ${duplicates.length}\n`);

    // Afficher les 10 premiers doublons
    console.log('📋 Exemples de doublons (10 premiers):');
    console.log('─'.repeat(80));
    duplicates.slice(0, 10).forEach((dup, index) => {
      console.log(`${index + 1}. "${dup.nom_entreprise}" à "${dup.adresse}"`);
      console.log(`   Nombre d'occurrences: ${dup.count}`);
    });

    if (duplicates.length > 10) {
      console.log(`   ... et ${duplicates.length - 10} autres doublons`);
    }
    console.log('─'.repeat(80));

    // 2. Demander confirmation
    console.log('\n⚠️  ATTENTION: Cette opération va supprimer des données de la base !');
    console.log('💡 Stratégie: Pour chaque doublon, garde le prospect le plus récent\n');

    const answer = await askQuestion('Voulez-vous continuer ? (oui/non): ');

    if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'o') {
      console.log('\n❌ Opération annulée');
      rl.close();
      process.exit(0);
    }

    // 3. Supprimer les doublons
    console.log('\n2️⃣ Suppression des doublons...\n');

    let deletedCount = 0;

    for (const dup of duplicates) {
      // Récupérer tous les prospects avec ce nom et cette adresse
      const [prospects] = await sequelize.query(`
        SELECT id, nom_entreprise, adresse, date_ajout
        FROM prospects
        WHERE nom_entreprise = ? AND adresse = ?
        ORDER BY date_ajout DESC;
      `, {
        replacements: [dup.nom_entreprise, dup.adresse]
      });

      // Garder le premier (le plus récent), supprimer les autres
      const toKeep = prospects[0];
      const toDelete = prospects.slice(1);

      if (toDelete.length > 0) {
        const idsToDelete = toDelete.map(p => p.id);

        await sequelize.query(`
          DELETE FROM prospects
          WHERE id IN (${idsToDelete.join(',')});
        `);

        deletedCount += toDelete.length;

        console.log(`✓ "${dup.nom_entreprise}" à "${dup.adresse}"`);
        console.log(`  Gardé: ID ${toKeep.id} (ajouté le ${new Date(toKeep.date_ajout).toLocaleDateString('fr-FR')})`);
        console.log(`  Supprimé: ${toDelete.length} doublon(s)`);
      }
    }

    // 4. Résumé final
    console.log('\n' + '═'.repeat(80));
    console.log('📊 RÉSUMÉ:');
    console.log('─'.repeat(80));
    console.log(`   Doublons traités: ${duplicates.length}`);
    console.log(`   Prospects supprimés: ${deletedCount}`);
    console.log(`   Prospects conservés: ${duplicates.length}`);
    console.log('═'.repeat(80));

    console.log('\n✅ Nettoyage terminé avec succès !');
    console.log('\n💡 Vous pouvez maintenant créer l\'index unique :');
    console.log('   node scripts/migrate-add-unique-index.js\n');

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur durant le nettoyage:', error.message);
    console.error(error.stack);
    rl.close();
    process.exit(1);
  }
}

cleanDuplicates();
