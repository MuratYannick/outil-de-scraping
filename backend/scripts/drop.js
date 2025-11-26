import dotenv from "dotenv";
import readline from "readline";
import { sequelize } from "../src/models/index.js";

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
    console.log("💥 Destruction des tables de la base de données");
    console.log("⚠️  ATTENTION: Cette opération va DÉTRUIRE toutes les tables !\n");
    console.log("Les tables suivantes seront supprimées:");
    console.log("   - prospects");
    console.log("   - tags");
    console.log("   - prospects_tags");
    console.log("\n⚠️  Toutes les données seront DÉFINITIVEMENT perdues !\n");

    // Authentifier la connexion
    console.log("📡 Connexion à la base de données...");
    await sequelize.authenticate();
    console.log("✓ Connecté à la base de données\n");

    // Première confirmation
    const answer1 = await askQuestion("⚠️  Êtes-vous sûr de vouloir DÉTRUIRE toutes les tables ? (oui/non): ");

    if (answer1.toLowerCase() !== "oui" && answer1.toLowerCase() !== "o") {
      console.log("\n❌ Opération annulée par l'utilisateur");
      rl.close();
      await sequelize.close();
      process.exit(0);
    }

    // Deuxième confirmation pour être vraiment sûr
    const answer2 = await askQuestion("⚠️  DERNIÈRE CONFIRMATION - Tapez 'DETRUIRE' en majuscules pour confirmer: ");

    if (answer2 !== "DETRUIRE") {
      console.log("\n❌ Opération annulée - Confirmation non reçue");
      rl.close();
      await sequelize.close();
      process.exit(0);
    }

    console.log("\n💥 Destruction des tables en cours...\n");

    // Désactiver les contraintes de clés étrangères
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Supprimer la table de liaison en premier
    console.log("💥 Suppression de prospects_tags...");
    await sequelize.query("DROP TABLE IF EXISTS prospects_tags");
    console.log("✓ prospects_tags détruite");

    // Supprimer la table prospects
    console.log("💥 Suppression de prospects...");
    await sequelize.query("DROP TABLE IF EXISTS prospects");
    console.log("✓ prospects détruite");

    // Supprimer la table tags
    console.log("💥 Suppression de tags...");
    await sequelize.query("DROP TABLE IF EXISTS tags");
    console.log("✓ tags détruite");

    // Réactiver les contraintes de clés étrangères
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\n✅ Toutes les tables ont été détruites avec succès !");
    console.log("\n💡 Pour recréer les tables, utilisez:");
    console.log("   npm run db:migrate");
    console.log("\n💡 Pour recréer et peupler les tables:");
    console.log("   npm run db:migrate && npm run db:seed");

    rl.close();
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Erreur lors de la destruction:", err);
    rl.close();
    process.exit(1);
  }
})();
