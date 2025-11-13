import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQL_PATH = path.resolve(__dirname, "init-db.sql");

async function runSqlFile(connection, filePath) {
  const sql = await fs.readFile(filePath, { encoding: "utf8" });
  // MySQL driver supports multiple statements if enabled on connection
  await connection.query(sql);
}

async function main() {
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "outil_scraping";

  console.log(
    `Connecting to MySQL ${user}@${host}:${port} (database: ${database})`
  );

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    // Ensure database exists
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`Database ensured: ${database}`);

    // Use the database
    await connection.changeUser({ database });

    // Run SQL file (creates tables)
    console.log(`Executing SQL file: ${SQL_PATH}`);
    await runSqlFile(connection, SQL_PATH);
    console.log("SQL initialization script executed successfully");

    await connection.end();

    // Run Sequelize sync to apply model changes (if any)
    console.log("Running Sequelize sync to apply model definitions (if any)");
    const { default: sequelize } = await import("../src/config/database.js");
    await sequelize.sync({ alter: true });
    console.log("Sequelize sync completed");

    // Close sequelize
    await sequelize.close();

    console.log("Database setup finished");
  } catch (err) {
    console.error("Error during DB setup:", err);
    if (connection && connection.end) await connection.end();
    process.exit(1);
  }
}

main();
