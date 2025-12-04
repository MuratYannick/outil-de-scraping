import dotenv from "dotenv";
import readline from "readline";
import { sequelize, Prospect, Tag, SourceScraping } from "../src/models/index.js";

dotenv.config();

// Créer une interface readline pour demander confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour poser une question et attendre la réponse
function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

(async () => {
  try {
    console.log("🗑️  Nettoyage de la base de données");
    console.log("⚠️  ATTENTION: Cette opération va VIDER toutes les tables !\n");

    // Authentifier la connexion
    console.log("📡 Connexion à la base de données...");
    await sequelize.authenticate();
    console.log("✓ Connecté à la base de données\n");

    // Compter les enregistrements avant suppression
    const prospectCount = await Prospect.count();
    const tagCount = await Tag.count();
    const sourceCount = await SourceScraping.count();

    console.log("📊 Données actuelles:");
    console.log(`   - ${prospectCount} prospect(s)`);
    console.log(`   - ${tagCount} tag(s)`);
    console.log(`   - ${sourceCount} source(s) de scraping`);
    console.log(`   - Associations dans prospects_tags`);
    console.log(`   - Associations dans prospects_sources\n`);

    // Demander confirmation
    const answer = await askQuestion("⚠️  Êtes-vous sûr de vouloir VIDER toutes les tables ? (oui/non): ");

    if (answer.toLowerCase() !== "oui" && answer.toLowerCase() !== "o") {
      console.log("\n❌ Opération annulée par l'utilisateur");
      rl.close();
      await sequelize.close();
      process.exit(0);
    }

    console.log("\n🧹 Vidage des tables en cours...\n");

    // Désactiver les contraintes de clés étrangères temporairement
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Vider les tables de liaison en premier
    console.log("🗑️  Vidage de prospects_tags...");
    await sequelize.query("DELETE FROM prospects_tags");
    console.log("✓ prospects_tags vidée");

    console.log("🗑️  Vidage de prospects_sources...");
    await sequelize.query("DELETE FROM prospects_sources");
    console.log("✓ prospects_sources vidée");

    // Vider la table prospects
    console.log("🗑️  Vidage de prospects...");
    await Prospect.destroy({ where: {}, truncate: false });
    console.log("✓ prospects vidée");

    // Vider la table tags
    console.log("🗑️  Vidage de tags...");
    await Tag.destroy({ where: {}, truncate: false });
    console.log("✓ tags vidée");

    // Vider la table sources_scraping
    console.log("🗑️  Vidage de sources_scraping...");
    await SourceScraping.destroy({ where: {}, truncate: false });
    console.log("✓ sources_scraping vidée");

    // Réactiver les contraintes de clés étrangères
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\n✅ Toutes les tables ont été vidées avec succès !");
    console.log("\n💡 Pour réinitialiser les auto-increment, utilisez:");
    console.log("   npm run db:drop && npm run db:migrate && npm run db:seed");

    rl.close();
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Erreur lors du nettoyage:", err);
    rl.close();
    process.exit(1);
  }
})();
