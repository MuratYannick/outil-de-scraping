import dotenv from "dotenv";
import { sequelize } from "../src/models/index.js";

dotenv.config();

(async () => {
  try {
    console.log("Authenticating DB connection...");
    await sequelize.authenticate();
    console.log("DB authenticated. Running sequelize.sync({ alter: true })");
    await sequelize.sync({ alter: true });
    console.log("Migrations applied (sequelize.sync completed)");
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("Error applying migrations:", err);
    process.exit(1);
  }
})();
