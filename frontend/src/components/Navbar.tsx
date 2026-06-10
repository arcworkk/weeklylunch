import { NavLink, useNavigate } from "react-router-dom";
import { User } from "../types/auth";

type NavbarProps = {
  user: User | null;
  onLogout: () => void;
};

export const Navbar = ({ user, onLogout }: NavbarProps) => {
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
      </nav>
    </header>
  );
};
