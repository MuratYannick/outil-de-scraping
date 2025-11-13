import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { sequelize } from "./models/index.js";
import prospectRoutes from "./routes/prospectRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";

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
    },
  });
});

// ============================================================================
// API Routes
// ============================================================================
app.use("/api/prospects", prospectRoutes);
app.use("/api/tags", tagRoutes);

// ============================================================================
// Error handling middleware
// ============================================================================
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

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
