import { Router } from "express";
import {
  createRecipe,
  deleteRecipe,
  downloadRecipeAttachment,
  getRecipe,
  getRecipeThumbnail,
  getRecipes,
  updateRecipe
} from "../controllers/recipeController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { recipeUpload } from "../middlewares/recipeUploadMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getRecipes);
router.get("/:id/thumbnail", getRecipeThumbnail);
router.get("/:id/attachments/:attachmentId", downloadRecipeAttachment);
router.get("/:id", getRecipe);
router.post("/", recipeUpload, createRecipe);
router.put("/:id", recipeUpload, updateRecipe);
router.delete("/:id", deleteRecipe);

export default router;
