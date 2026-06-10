import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { AuthResponse } from "../types/auth";

type RegisterPageProps = {
  onAuthenticated: (response: AuthResponse) => void;
};

export const RegisterPage = ({ onAuthenticated }: RegisterPageProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.register(email, password);
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
        <h1>Inscription</h1>
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
          {loading ? "Creation..." : "Creer le compte"}
        </button>
        <p className="muted">
          Deja inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </main>
  );
};
