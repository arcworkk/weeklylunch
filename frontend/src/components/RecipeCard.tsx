import { Recipe } from "../types/recipe";
import { formatDuration } from "../utils/formatDuration";
import { IngredientList } from "./IngredientList";

type RecipeCardProps = {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
};

export const RecipeCard = ({ recipe, onEdit, onDelete }: RecipeCardProps) => {
  return (
    <article className="card">
      <div className="card-header">
        <div>
          <h3>{recipe.title}</h3>
          <p className="muted">
            Base {recipe.baseServings} portions · Prep{" "}
            {formatDuration(recipe.prepTimeMinutes)} · Cuisson{" "}
            {formatDuration(recipe.cookTimeMinutes)}
          </p>
        </div>
        <div className="card-actions">
          <button type="button" className="secondary-button" onClick={() => onEdit(recipe)}>
            Modifier
          </button>
          <button type="button" className="danger-button" onClick={() => onDelete(recipe)}>
            Supprimer
          </button>
        </div>
      </div>
      <IngredientList ingredients={recipe.ingredients} />
      {recipe.instructions && <p className="instructions">{recipe.instructions}</p>}
    </article>
  );
};
