import mysql from "mysql2/promise";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function dropAllTables() {
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "outil_scraping_db";

  console.log("\n⚠️  ATTENTION : Suppression de toutes les tables ⚠️");
  console.log(`Base de données : ${database}`);
  console.log(`Serveur : ${user}@${host}:${port}\n`);

  const answer = await question(
    "Êtes-vous sûr de vouloir supprimer TOUTES les tables ? (oui/non) : "
  );

  if (answer.toLowerCase() !== "oui") {
    console.log("❌ Opération annulée");
    rl.close();
    process.exit(0);
  }

  let connection;
  try {
    console.log("\n🔌 Connexion à MySQL...");
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
    });

    console.log("✓ Connecté à la base de données");

    // Désactiver les vérifications de clés étrangères
    console.log("\n🔓 Désactivation des contraintes de clés étrangères...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");

    // Récupérer toutes les tables
    console.log("📋 Récupération de la liste des tables...");
    const [tables] = await connection.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
    `, [database]);

    if (tables.length === 0) {
      console.log("ℹ️  Aucune table à supprimer");
    } else {
      console.log(`\n🗑️  Suppression de ${tables.length} table(s)...`);

      for (const table of tables) {
        const tableName = table.TABLE_NAME;
        console.log(`  - Suppression de la table '${tableName}'...`);
        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      }

      console.log("✓ Toutes les tables ont été supprimées");
    }

    // Réactiver les vérifications de clés étrangères
    console.log("\n🔒 Réactivation des contraintes de clés étrangères...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");

    console.log("\n✅ Opération terminée avec succès !");
    console.log("\n💡 Pour recréer les tables, exécutez :");
    console.log("   npm run db:setup");

  } catch (error) {
    console.error("\n❌ Erreur lors de la suppression des tables :", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    rl.close();
  }
}

dropAllTables();
