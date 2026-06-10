import { Meal } from "../types/meal";
import { MealCard } from "./MealCard";

type MealListProps = {
  meals: Meal[];
  onEdit: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
};

export const MealList = ({ meals, onEdit, onDelete }: MealListProps) => {
  if (meals.length === 0) {
    return <p className="muted">Aucun repas.</p>;
  }

  return (
    <div className="stack">
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};
