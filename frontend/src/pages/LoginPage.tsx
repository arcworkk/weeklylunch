import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { AuthResponse } from "../types/auth";

type LoginPageProps = {
  onAuthenticated: (response: AuthResponse) => void;
};

export const LoginPage = ({ onAuthenticated }: LoginPageProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("test@weeklylunch.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      onAuthenticated(response);
      navigate("/recipes");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Connexion</h1>
        {error && <p className="error-text">{error}</p>}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <p className="muted">
          Pas encore de compte ? <Link to="/register">Creer un compte</Link>
        </p>
      </form>
    </main>
  );
};
