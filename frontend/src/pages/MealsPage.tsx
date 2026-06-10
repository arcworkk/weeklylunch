import { useEffect, useMemo, useState } from "react";
import { AddIcon } from "../components/ActionIcons";
import { FormModal } from "../components/FormModal";
import { MealForm } from "../components/MealForm";
import { MealList } from "../components/MealList";
import { Pagination } from "../components/Pagination";
import { SearchFilter } from "../components/SearchFilter";
import { useConfirm } from "../hooks/useConfirm";
import { mealService } from "../services/mealService";
import { recipeService } from "../services/recipeService";
import { Meal, MealInput } from "../types/meal";
import { Recipe } from "../types/recipe";

export const MealsPage = () => {
  const pageSize = 5;
  const [meals, setMeals] = useState<Meal[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { confirm, confirmationModal } = useConfirm();

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase("fr");
  const filteredMeals = useMemo(
    () =>
      meals.filter((meal) =>
        `${meal.title} ${meal.recipe.title}`
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch)
      ),
    [meals, normalizedSearch]
  );
  const visibleMeals = filteredMeals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [nextMeals, nextRecipes] = await Promise.all([
        mealService.getMeals(),
        recipeService.getRecipes()
      ]);
      setMeals(nextMeals);
      setRecipes(nextRecipes);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredMeals.length / pageSize));
    setCurrentPage((page) => Math.min(page, lastPage));
  }, [filteredMeals.length]);

  const handleSubmit = async (meal: MealInput) => {
    setSaving(true);
    setError("");

    try {
      if (editingMeal) {
        await mealService.updateMeal(editingMeal.id, meal);
      } else {
        await mealService.createMeal(meal);
      }

      setEditingMeal(null);
      setFormOpen(false);
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const openCreateForm = () => {
    setError("");
    setEditingMeal(null);
    setFormOpen(true);
  };

  const openEditForm = (meal: Meal) => {
    setError("");
    setEditingMeal(meal);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingMeal(null);
    setError("");
  };

  const handleDelete = async (meal: Meal) => {
    const confirmed = await confirm({
      title: "Supprimer le repas",
      message: `Supprimer "${meal.title}" ? Les créneaux liés à ce repas seront aussi supprimés.`,
      confirmLabel: "Supprimer"
    });

    if (!confirmed) {
      return;
    }

    try {
      await mealService.deleteMeal(meal.id);
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    }
  };

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <h1>Repas</h1>
          <p className="page-description">
            Preparez des portions a partir de vos recettes existantes.
          </p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Creer un repas"
          title="Nouveau repas"
          disabled={recipes.length === 0}
          onClick={openCreateForm}
        >
          <AddIcon />
        </button>
      </div>
      {!formOpen && error && <p className="error-text">{error}</p>}
      {!loading && recipes.length === 0 && (
        <p className="info-text">
          Creez d'abord une recette avant d'ajouter un repas.
        </p>
      )}
      <section className="panel collection-panel">
        <div className="panel-heading">
          <h2>Mes repas</h2>
          {!loading && (
            <div className="collection-heading-actions">
              <SearchFilter
                label="Filtrer les repas"
                options={meals.map((meal) => meal.title)}
                placeholder="Rechercher un repas..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <span className="item-count" title={`${filteredMeals.length} repas affiche(s)`}>
                {filteredMeals.length}
              </span>
            </div>
          )}
        </div>
        {loading ? (
          <p className="muted">Chargement...</p>
        ) : (
          <MealList meals={visibleMeals} onEdit={openEditForm} onDelete={handleDelete} />
        )}
        {!loading && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredMeals.length}
            onPageChange={setCurrentPage}
          />
        )}
      </section>
      <FormModal
        closeDisabled={saving}
        description={
          editingMeal
            ? "Modifiez la recette associee ou le nombre de portions."
            : "Associez une recette a un nombre de portions pour faciliter votre planning."
        }
        open={formOpen}
        title={editingMeal ? "Modifier le repas" : "Nouveau repas"}
        onClose={closeForm}
      >
        {error && <p className="error-text">{error}</p>}
        <MealForm
          recipes={recipes}
          initialMeal={editingMeal}
          loading={saving}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormModal>
      {confirmationModal}
    </main>
  );
};
