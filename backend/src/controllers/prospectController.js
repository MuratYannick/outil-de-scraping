import { Prospect, Tag, SourceScraping, sequelize } from "../models/index.js";
import { Op, QueryTypes } from "sequelize";
import { detectDuplicates, cleanAndMergeDuplicates, cleanSelectedDuplicates } from "../services/duplicateCleanerService.js";

/**
 * @route   GET /api/prospects
 * @desc    Récupérer tous les prospects avec pagination et filtres
 * @access  Public
 */
export const getAllProspects = async (req, res) => {
  try {
    const { limit = 20, offset = 0, source, tag, search, sortBy, sortOrder } = req.query;

    // Construire les conditions de filtrage
    const where = {};

    // Ajouter le filtre de recherche sur plusieurs champs
    if (search) {
      where[Op.or] = [
        { nom_entreprise: { [Op.like]: `%${search}%` } },
        { telephone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { adresse: { [Op.like]: `%${search}%` } },
        { ville: { [Op.like]: `%${search}%` } },
        { code_postal: { [Op.like]: `%${search}%` } },
      ];
    }

    // Si on filtre par tag ou source, on doit joindre les tables associées
    let includeForCount = [];
    if (tag) {
      includeForCount.push({
        model: Tag,
        as: "tags",
        where: { nom: tag },
        through: { attributes: [] },
        attributes: [],
      });
    }
    if (source) {
      includeForCount.push({
        model: SourceScraping,
        as: "sources",
        where: { nom: source },
        through: { attributes: [] },
        attributes: [],
      });
    }

    // Étape 1: Compter le total de prospects (distincts)
    const count = await Prospect.count({
      where,
      include: includeForCount,
      distinct: true,
      col: 'id',
    });

    // Étape 2: Récupérer les IDs avec pagination via une sous-requête
    // Cela évite le problème de GROUP BY + ORDER BY + LIMIT
    let idQuery;
    let replacements = { limit: parseInt(limit), offset: parseInt(offset) };

    // Construire les conditions WHERE pour la recherche
    const buildWhereConditions = () => {
      const conditions = [];
      if (search) {
        conditions.push(`(
          p.nom_entreprise LIKE :search OR
          p.telephone LIKE :search OR
          p.email LIKE :search OR
          p.adresse LIKE :search OR
          p.ville LIKE :search OR
          p.code_postal LIKE :search
        )`);
        replacements.search = `%${search}%`;
      }
      return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    };

    // Construire la clause ORDER BY
    const buildOrderByClause = () => {
      const allowedSortFields = {
        'nom_entreprise': 'p.nom_entreprise',
        'ville': 'p.ville',
        'code_postal': 'p.code_postal'
      };

      const allowedSortOrders = ['ASC', 'DESC'];

      if (sortBy && allowedSortFields[sortBy] && sortOrder && allowedSortOrders.includes(sortOrder.toUpperCase())) {
        return `ORDER BY ${allowedSortFields[sortBy]} ${sortOrder.toUpperCase()}, p.id ${sortOrder.toUpperCase()}`;
      }

      // Ordre par défaut : date d'ajout décroissante
      return 'ORDER BY p.date_ajout DESC, p.id DESC';
    };

    const orderByClause = buildOrderByClause();

    // Construire la requête selon les filtres actifs
    if (tag && source) {
      // Avec filtre par tag ET source
      idQuery = `
        SELECT DISTINCT p.id
        FROM prospects p
        INNER JOIN prospects_tags pt ON p.id = pt.prospect_id
        INNER JOIN tags t ON pt.tag_id = t.id
        INNER JOIN prospects_sources ps ON p.id = ps.prospect_id
        INNER JOIN sources_scraping ss ON ps.source_id = ss.id
        WHERE t.nom = :tagName AND ss.nom = :sourceName
        ${search ? `AND (
          p.nom_entreprise LIKE :search OR
          p.telephone LIKE :search OR
          p.email LIKE :search OR
          p.adresse LIKE :search OR
          p.ville LIKE :search OR
          p.code_postal LIKE :search
        )` : ''}
        ${orderByClause}
        LIMIT :limit OFFSET :offset
      `;
      replacements.tagName = tag;
      replacements.sourceName = source;
      if (search) replacements.search = `%${search}%`;
    } else if (tag) {
      // Avec filtre par tag uniquement
      idQuery = `
        SELECT DISTINCT p.id
        FROM prospects p
        INNER JOIN prospects_tags pt ON p.id = pt.prospect_id
        INNER JOIN tags t ON pt.tag_id = t.id
        WHERE t.nom = :tagName
        ${search ? `AND (
          p.nom_entreprise LIKE :search OR
          p.telephone LIKE :search OR
          p.email LIKE :search OR
          p.adresse LIKE :search OR
          p.ville LIKE :search OR
          p.code_postal LIKE :search
        )` : ''}
        ${orderByClause}
        LIMIT :limit OFFSET :offset
      `;
      replacements.tagName = tag;
      if (search) replacements.search = `%${search}%`;
    } else if (source) {
      // Avec filtre par source uniquement
      idQuery = `
        SELECT DISTINCT p.id
        FROM prospects p
        INNER JOIN prospects_sources ps ON p.id = ps.prospect_id
        INNER JOIN sources_scraping ss ON ps.source_id = ss.id
        WHERE ss.nom = :sourceName
        ${search ? `AND (
          p.nom_entreprise LIKE :search OR
          p.telephone LIKE :search OR
          p.email LIKE :search OR
          p.adresse LIKE :search OR
          p.ville LIKE :search OR
          p.code_postal LIKE :search
        )` : ''}
        ${orderByClause}
        LIMIT :limit OFFSET :offset
      `;
      replacements.sourceName = source;
      if (search) replacements.search = `%${search}%`;
    } else {
      // Sans filtre par tag ni source
      const whereClause = buildWhereConditions();
      idQuery = `
        SELECT id
        FROM prospects p
        ${whereClause}
        ${orderByClause}
        LIMIT :limit OFFSET :offset
      `;
      if (search) replacements.search = `%${search}%`;
    }

    const idRows = await sequelize.query(idQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });

    // Étape 3: Récupérer les prospects complets avec leurs tags
    const prospectIds = idRows.map(row => row.id);

    let prospects = [];
    if (prospectIds.length > 0) {
      const prospectsUnordered = await Prospect.findAll({
        where: {
          id: {
            [Op.in]: prospectIds,
          },
        },
        include: [
          {
            model: Tag,
            as: "tags",
            through: { attributes: [] },
          },
          {
            model: SourceScraping,
            as: "sources",
            through: {
              attributes: ['createdAt'], // Inclure la date d'association
            },
          },
        ],
      });

      // Préserver l'ordre de la sous-requête SQL
      // Créer un map pour accès rapide par ID
      const prospectMap = new Map(prospectsUnordered.map(p => [p.id, p]));

      // Réordonner selon l'ordre des IDs de la sous-requête
      prospects = prospectIds.map(id => prospectMap.get(id)).filter(Boolean);
    }

    res.json({
      data: prospects,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching prospects:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/prospects/:id
 * @desc    Récupérer un prospect par ID
 * @access  Public
 */
export const getProspectById = async (req, res) => {
  try {
    const { id } = req.params;

    const prospect = await Prospect.findByPk(id, {
      include: [
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
        },
        {
          model: SourceScraping,
          as: "sources",
          through: {
            attributes: ['createdAt'],
          },
        },
      ],
    });

    if (!prospect) {
      return res.status(404).json({
        error: "Not Found",
        message: `Prospect with id ${id} not found`,
      });
    }

    res.json(prospect);
  } catch (error) {
    console.error("Error fetching prospect:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/prospects
 * @desc    Créer un nouveau prospect
 * @access  Public
 */
export const createProspect = async (req, res) => {
  try {
    const {
      nom_entreprise,
      nom_contact,
      email,
      telephone,
      adresse,
      url_site,
      source_scraping,
      tags,
    } = req.body;

    // Validation
    if (!nom_entreprise) {
      return res.status(400).json({
        error: "Bad Request",
        message: "nom_entreprise is required",
      });
    }

    // Créer le prospect
    const prospect = await Prospect.create({
      nom_entreprise,
      nom_contact,
      email,
      telephone,
      adresse,
      url_site,
      source_scraping: source_scraping || "Manual",
    });

    // Associer les tags si fournis
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagInstances = await Tag.findAll({
        where: {
          id: {
            [Op.in]: tags,
          },
        },
      });
      await prospect.setTags(tagInstances);
    }

    // Récupérer le prospect avec ses tags
    const prospectWithTags = await Prospect.findByPk(prospect.id, {
      include: [
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
        },
      ],
    });

    res.status(201).json(prospectWithTags);
  } catch (error) {
    console.error("Error creating prospect:", error);

    // Gestion des erreurs de validation Sequelize
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation Error",
        message: error.errors.map((e) => e.message).join(", "),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Conflict",
        message: "A prospect with this email or URL already exists",
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/prospects/:id
 * @desc    Mettre à jour un prospect
 * @access  Public
 */
export const updateProspect = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom_entreprise,
      nom_contact,
      email,
      telephone,
      adresse,
      url_site,
      source_scraping,
      tags,
    } = req.body;

    // Vérifier si le prospect existe
    const prospect = await Prospect.findByPk(id);

    if (!prospect) {
      return res.status(404).json({
        error: "Not Found",
        message: `Prospect with id ${id} not found`,
      });
    }

    // Mettre à jour les champs
    await prospect.update({
      ...(nom_entreprise && { nom_entreprise }),
      ...(nom_contact !== undefined && { nom_contact }),
      ...(email !== undefined && { email }),
      ...(telephone !== undefined && { telephone }),
      ...(adresse !== undefined && { adresse }),
      ...(url_site !== undefined && { url_site }),
      ...(source_scraping && { source_scraping }),
      date_modification: new Date(),
    });

    // Mettre à jour les tags si fournis
    if (tags && Array.isArray(tags)) {
      const tagInstances = await Tag.findAll({
        where: {
          id: {
            [Op.in]: tags,
          },
        },
      });
      await prospect.setTags(tagInstances);
    }

    // Récupérer le prospect mis à jour avec ses tags
    const updatedProspect = await Prospect.findByPk(id, {
      include: [
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
        },
      ],
    });

    res.json(updatedProspect);
  } catch (error) {
    console.error("Error updating prospect:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation Error",
        message: error.errors.map((e) => e.message).join(", "),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Conflict",
        message: "A prospect with this email or URL already exists",
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   DELETE /api/prospects/:id
 * @desc    Supprimer un prospect
 * @access  Public
 */
export const deleteProspect = async (req, res) => {
  try {
    const { id } = req.params;

    const prospect = await Prospect.findByPk(id);

    if (!prospect) {
      return res.status(404).json({
        error: "Not Found",
        message: `Prospect with id ${id} not found`,
      });
    }

    await prospect.destroy();

    res.json({
      message: "Prospect deleted successfully",
      id: parseInt(id),
    });
  } catch (error) {
    console.error("Error deleting prospect:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/prospects/:id/tags
 * @desc    Associer un tag à un prospect
 * @access  Public
 */
export const addTagToProspect = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;

    if (!tag_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "tag_id is required",
      });
    }

    const prospect = await Prospect.findByPk(id);
    if (!prospect) {
      return res.status(404).json({
        error: "Not Found",
        message: `Prospect with id ${id} not found`,
      });
    }

    const tag = await Tag.findByPk(tag_id);
    if (!tag) {
      return res.status(404).json({
        error: "Not Found",
        message: `Tag with id ${tag_id} not found`,
      });
    }

    await prospect.addTag(tag);

    const updatedProspect = await Prospect.findByPk(id, {
      include: [
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
        },
      ],
    });

    res.json(updatedProspect);
  } catch (error) {
    console.error("Error adding tag to prospect:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   DELETE /api/prospects/:id/tags/:tag_id
 * @desc    Retirer un tag d'un prospect
 * @access  Public
 */
export const removeTagFromProspect = async (req, res) => {
  try {
    const { id, tag_id } = req.params;

    const prospect = await Prospect.findByPk(id);
    if (!prospect) {
      return res.status(404).json({
        error: "Not Found",
        message: `Prospect with id ${id} not found`,
      });
    }

    const tag = await Tag.findByPk(tag_id);
    if (!tag) {
      return res.status(404).json({
        error: "Not Found",
        message: `Tag with id ${tag_id} not found`,
      });
    }

    await prospect.removeTag(tag);

    const updatedProspect = await Prospect.findByPk(id, {
      include: [
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
        },
      ],
    });

    res.json(updatedProspect);
  } catch (error) {
    console.error("Error removing tag from prospect:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/prospects/duplicates/detect
 * @desc    Détecter les doublons dans la base de données
 * @access  Public
 */
export const detectProspectDuplicates = async (req, res) => {
  try {
    const duplicatePairs = await detectDuplicates();

    // Formater les résultats pour l'API
    const formattedPairs = duplicatePairs.map(pair => ({
      prospect1: {
        id: pair.p1.id,
        nom_entreprise: pair.p1.nom_entreprise,
        adresse: pair.p1.adresse,
        ville: pair.p1.ville,
        code_postal: pair.p1.code_postal,
        telephone: pair.p1.telephone,
        tags: pair.p1.tags.map(t => t.nom),
        sources: pair.p1.sources.map(s => s.nom)
      },
      prospect2: {
        id: pair.p2.id,
        nom_entreprise: pair.p2.nom_entreprise,
        adresse: pair.p2.adresse,
        ville: pair.p2.ville,
        code_postal: pair.p2.code_postal,
        telephone: pair.p2.telephone,
        tags: pair.p2.tags.map(t => t.nom),
        sources: pair.p2.sources.map(s => s.nom)
      },
      reason: pair.reason,
      similarity: pair.similarity
    }));

    res.json({
      success: true,
      duplicatesFound: duplicatePairs.length,
      duplicates: formattedPairs
    });
  } catch (error) {
    console.error("Error detecting duplicates:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/prospects/duplicates/clean
 * @desc    Nettoyer et fusionner les doublons détectés
 * @access  Public
 */
export const cleanProspectDuplicates = async (req, res) => {
  try {
    const result = await cleanAndMergeDuplicates();

    res.json(result);
  } catch (error) {
    console.error("Error cleaning duplicates:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/prospects/duplicates/clean-selected
 * @desc    Nettoyer et fusionner une sélection de doublons
 * @access  Public
 */
export const cleanSelectedProspectDuplicates = async (req, res) => {
  try {
    const { pairs } = req.body;

    if (!pairs || !Array.isArray(pairs)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "pairs array is required",
      });
    }

    const result = await cleanSelectedDuplicates(pairs);
    res.json(result);
  } catch (error) {
    console.error("Error cleaning selected duplicates:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   DELETE /api/prospects/bulk
 * @desc    Supprimer en masse les prospects selon les filtres
 * @access  Public
 */
export const bulkDeleteProspects = async (req, res) => {
  try {
    const { source, tag, search } = req.query;

    // Construire les conditions de filtrage
    const where = {};

    // Ajouter le filtre de recherche sur plusieurs champs
    if (search) {
      where[Op.or] = [
        { nom_entreprise: { [Op.like]: `%${search}%` } },
        { telephone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { adresse: { [Op.like]: `%${search}%` } },
        { ville: { [Op.like]: `%${search}%` } },
        { code_postal: { [Op.like]: `%${search}%` } },
      ];
    }

    // Si on filtre par tag ou source, on doit joindre les tables associées
    let include = [];
    if (tag) {
      include.push({
        model: Tag,
        as: "tags",
        where: { nom: tag },
        through: { attributes: [] },
        attributes: [],
      });
    }
    if (source) {
      include.push({
        model: SourceScraping,
        as: "sources",
        where: { nom: source },
        through: { attributes: [] },
        attributes: [],
      });
    }

    // Trouver les IDs des prospects à supprimer
    const prospectsToDelete = await Prospect.findAll({
      where,
      include,
      attributes: ['id'],
      group: ['Prospect.id'],
    });

    const prospectIds = prospectsToDelete.map(p => p.id);

    if (prospectIds.length === 0) {
      return res.json({
        success: true,
        deletedCount: 0,
        message: "Aucun prospect à supprimer avec les filtres spécifiés",
      });
    }

    // Supprimer les prospects
    const deletedCount = await Prospect.destroy({
      where: {
        id: {
          [Op.in]: prospectIds
        }
      }
    });

    res.json({
      success: true,
      deletedCount,
      message: `${deletedCount} prospect(s) supprimé(s) avec succès`,
    });
  } catch (error) {
    console.error("Error bulk deleting prospects:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};
