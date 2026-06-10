import { useEffect, useState } from "react";
import { Meal } from "../types/meal";
import { MealSlot, PlannedMeal, WeekDay } from "../types/weeklyPlan";
import { DeleteIcon } from "./ActionIcons";
import { EditIcon } from "./EditIcon";

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
  const [servings, setServings] = useState("1");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setMealId(plannedMeal?.mealId ?? meals[0]?.id ?? "");
    setServings(String(plannedMeal?.servings ?? 1));
    if (plannedMeal) {
      setAdding(false);
      setEditing(false);
    }
  }, [plannedMeal, meals]);

  const handleSave = async () => {
    const parsedServings = Number(servings);

    if (!mealId || !Number.isInteger(parsedServings) || parsedServings < 1) {
      return;
    }

    setSaving(true);
    try {
      await onSave(day, slot, mealId, parsedServings);
      setAdding(false);
      setEditing(false);
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

  const handleCancel = () => {
    setMealId(plannedMeal?.mealId ?? meals[0]?.id ?? "");
    setServings(String(plannedMeal?.servings ?? 1));
    setAdding(false);
    setEditing(false);
  };

  const editorVisible = adding || editing;
  const slotTheme = `slot-theme-${slot.toLowerCase()}`;

  return (
    <div
      className={`slot-row ${slotTheme}${plannedMeal ? " slot-row-filled" : " slot-row-empty"}${editorVisible ? " slot-row-editing" : ""}`}
    >
      <div className="slot-title">{slotLabel}</div>
      {editorVisible ? (
        <>
          <label className="slot-field">
            Repas
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
          </label>
          <label className="slot-field">
            Portions
            <input
              type="number"
              min="1"
              value={servings}
              onChange={(event) => setServings(event.target.value)}
            />
          </label>
          <div className="slot-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={handleCancel}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !mealId || Number(servings) < 1}
            >
              {saving ? "Enregistrement..." : plannedMeal ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </>
      ) : plannedMeal ? (
        <>
          <div className="selected-meal-summary">
            <span className="selected-meal-marker" aria-hidden="true" />
            <div className="selected-meal-copy">
              <span>Repas planifie</span>
              <strong title={plannedMeal.meal.title}>{plannedMeal.meal.title}</strong>
            </div>
            <span className="servings-badge">
              {plannedMeal.servings} portion{plannedMeal.servings > 1 ? "s" : ""}
            </span>
          </div>
          <div className="selected-meal-actions">
            <button
              type="button"
              className="slot-edit-button icon-button"
              aria-label={`Modifier ${plannedMeal.meal.title}`}
              title="Modifier ce repas"
              onClick={() => setEditing(true)}
              disabled={saving}
            >
              <EditIcon />
            </button>
            <button
              type="button"
              className="slot-delete-button icon-button"
              aria-label={`Supprimer ${plannedMeal.meal.title}`}
              title="Supprimer ce repas"
              onClick={handleDelete}
              disabled={saving}
            >
              <DeleteIcon />
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className="empty-slot-button"
          disabled={meals.length === 0}
          onClick={() => setAdding(true)}
        >
          <span aria-hidden="true">+</span>
          {meals.length === 0 ? "Aucun repas disponible" : "Ajouter un repas"}
        </button>
      )}
    </div>
  );
};
