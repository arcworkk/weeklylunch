import { Router } from "express";
import {
  createMeal,
  deleteMeal,
  getMeal,
  getMeals,
  updateMeal
} from "../controllers/mealController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getMeals);
router.get("/:id", getMeal);
router.post("/", createMeal);
router.put("/:id", updateMeal);
router.delete("/:id", deleteMeal);

export default router;
