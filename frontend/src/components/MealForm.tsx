import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Meal, MealInput } from "../types/meal";
import { Recipe } from "../types/recipe";
import { AuthenticatedImage } from "./AuthenticatedImage";

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
  const [useRecipeTitle, setUseRecipeTitle] = useState(true);
  const selectedRecipe = recipes.find((recipe) => recipe.id === recipeId);

  useEffect(() => {
    if (initialMeal) {
      const recipeTitle =
        recipes.find((recipe) => recipe.id === initialMeal.recipeId)?.title ?? "";
      const usesRecipeTitle =
        recipeTitle.length > 0 && initialMeal.title.trim() === recipeTitle.trim();

      setTitle(usesRecipeTitle ? recipeTitle : initialMeal.title);
      setRecipeId(initialMeal.recipeId);
      setDesiredServings(String(initialMeal.desiredServings));
      setUseRecipeTitle(usesRecipeTitle);
      return;
    }

    const firstRecipe = recipes[0];

    setTitle(firstRecipe?.title ?? "");
    setRecipeId(firstRecipe?.id ?? "");
    setDesiredServings("1");
    setUseRecipeTitle(true);
  }, [initialMeal, recipes]);

  const handleRecipeChange = (nextRecipeId: string) => {
    setRecipeId(nextRecipeId);

    if (useRecipeTitle) {
      const nextRecipe = recipes.find((recipe) => recipe.id === nextRecipeId);
      setTitle(nextRecipe?.title ?? "");
    }
  };

  const handleTitleModeChange = (checked: boolean) => {
    setUseRecipeTitle(checked);

    if (checked) {
      const selectedRecipe = recipes.find((recipe) => recipe.id === recipeId);
      setTitle(selectedRecipe?.title ?? "");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({ title, recipeId, desiredServings: Number(desiredServings) });
  };

  return (
    <form className="form-panel modal-form" onSubmit={handleSubmit}>
      <label>
        Recette
        <select
          value={recipeId}
          onChange={(event) => handleRecipeChange(event.target.value)}
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

      {selectedRecipe && (
        <Link className="selected-recipe-preview" to={`/recipes/${selectedRecipe.id}`} target="_blank">
          <AuthenticatedImage src={selectedRecipe.thumbnailUrl} alt={selectedRecipe.title} />
          <span><small>Recette selectionnee</small><strong>{selectedRecipe.title}</strong></span>
        </Link>
      )}

      <label className={`meal-title-mode${useRecipeTitle ? " is-active" : ""}`}>
        <input
          type="checkbox"
          checked={useRecipeTitle}
          onChange={(event) => handleTitleModeChange(event.target.checked)}
        />
        <span className="meal-title-mode-copy">
          <strong>Utiliser le nom de la recette</strong>
          <small>
            Le titre du repas suivra automatiquement la recette selectionnee.
          </small>
        </span>
      </label>

      <label>
        Titre du repas
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          readOnly={useRecipeTitle}
          required
        />
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
