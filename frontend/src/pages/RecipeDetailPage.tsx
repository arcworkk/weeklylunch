import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DeleteIcon } from "../components/ActionIcons";
import { AttachmentPreview } from "../components/AttachmentPreview";
import { AuthenticatedImage } from "../components/AuthenticatedImage";
import { EditIcon } from "../components/EditIcon";
import { FormModal } from "../components/FormModal";
import { IngredientList } from "../components/IngredientList";
import { RecipeForm } from "../components/RecipeForm";
import { useConfirm } from "../hooks/useConfirm";
import { recipeService } from "../services/recipeService";
import { Recipe, RecipeSubmission } from "../types/recipe";
import { formatDuration } from "../utils/formatDuration";

export const RecipeDetailPage = () => {
  const { recipeId = "" } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmationModal } = useConfirm();

  useEffect(() => {
    void Promise.all([recipeService.getRecipe(recipeId), recipeService.getRecipes()])
      .then(([currentRecipe, allRecipes]) => {
        setRecipe(currentRecipe);
        setRecipes(allRecipes);
      })
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Recette introuvable");
      });
  }, [recipeId]);

  const ingredientSuggestions = useMemo(() => {
    const suggestions = new Map<string, { name: string; unit: string }>();

    recipes.forEach((item) => {
      item.ingredients.forEach((ingredient) => {
        const key = ingredient.name.trim().toLocaleLowerCase("fr");
        if (key && !suggestions.has(key)) {
          suggestions.set(key, { name: ingredient.name, unit: ingredient.unit });
        }
      });
    });

    return [...suggestions.values()].sort((left, right) =>
      left.name.localeCompare(right.name, "fr")
    );
  }, [recipes]);

  const handleUpdate = async (submission: RecipeSubmission) => {
    if (!recipe) return;

    setSaving(true);
    setError("");
    try {
      const updatedRecipe = await recipeService.updateRecipe(recipe.id, submission);
      setRecipe(updatedRecipe);
      setRecipes((current) =>
        current.map((item) => item.id === updatedRecipe.id ? updatedRecipe : item)
      );
      setEditing(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;

    const confirmed = await confirm({
      title: "Supprimer la recette",
      message: `Supprimer "${recipe.title}" ? Les repas lies a cette recette seront aussi supprimes.`,
      confirmLabel: "Supprimer"
    });

    if (!confirmed) return;

    try {
      await recipeService.deleteRecipe(recipe.id);
      navigate("/recipes", { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    }
  };

  if (error && !recipe) return <main className="page"><p className="error-text">{error}</p></main>;
  if (!recipe) return <main className="page"><p className="muted">Chargement...</p></main>;

  return (
    <main className="page recipe-detail-page">
      <Link to="/recipes" className="recipe-back-link">Retour aux recettes</Link>
      {error && !editing && <p className="error-text">{error}</p>}
      <article className="recipe-detail">
        <div className="recipe-detail-media"><AuthenticatedImage src={recipe.thumbnailUrl} alt={recipe.title} /></div>
        <div className="recipe-detail-intro">
          <div className="recipe-detail-heading">
            <div>
              <span className="recipe-detail-eyebrow">Recette</span>
              <h1>{recipe.title}</h1>
            </div>
            <div className="card-actions recipe-detail-actions">
              <button type="button" className="secondary-button icon-button" aria-label={`Modifier ${recipe.title}`} title="Modifier la recette" onClick={() => setEditing(true)}>
                <EditIcon />
              </button>
              <button type="button" className="danger-button icon-button" aria-label={`Supprimer ${recipe.title}`} title="Supprimer la recette" onClick={() => void handleDelete()}>
                <DeleteIcon />
              </button>
            </div>
          </div>
          <div className="recipe-detail-stats">
            <span>{recipe.baseServings} portion{recipe.baseServings > 1 ? "s" : ""}</span>
            <span>Preparation {formatDuration(recipe.prepTimeMinutes)}</span>
            <span>Cuisson {formatDuration(recipe.cookTimeMinutes)}</span>
          </div>
        </div>
        <section className="recipe-detail-section">
          <h2>Ingredients</h2>
          <IngredientList ingredients={recipe.ingredients} />
        </section>
        <section className="recipe-detail-section">
          <h2>Etapes de realisation</h2>
          <p className="instructions">{recipe.instructions || "Aucune instruction renseignee."}</p>
          {recipe.attachments.length > 0 && (
            <div className="attachment-preview-grid recipe-attachments">
              {recipe.attachments.map((attachment) => <AttachmentPreview key={attachment.id} attachment={attachment} />)}
            </div>
          )}
        </section>
      </article>

      <FormModal
        open={editing}
        closeDisabled={saving}
        title="Modifier la recette"
        description="Mettez a jour les informations, les medias et les ingredients de la recette."
        onClose={() => !saving && setEditing(false)}
      >
        {error && <p className="error-text">{error}</p>}
        <RecipeForm
          initialRecipe={recipe}
          ingredientSuggestions={ingredientSuggestions}
          loading={saving}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      </FormModal>
      {confirmationModal}
    </main>
  );
};
