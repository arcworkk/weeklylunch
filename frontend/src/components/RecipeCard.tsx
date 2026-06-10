import { Recipe } from "../types/recipe";
import { formatDuration } from "../utils/formatDuration";
import { DeleteIcon } from "./ActionIcons";
import { EditIcon } from "./EditIcon";
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
          <button
            type="button"
            className="secondary-button icon-button"
            aria-label={`Modifier ${recipe.title}`}
            title="Modifier la recette"
            onClick={() => onEdit(recipe)}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            className="danger-button icon-button"
            aria-label={`Supprimer ${recipe.title}`}
            title="Supprimer la recette"
            onClick={() => onDelete(recipe)}
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
      <IngredientList ingredients={recipe.ingredients} />
      {recipe.instructions && <p className="instructions">{recipe.instructions}</p>}
    </article>
  );
};
