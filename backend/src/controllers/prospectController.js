import { Prospect, Tag } from "../models/index.js";
import { Op } from "sequelize";

/**
 * @route   GET /api/prospects
 * @desc    Récupérer tous les prospects avec pagination et filtres
 * @access  Public
 */
export const getAllProspects = async (req, res) => {
  try {
    const { limit = 20, offset = 0, source, tag } = req.query;

    // Construire les conditions de filtrage
    const where = {};
    if (source) {
      where.source_scraping = source;
    }

    // Configuration de la requête
    const queryOptions = {
      where,
      include: [
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
          ...(tag && {
            where: { nom: tag },
          }),
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["date_ajout", "DESC"]],
      distinct: true,
    };

    const prospects = await Prospect.findAndCountAll(queryOptions);

    res.json({
      data: prospects.rows,
      total: prospects.count,
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
