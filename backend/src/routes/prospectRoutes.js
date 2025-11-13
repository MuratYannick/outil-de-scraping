import express from "express";
import {
  getAllProspects,
  getProspectById,
  createProspect,
  updateProspect,
  deleteProspect,
  addTagToProspect,
  removeTagFromProspect,
} from "../controllers/prospectController.js";

const router = express.Router();

/**
 * @route   GET /api/prospects
 * @desc    Récupérer tous les prospects avec pagination et filtres
 * @query   limit, offset, source, tag
 */
router.get("/", getAllProspects);

/**
 * @route   GET /api/prospects/:id
 * @desc    Récupérer un prospect par ID
 */
router.get("/:id", getProspectById);

/**
 * @route   POST /api/prospects
 * @desc    Créer un nouveau prospect
 */
router.post("/", createProspect);

/**
 * @route   PUT /api/prospects/:id
 * @desc    Mettre à jour un prospect
 */
router.put("/:id", updateProspect);

/**
 * @route   DELETE /api/prospects/:id
 * @desc    Supprimer un prospect
 */
router.delete("/:id", deleteProspect);

/**
 * @route   POST /api/prospects/:id/tags
 * @desc    Associer un tag à un prospect
 */
router.post("/:id/tags", addTagToProspect);

/**
 * @route   DELETE /api/prospects/:id/tags/:tag_id
 * @desc    Retirer un tag d'un prospect
 */
router.delete("/:id/tags/:tag_id", removeTagFromProspect);

export default router;
