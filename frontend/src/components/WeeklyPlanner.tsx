import { FormEvent, useState } from "react";
import { Meal } from "../types/meal";
import {
  MealSlot,
  WEEK_DAYS,
  WeekDay,
  WeeklyPlan
} from "../types/weeklyPlan";
import { DayPlanner } from "./DayPlanner";

type WeeklyPlannerProps = {
  plans: WeeklyPlan[];
  selectedPlan: WeeklyPlan | null;
  selectedPlanId: string;
  meals: Meal[];
  onSelectPlan: (id: string) => void;
  onCreatePlan: (name: string) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
  onSaveSlot: (
    day: WeekDay,
    slot: MealSlot,
    mealId: string,
    servings: number
  ) => Promise<void>;
  onDeleteSlot: (plannedMealId: string) => Promise<void>;
};

export const WeeklyPlanner = ({
  plans,
  selectedPlan,
  selectedPlanId,
  meals,
  onSelectPlan,
  onCreatePlan,
  onDeletePlan,
  onSaveSlot,
  onDeleteSlot
}: WeeklyPlannerProps) => {
  const [newPlanName, setNewPlanName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreatePlan = async (event: FormEvent) => {
    event.preventDefault();

    if (!newPlanName.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onCreatePlan(newPlanName);
      setNewPlanName("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <section className="panel planner-toolbar">
        <form className="inline-form" onSubmit={handleCreatePlan}>
          <input
            placeholder="Nom du planning"
            value={newPlanName}
            onChange={(event) => setNewPlanName(event.target.value)}
          />
          <button type="submit" disabled={saving}>
            Creer
          </button>
        </form>

        <div className="inline-form">
          <select
            value={selectedPlanId}
            onChange={(event) => onSelectPlan(event.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          {selectedPlan && (
            <button
              type="button"
              className="danger-button"
              onClick={() => onDeletePlan(selectedPlan.id)}
            >
              Supprimer le planning
            </button>
          )}
        </div>
      </section>

      {selectedPlan ? (
        <div className="week-grid">
          {WEEK_DAYS.map((day) => (
            <DayPlanner
              key={day.value}
              day={day.value}
              dayLabel={day.label}
              meals={meals}
              plannedMeals={selectedPlan.plannedMeals}
              onSave={onSaveSlot}
              onDelete={onDeleteSlot}
            />
          ))}
        </div>
      ) : (
        <p className="muted">Aucun planning.</p>
      )}
    </div>
  );
};
