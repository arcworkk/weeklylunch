import cors from "cors";
import express from "express";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import mealRoutes from "./routes/mealRoutes";
import recipeRoutes from "./routes/recipeRoutes";
import weeklyPlanRoutes from "./routes/weeklyPlanRoutes";
import { errorMiddleware } from "./middlewares/errorMiddleware";

export const app = express();
app.disable("x-powered-by");

const configuredFrontendUrl = String(process.env.FRONTEND_URL ?? "")
  .trim()
  .replace(/\/$/, "");
const isProduction = process.env.NODE_ENV === "production";

const isAllowedOrigin = (origin: string) => {
  if (configuredFrontendUrl && origin === configuredFrontendUrl) {
    return true;
  }

  return !isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  })
);
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "weeklylunch",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api", weeklyPlanRoutes);

app.use(errorMiddleware);
