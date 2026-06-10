import { useEffect, useMemo, useState } from "react";
import { AddIcon } from "../components/ActionIcons";
import { FormModal } from "../components/FormModal";
import { Pagination } from "../components/Pagination";
import { RecipeForm } from "../components/RecipeForm";
import { RecipeList } from "../components/RecipeList";
import { SearchFilter } from "../components/SearchFilter";
import { useConfirm } from "../hooks/useConfirm";
import { recipeService } from "../services/recipeService";
import { Recipe, RecipeSubmission } from "../types/recipe";

export const RecipesPage = () => {
  const pageSize = 5;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { confirm, confirmationModal } = useConfirm();

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase("fr");
  const filteredRecipes = useMemo(
    () =>
      recipes.filter((recipe) =>
        [
          recipe.title,
          recipe.instructions,
          ...recipe.ingredients.map((ingredient) => ingredient.name)
        ]
          .join(" ")
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch)
      ),
    [normalizedSearch, recipes]
  );
  const visibleRecipes = filteredRecipes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const ingredientSuggestions = useMemo(() => {
    const suggestions = new Map<string, { name: string; unit: string }>();

    recipes.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredRecipes.length / pageSize));
    setCurrentPage((page) => Math.min(page, lastPage));
  }, [filteredRecipes.length]);

  const handleSubmit = async (submission: RecipeSubmission) => {
    setSaving(true);
    setError("");

    try {
      if (editingRecipe) {
        await recipeService.updateRecipe(editingRecipe.id, submission);
      } else {
        await recipeService.createRecipe(submission);
      }

      setEditingRecipe(null);
      setFormOpen(false);
      await loadRecipes();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const openCreateForm = () => {
    setError("");
    setEditingRecipe(null);
    setFormOpen(true);
  };

  const openEditForm = (recipe: Recipe) => {
    setError("");
    setEditingRecipe(recipe);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingRecipe(null);
    setError("");
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
        <div>
          <h1>Recettes</h1>
          <p className="page-description">
            Centralisez vos recettes et leurs ingredients de reference.
          </p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Creer une recette"
          title="Nouvelle recette"
          onClick={openCreateForm}
        >
          <AddIcon />
        </button>
      </div>
      {!formOpen && error && <p className="error-text">{error}</p>}
      <section className="panel collection-panel">
        <div className="panel-heading">
          <h2>Mes recettes</h2>
          {!loading && (
            <div className="collection-heading-actions">
              <SearchFilter
                label="Filtrer les recettes"
                options={recipes.map((recipe) => recipe.title)}
                placeholder="Rechercher une recette..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <span className="item-count" title={`${filteredRecipes.length} recette(s) affichee(s)`}>
                {filteredRecipes.length}
              </span>
            </div>
          )}
        </div>
        {loading ? (
          <p className="muted">Chargement...</p>
        ) : (
          <RecipeList
            recipes={visibleRecipes}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        )}
        {!loading && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredRecipes.length}
            onPageChange={setCurrentPage}
          />
        )}
      </section>
      <FormModal
        closeDisabled={saving}
        description={
          editingRecipe
            ? "Mettez a jour les informations et les ingredients de la recette."
            : "Renseignez la base de votre recette. Les quantites pourront ensuite etre adaptees aux portions."
        }
        open={formOpen}
        title={editingRecipe ? "Modifier la recette" : "Nouvelle recette"}
        onClose={closeForm}
      >
        {error && <p className="error-text">{error}</p>}
        <RecipeForm
          initialRecipe={editingRecipe}
          ingredientSuggestions={ingredientSuggestions}
          loading={saving}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormModal>
      {confirmationModal}
    </main>
  );
};
