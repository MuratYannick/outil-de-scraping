import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { sequelize } from "./models/index.js";
import prospectRoutes from "./routes/prospectRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import antiBotConfigRoutes from "./routes/antiBotConfigRoutes.js";
import scrapingRoutes from "./routes/scrapingRoutes.js";
import googleMapsConfigRoutes from "./routes/googleMapsConfigRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// Middlewares
// ============================================================================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Routes de base
// ============================================================================

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// API Info
app.get("/api", (req, res) => {
  res.json({
    name: "Outil de Scraping API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      prospects: "/api/prospects",
      tags: "/api/tags",
      antiBotConfig: "/api/antibot",
      scraping: "/api/scraping",
    },
  });
});

// ============================================================================
// API Routes
// ============================================================================
app.use("/api/prospects", prospectRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/antibot", antiBotConfigRoutes);
app.use("/api/scraping", scrapingRoutes);
app.use("/api/google-maps", googleMapsConfigRoutes);

// ============================================================================
// Error handling middleware
// ============================================================================

// 404 - Route non trouvée (doit être après toutes les routes)
app.use(notFoundHandler);

// Gestionnaire d'erreur global (doit être en dernier)
app.use(errorHandler);

// ============================================================================
// Initialisation et démarrage
// ============================================================================

const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log("✓ Database connection successful");

    // Synchroniser les modèles (créer les tables si elles n'existent pas)
    await sequelize.sync({ alter: false });
    console.log("✓ Database models synced");

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`  Health check: http://localhost:${PORT}/health`);
      console.log(`  API info: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
