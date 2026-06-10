import { NavLink, useNavigate } from "react-router-dom";
import { User } from "../types/auth";
import { MoonIcon, SunIcon } from "./ActionIcons";

type NavbarProps = {
  user: User | null;
  isAdmin: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
};

export const Navbar = ({ user, isAdmin, theme, onToggleTheme, onLogout }: NavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        WeeklyLunch
      </NavLink>

      <nav className="nav-links">
        {user ? (
          <>
            <NavLink to="/recipes">Recettes</NavLink>
            <NavLink to="/meals">Repas</NavLink>
            <NavLink to="/weekly-planner">Planning semaine</NavLink>
            <NavLink to="/prep-summary">Preparation / Liste de courses</NavLink>
            {isAdmin && (
              <NavLink to="/system/weeklylunch-console-7f3a">Admin</NavLink>
            )}
            <span className="user-email">{user.email}</span>
            <button type="button" className="ghost-button" onClick={handleLogout}>
              Deconnexion
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
        <button
          type="button"
          className="theme-toggle icon-button"
          aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          onClick={onToggleTheme}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </nav>
    </header>
  );
};
