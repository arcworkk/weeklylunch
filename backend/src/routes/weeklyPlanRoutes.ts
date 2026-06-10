import { Router } from "express";
import { getPrepSummary } from "../controllers/prepSummaryController";
import {
  addPlannedMeal,
  createWeeklyPlan,
  deletePlannedMeal,
  deleteWeeklyPlan,
  getWeeklyPlan,
  getWeeklyPlans,
  updatePlannedMeal,
  updateWeeklyPlan
} from "../controllers/weeklyPlanController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/weekly-plans", getWeeklyPlans);
router.get("/weekly-plans/:id", getWeeklyPlan);
router.post("/weekly-plans", createWeeklyPlan);
router.put("/weekly-plans/:id", updateWeeklyPlan);
router.delete("/weekly-plans/:id", deleteWeeklyPlan);
router.post("/weekly-plans/:id/planned-meals", addPlannedMeal);
router.put("/planned-meals/:id", updatePlannedMeal);
router.delete("/planned-meals/:id", deletePlannedMeal);
router.get("/weekly-plans/:id/prep-summary", getPrepSummary);

export default router;
