import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getAuthToken } from "./services/api";
import { authService } from "./services/authService";
import { AuthResponse, User } from "./types/auth";
import { LoginPage } from "./pages/LoginPage";
import { MealsPage } from "./pages/MealsPage";
import { PrepSummaryPage } from "./pages/PrepSummaryPage";
import { RecipesPage } from "./pages/RecipesPage";
import { RegisterPage } from "./pages/RegisterPage";
import { WeeklyPlannerPage } from "./pages/WeeklyPlannerPage";

export const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

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

  const handleAuthenticated = (response: AuthResponse) => {
    setUser(response.user);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
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
          path="*"
          element={<Navigate to={user ? "/recipes" : "/login"} replace />}
        />
      </Routes>
    </>
  );
};
