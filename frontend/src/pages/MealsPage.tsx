import { useEffect, useState } from "react";
import { MealForm } from "../components/MealForm";
import { MealList } from "../components/MealList";
import { useConfirm } from "../hooks/useConfirm";
import { mealService } from "../services/mealService";
import { recipeService } from "../services/recipeService";
import { Meal, MealInput } from "../types/meal";
import { Recipe } from "../types/recipe";

export const MealsPage = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmationModal } = useConfirm();

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
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
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
        <h1>Repas</h1>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="two-column-layout">
        <MealForm
          recipes={recipes}
          initialMeal={editingMeal}
          loading={saving}
          onSubmit={handleSubmit}
          onCancel={() => setEditingMeal(null)}
        />
        <section className="panel">
          <div className="panel-heading">
            <h2>Mes repas</h2>
          </div>
          {loading ? (
            <p className="muted">Chargement...</p>
          ) : (
            <MealList meals={meals} onEdit={setEditingMeal} onDelete={handleDelete} />
          )}
        </section>
      </div>
      {confirmationModal}
    </main>
  );
};
