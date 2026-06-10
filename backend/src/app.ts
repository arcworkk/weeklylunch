import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes";
import mealRoutes from "./routes/mealRoutes";
import recipeRoutes from "./routes/recipeRoutes";
import weeklyPlanRoutes from "./routes/weeklyPlanRoutes";
import { errorMiddleware } from "./middlewares/errorMiddleware";

export const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api", weeklyPlanRoutes);

app.use(errorMiddleware);
