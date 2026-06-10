import { PrepSummary } from "../types/prepSummary";
import { formatDuration } from "../utils/formatDuration";
import { IngredientList } from "./IngredientList";

type WeeklyPrepSummaryProps = {
  summary: PrepSummary | null;
};

export const WeeklyPrepSummary = ({ summary }: WeeklyPrepSummaryProps) => {
  if (!summary) {
    return <p className="muted">Aucun resume.</p>;
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Preparation hebdomadaire</h2>
        <span className="pill">
          Total semaine: {formatDuration(summary.totalBatchCookingTimeMinutes)}
        </span>
      </div>

      <div className="stack">
        {summary.recipesToPrepare.map((recipe) => (
          <article className="summary-recipe" key={recipe.recipeId}>
            <div className="card-header">
              <div>
                <h3>{recipe.recipeTitle}</h3>
                <p className="muted">
                  {recipe.totalServings} portions · Prep{" "}
                  {formatDuration(recipe.prepTimeMinutes)} · Cuisson{" "}
                  {formatDuration(recipe.cookTimeMinutes)} · Total{" "}
                  {formatDuration(recipe.totalTimeMinutes)}
                </p>
              </div>
            </div>
            <IngredientList ingredients={recipe.scaledIngredients} />
          </article>
        ))}
      </div>
    </section>
  );
};
