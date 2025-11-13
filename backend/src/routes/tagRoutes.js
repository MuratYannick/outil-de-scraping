import express from "express";
import {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} from "../controllers/tagController.js";

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
router.get("/:id", getTagById);

/**
 * @route   POST /api/tags
 * @desc    Créer un nouveau tag
 */
router.post("/", createTag);

/**
 * @route   PUT /api/tags/:id
 * @desc    Mettre à jour un tag
 */
router.put("/:id", updateTag);

/**
 * @route   DELETE /api/tags/:id
 * @desc    Supprimer un tag
 */
router.delete("/:id", deleteTag);

export default router;
