import express from "express";
import {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} from "../controllers/tagController.js";
import validate from "../middlewares/validate.js";
import {
  createTagSchema,
  updateTagSchema,
  getTagByIdSchema,
  deleteTagSchema,
} from "../validators/tagValidators.js";

const router = express.Router();

/**
 * @route   GET /api/tags
 * @desc    Récupérer tous les tags
 */
router.get("/", getAllTags);

/**
 * @route   GET /api/tags/:id
 * @desc    Récupérer un tag par ID avec ses prospects
 */
router.get("/:id", validate(getTagByIdSchema), getTagById);

/**
 * @route   POST /api/tags
 * @desc    Créer un nouveau tag
 */
router.post("/", validate(createTagSchema), createTag);

/**
 * @route   PUT /api/tags/:id
 * @desc    Mettre à jour un tag
 */
router.put("/:id", validate(updateTagSchema), updateTag);

/**
 * @route   DELETE /api/tags/:id
 * @desc    Supprimer un tag
 */
router.delete("/:id", validate(deleteTagSchema), deleteTag);

export default router;
