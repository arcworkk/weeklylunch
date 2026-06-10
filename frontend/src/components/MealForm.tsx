import { FormEvent, useEffect, useState } from "react";
import { Meal, MealInput } from "../types/meal";
import { Recipe } from "../types/recipe";

type MealFormProps = {
  recipes: Recipe[];
  initialMeal?: Meal | null;
  loading?: boolean;
  onCancel?: () => void;
  onSubmit: (meal: MealInput) => Promise<void>;
};

export const MealForm = ({
  recipes,
  initialMeal,
  loading = false,
  onCancel,
  onSubmit
}: MealFormProps) => {
  const [title, setTitle] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [desiredServings, setDesiredServings] = useState("1");

  useEffect(() => {
    if (initialMeal) {
      setTitle(initialMeal.title);
      setRecipeId(initialMeal.recipeId);
      setDesiredServings(String(initialMeal.desiredServings));
      return;
    }

    setTitle("");
    setRecipeId(recipes[0]?.id ?? "");
    setDesiredServings("1");
  }, [initialMeal, recipes]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({ title, recipeId, desiredServings: Number(desiredServings) });
  };

  return (
    <form className="form-panel modal-form" onSubmit={handleSubmit}>
      <label>
        Titre
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>

      <label>
        Recette
        <select
          value={recipeId}
          onChange={(event) => setRecipeId(event.target.value)}
          required
          disabled={recipes.length === 0}
        >
          {recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.id}>
              {recipe.title}
            </option>
          ))}
        </select>
      </label>

      <label>
        Portions souhaitees
        <input
          type="number"
          min="1"
          value={desiredServings}
          onChange={(event) => setDesiredServings(event.target.value)}
          required
        />
      </label>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="ghost-button" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button type="submit" disabled={loading || recipes.length === 0}>
          {loading
            ? "Enregistrement..."
            : initialMeal
              ? "Enregistrer les modifications"
              : "Creer le repas"}
        </button>
      </div>
    </form>
  );
};
