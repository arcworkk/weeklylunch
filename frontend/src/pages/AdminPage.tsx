import { FormEvent, useEffect, useState } from "react";
import {
  AddIcon,
  DeleteIcon,
  DownloadIcon,
  UploadIcon
} from "../components/ActionIcons";
import { EditIcon } from "../components/EditIcon";
import { useConfirm } from "../hooks/useConfirm";
import { adminService } from "../services/adminService";
import { AdminOverview, AdminUser } from "../types/admin";

export const AdminPage = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState("");
  const [editingPassword, setEditingPassword] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { confirm, confirmationModal } = useConfirm();

  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const [nextOverview, nextUsers] = await Promise.all([
        adminService.getOverview(),
        adminService.getUsers()
      ]);
      setOverview(nextOverview);
      setUsers(nextUsers);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await adminService.createUser(email, password);
      setEmail("");
      setPassword("");
      setMessage("Utilisateur cree.");
      await loadAdminData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (user: AdminUser) => {
    setEditingUserId(user.id);
    setEditingEmail(user.email);
    setEditingPassword("");
    setError("");
    setMessage("");
  };

  const handleUpdateUser = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingUserId) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await adminService.updateUser(editingUserId, editingEmail, editingPassword);
      setEditingUserId(null);
      setMessage("Utilisateur mis a jour.");
      await loadAdminData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const confirmed = await confirm({
      title: "Supprimer l'utilisateur",
      message: `Supprimer ${user.email} et toutes ses donnees ?`,
      confirmLabel: "Supprimer"
    });

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await adminService.deleteUser(user.id);
      setMessage("Utilisateur supprime.");
      await loadAdminData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    }
  };

  const handleExport = async () => {
    setError("");
    setMessage("");

    try {
      const payload = await adminService.exportRecipes();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `weeklylunch-recettes-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`${payload.recipes.length} recette(s) exportee(s).`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError("Selectionnez un fichier JSON.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = JSON.parse(await importFile.text()) as unknown;
      const result = await adminService.importRecipes(payload);
      setImportFile(null);
      setMessage(`${result.imported} recette(s) importee(s).`);
      await loadAdminData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Fichier JSON invalide");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="page">Chargement du panneau...</main>;
  }

  if (!overview) {
    return (
      <main className="page admin-page">
        <h1>Acces refuse</h1>
        <p className="error-text">{error || "Ce panneau est reserve a l'administrateur."}</p>
      </main>
    );
  }

  return (
    <main className="page wide-page admin-page">
      <div className="page-heading">
        <div>
          <h1>Console systeme</h1>
          <p className="page-description">Administration WeeklyLunch.</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      <section className="admin-stats" aria-label="Statistiques">
        <article className="panel"><strong>{overview.users}</strong><span>Utilisateurs</span></article>
        <article className="panel"><strong>{overview.recipes}</strong><span>Recettes</span></article>
        <article className="panel"><strong>{overview.adminEmail}</strong><span>Administrateur</span></article>
      </section>

      <section className="panel admin-section">
        <div className="panel-heading">
          <div>
            <h2>Import / export des recettes</h2>
            <p className="muted">Le fichier contient uniquement les recettes et leurs ingredients.</p>
          </div>
          <button
            type="button"
            className="secondary-button icon-button"
            aria-label="Exporter les recettes"
            title="Exporter les recettes en JSON"
            onClick={() => void handleExport()}
          >
            <DownloadIcon />
          </button>
        </div>
        <div className="admin-import-row">
          <input
            aria-label="Fichier JSON de recettes"
            accept="application/json,.json"
            type="file"
            onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="icon-button"
            aria-label="Importer les recettes"
            title="Importer les recettes"
            disabled={!importFile || saving}
            onClick={() => void handleImport()}
          >
            <UploadIcon />
          </button>
        </div>
      </section>

      <section className="panel admin-section">
        <div className="panel-heading">
          <h2>Utilisateurs</h2>
          <span className="item-count">{users.length}</span>
        </div>

        <form className="admin-user-form" onSubmit={handleCreateUser}>
          <input
            aria-label="Email du nouvel utilisateur"
            placeholder="utilisateur@example.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            aria-label="Mot de passe du nouvel utilisateur"
            placeholder="Mot de passe (8 caracteres minimum)"
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="submit"
            className="icon-button"
            aria-label="Creer l'utilisateur"
            title="Creer l'utilisateur"
            disabled={saving}
          >
            <AddIcon />
          </button>
        </form>

        <div className="admin-users-list">
          {users.map((user) => (
            <article className="admin-user-card" key={user.id}>
              {editingUserId === user.id ? (
                <form className="admin-user-form" onSubmit={handleUpdateUser}>
                  <input
                    aria-label={`Email de ${user.email}`}
                    type="email"
                    value={editingEmail}
                    disabled={user.email === overview.adminEmail}
                    onChange={(event) => setEditingEmail(event.target.value)}
                    required
                  />
                  <input
                    aria-label={`Nouveau mot de passe de ${user.email}`}
                    placeholder="Nouveau mot de passe (optionnel)"
                    type="password"
                    minLength={8}
                    value={editingPassword}
                    onChange={(event) => setEditingPassword(event.target.value)}
                  />
                  <div className="card-actions">
                    <button type="button" className="ghost-button" onClick={() => setEditingUserId(null)}>
                      Annuler
                    </button>
                    <button type="submit" disabled={saving}>Enregistrer</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="admin-user-info">
                    <strong>{user.email}</strong>
                    <span>
                      {user._count.recipes} recette(s) · {user._count.meals} repas · {user._count.weeklyPlans} planning(s)
                    </span>
                  </div>
                  <div className="card-actions">
                    <button
                      type="button"
                      className="secondary-button icon-button"
                      aria-label={`Modifier ${user.email}`}
                      title="Modifier l'utilisateur"
                      onClick={() => startEditing(user)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className="danger-button icon-button"
                      aria-label={`Supprimer ${user.email}`}
                      title="Supprimer l'utilisateur"
                      disabled={user.email === overview.adminEmail}
                      onClick={() => void handleDeleteUser(user)}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>
      {confirmationModal}
    </main>
  );
};
