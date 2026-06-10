import "dotenv/config";
import { app } from "./app";

const port = Number(process.env.PORT ?? 3001);

const validateProductionEnvironment = () => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const requiredVariables = ["DATABASE_URL", "JWT_SECRET", "FRONTEND_URL", "ADMIN_EMAIL"];
  const missingVariables = requiredVariables.filter(
    (name) => !String(process.env[name] ?? "").trim()
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required production environment variable(s): ${missingVariables.join(", ")}`
    );
  }

  const jwtSecret = String(process.env.JWT_SECRET);

  if (jwtSecret.length < 32 || /change[_-]?me/i.test(jwtSecret)) {
    throw new Error("JWT_SECRET must be replaced with at least 32 random characters");
  }
};

try {
  validateProductionEnvironment();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid production configuration");
  process.exit(1);
}

app.listen(port, () => {
  console.log(`WeeklyLunch API running on http://localhost:${port}`);
});
