import { useEffect, useState } from "react";
import { Meal } from "../types/meal";
import { MealSlot, PlannedMeal, WeekDay } from "../types/weeklyPlan";

type MealSlotSelectorProps = {
  day: WeekDay;
  slot: MealSlot;
  slotLabel: string;
  meals: Meal[];
  plannedMeal?: PlannedMeal;
  onSave: (day: WeekDay, slot: MealSlot, mealId: string, servings: number) => Promise<void>;
  onDelete: (plannedMealId: string) => Promise<void>;
};

export const MealSlotSelector = ({
  day,
  slot,
  slotLabel,
  meals,
  plannedMeal,
  onSave,
  onDelete
}: MealSlotSelectorProps) => {
  const [mealId, setMealId] = useState("");
  const [servings, setServings] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMealId(plannedMeal?.mealId ?? meals[0]?.id ?? "");
    setServings(plannedMeal?.servings ?? 1);
  }, [plannedMeal, meals]);

  const handleSave = async () => {
    if (!mealId) {
      return;
    }

    setSaving(true);
    try {
      await onSave(day, slot, mealId, servings);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (plannedMeal) {
      setSaving(true);
      try {
        await onDelete(plannedMeal.id);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="slot-row">
      <div className="slot-title">{slotLabel}</div>
      <select
        value={mealId}
        onChange={(event) => setMealId(event.target.value)}
        disabled={meals.length === 0}
      >
        {meals.length === 0 ? (
          <option value="">Aucun repas</option>
        ) : (
          meals.map((meal) => (
            <option key={meal.id} value={meal.id}>
              {meal.title}
            </option>
          ))
        )}
      </select>
      <input
        type="number"
        min="1"
        value={servings}
        onChange={(event) => setServings(Number(event.target.value))}
      />
      <button type="button" onClick={handleSave} disabled={saving || !mealId}>
        {plannedMeal ? "Modifier" : "Sauvegarder"}
      </button>
      {plannedMeal && (
        <button
          type="button"
          className="danger-button"
          onClick={handleDelete}
          disabled={saving}
        >
          Supprimer
        </button>
      )}
    </div>
  );
};
