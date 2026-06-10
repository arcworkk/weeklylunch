import { Meal } from "../types/meal";
import { formatDuration } from "../utils/formatDuration";
import { ScaledIngredients } from "./ScaledIngredients";

type MealCardProps = {
  meal: Meal;
  onEdit: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
};

export const MealCard = ({ meal, onEdit, onDelete }: MealCardProps) => {
  const totalTime = meal.recipe.prepTimeMinutes + meal.recipe.cookTimeMinutes;

  return (
    <article className="card">
      <div className="card-header">
        <div>
          <h3>{meal.title}</h3>
          <p className="muted">
            {meal.recipe.title} · {meal.desiredServings} portion
            {meal.desiredServings > 1 ? "s" : ""}
          </p>
          <p className="muted">
            Prep {formatDuration(meal.recipe.prepTimeMinutes)} · Cuisson{" "}
            {formatDuration(meal.recipe.cookTimeMinutes)} · Total{" "}
            {formatDuration(totalTime)}
          </p>
        </div>
        <div className="card-actions">
          <button type="button" className="secondary-button" onClick={() => onEdit(meal)}>
            Modifier
          </button>
          <button type="button" className="danger-button" onClick={() => onDelete(meal)}>
            Supprimer
          </button>
        </div>
      </div>

      <ScaledIngredients recipe={meal.recipe} servings={meal.desiredServings} />
    </article>
  );
};
