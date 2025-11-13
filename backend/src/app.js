import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { sequelize, Prospect, Tag } from './models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================================================
// Routes de base
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'Outil de Scraping API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================================
// Routes Prospects (temporaire)
// ============================================================================

// GET /api/prospects - Récupérer tous les prospects
app.get('/api/prospects', async (req, res) => {
  try {
    const { limit = 20, offset = 0, source } = req.query;
    
    const where = source ? { source_scraping: source } : {};
    
    const prospects = await Prospect.findAndCountAll({
      where,
      include: [{
        model: Tag,
        as: 'tags',
        through: { attributes: [] },
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date_ajout', 'DESC']],
    });

    res.json({
      data: prospects.rows,
      total: prospects.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/prospects - Créer un prospect
app.post('/api/prospects', async (req, res) => {
  try {
    const {
      nom_entreprise,
      nom_contact,
      email,
      telephone,
      adresse,
      url_site,
      source_scraping,
    } = req.body;

    if (!nom_entreprise) {
      return res.status(400).json({ error: 'nom_entreprise is required' });
    }

    const prospect = await Prospect.create({
      nom_entreprise,
      nom_contact,
      email,
      telephone,
      adresse,
      url_site,
      source_scraping: source_scraping || 'Manual',
    });

    res.status(201).json(prospect);
  } catch (error) {
    console.error('Error creating prospect:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ============================================================================
// Routes Tags (temporaire)
// ============================================================================

// GET /api/tags - Récupérer tous les tags
app.get('/api/tags', async (req, res) => {
  try {
    const tags = await Tag.findAll({
      order: [['nom', 'ASC']],
    });

    res.json({ data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/tags - Créer un tag
app.post('/api/tags', async (req, res) => {
  try {
    const { nom } = req.body;

    if (!nom) {
      return res.status(400).json({ error: 'nom is required' });
    }

    const tag = await Tag.create({ nom });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ============================================================================
// Initialisation et démarrage
// ============================================================================

const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    await sequelize.authenticate();
    console.log('✓ Database connection successful');

    // Synchroniser les modèles (créer les tables si elles n'existent pas)
    await sequelize.sync({ alter: false });
    console.log('✓ Database models synced');

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
