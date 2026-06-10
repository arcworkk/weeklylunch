import { useEffect, useState } from "react";
import { RecipeForm } from "../components/RecipeForm";
import { RecipeList } from "../components/RecipeList";
import { useConfirm } from "../hooks/useConfirm";
import { recipeService } from "../services/recipeService";
import { Recipe, RecipeInput } from "../types/recipe";

export const RecipesPage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmationModal } = useConfirm();

  const loadRecipes = async () => {
    setLoading(true);
    setError("");

    try {
      setRecipes(await recipeService.getRecipes());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecipes();
  }, []);

  const handleSubmit = async (recipe: RecipeInput) => {
    setSaving(true);
    setError("");

    try {
      if (editingRecipe) {
        await recipeService.updateRecipe(editingRecipe.id, recipe);
      } else {
        await recipeService.createRecipe(recipe);
      }

      setEditingRecipe(null);
      await loadRecipes();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recipe: Recipe) => {
    const confirmed = await confirm({
      title: "Supprimer la recette",
      message: `Supprimer "${recipe.title}" ? Les repas liés à cette recette seront aussi supprimés.`,
      confirmLabel: "Supprimer"
    });

    if (!confirmed) {
      return;
    }

    try {
      await recipeService.deleteRecipe(recipe.id);
      await loadRecipes();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    }
  };

  return (
    <main className="page">
      <div className="page-heading">
        <h1>Recettes</h1>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="two-column-layout">
        <RecipeForm
          initialRecipe={editingRecipe}
          loading={saving}
          onSubmit={handleSubmit}
          onCancel={() => setEditingRecipe(null)}
        />
        <section className="panel">
          <div className="panel-heading">
            <h2>Mes recettes</h2>
          </div>
          {loading ? (
            <p className="muted">Chargement...</p>
          ) : (
            <RecipeList
              recipes={recipes}
              onEdit={setEditingRecipe}
              onDelete={handleDelete}
            />
          )}
        </section>
      </div>
      {confirmationModal}
    </main>
  );
};
