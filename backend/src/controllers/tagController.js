import { Tag, Prospect } from "../models/index.js";

/**
 * @route   GET /api/tags
 * @desc    Récupérer tous les tags
 * @access  Public
 */
export const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      order: [["nom", "ASC"]],
    });

    res.json({
      data: tags,
      total: tags.length,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/tags/:id
 * @desc    Récupérer un tag par ID avec ses prospects
 * @access  Public
 */
export const getTagById = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findByPk(id, {
      include: [
        {
          model: Prospect,
          as: "prospects",
          through: { attributes: [] },
        },
      ],
    });

    if (!tag) {
      return res.status(404).json({
        error: "Not Found",
        message: `Tag with id ${id} not found`,
      });
    }

    res.json(tag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/tags
 * @desc    Créer un nouveau tag
 * @access  Public
 */
export const createTag = async (req, res) => {
  try {
    const { nom } = req.body;

    // Validation
    if (!nom) {
      return res.status(400).json({
        error: "Bad Request",
        message: "nom is required",
      });
    }

    // Vérifier si le tag existe déjà
    const existingTag = await Tag.findOne({ where: { nom } });
    if (existingTag) {
      return res.status(409).json({
        error: "Conflict",
        message: `Tag "${nom}" already exists`,
      });
    }

    const tag = await Tag.create({ nom });

    res.status(201).json(tag);
  } catch (error) {
    console.error("Error creating tag:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation Error",
        message: error.errors.map((e) => e.message).join(", "),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Conflict",
        message: "A tag with this name already exists",
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/tags/:id
 * @desc    Mettre à jour un tag
 * @access  Public
 */
export const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;

    // Validation
    if (!nom) {
      return res.status(400).json({
        error: "Bad Request",
        message: "nom is required",
      });
    }

    const tag = await Tag.findByPk(id);

    if (!tag) {
      return res.status(404).json({
        error: "Not Found",
        message: `Tag with id ${id} not found`,
      });
    }

    await tag.update({ nom });

    res.json(tag);
  } catch (error) {
    console.error("Error updating tag:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation Error",
        message: error.errors.map((e) => e.message).join(", "),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Conflict",
        message: "A tag with this name already exists",
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * @route   DELETE /api/tags/:id
 * @desc    Supprimer un tag
 * @access  Public
 */
export const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findByPk(id);

    if (!tag) {
      return res.status(404).json({
        error: "Not Found",
        message: `Tag with id ${id} not found`,
      });
    }

    await tag.destroy();

    res.json({
      message: "Tag deleted successfully",
      id: parseInt(id),
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};
