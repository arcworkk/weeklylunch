import { Router } from "express";
import {
  createUser,
  deleteUser,
  exportRecipes,
  getAdminAccess,
  getAdminOverview,
  importRecipes,
  listUsers,
  updateUser
} from "../controllers/adminController";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/access", authMiddleware, getAdminAccess);
router.use(authMiddleware, adminMiddleware);
router.get("/overview", getAdminOverview);
router.get("/users", listUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/recipes/export", exportRecipes);
router.post("/recipes/import", importRecipes);

export default router;
