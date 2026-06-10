import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getAuthToken } from "./services/api";
import { authService } from "./services/authService";
import { adminService } from "./services/adminService";
import { AuthResponse, User } from "./types/auth";
import { LoginPage } from "./pages/LoginPage";
import { MealsPage } from "./pages/MealsPage";
import { PrepSummaryPage } from "./pages/PrepSummaryPage";
import { RecipesPage } from "./pages/RecipesPage";
import { RegisterPage } from "./pages/RegisterPage";
import { WeeklyPlannerPage } from "./pages/WeeklyPlannerPage";
import { AdminPage } from "./pages/AdminPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem("weeklylunch_theme");
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("weeklylunch_theme", theme);
  }, [theme]);

  useEffect(() => {
    const loadUser = async () => {
      const token = getAuthToken();

      if (!token) {
        setLoadingUser(false);
        return;
      }

      try {
        setUser(await authService.me());
      } catch {
        authService.logout();
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    void loadUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const loadAdminAccess = async () => {
      try {
        const access = await adminService.getAccess();
        setIsAdmin(access.isAdmin);
      } catch {
        setIsAdmin(false);
      }
    };

    void loadAdminAccess();
  }, [user]);

  const handleAuthenticated = (response: AuthResponse) => {
    setUser(response.user);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <>
      <Navbar
        user={user}
        isAdmin={isAdmin}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
        onLogout={handleLogout}
      />
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/recipes" replace />
            ) : (
              <LoginPage onAuthenticated={handleAuthenticated} />
            )
          }
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/recipes" replace />
            ) : (
              <RegisterPage onAuthenticated={handleAuthenticated} />
            )
          }
        />
        <Route
          path="/recipes"
          element={
            <ProtectedRoute user={user} loading={loadingUser}>
              <RecipesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meals"
          element={
            <ProtectedRoute user={user} loading={loadingUser}>
              <MealsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/weekly-planner"
          element={
            <ProtectedRoute user={user} loading={loadingUser}>
              <WeeklyPlannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prep-summary"
          element={
            <ProtectedRoute user={user} loading={loadingUser}>
              <PrepSummaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipes/:recipeId"
          element={
            <ProtectedRoute user={user} loading={loadingUser}>
              <RecipeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/weeklylunch-console-7f3a"
          element={
            <ProtectedRoute user={user} loading={loadingUser}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to={user ? "/recipes" : "/login"} replace />}
        />
      </Routes>
    </>
  );
};
