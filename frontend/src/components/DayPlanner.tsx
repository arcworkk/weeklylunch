import { Meal } from "../types/meal";
import {
  MEAL_SLOTS,
  MealSlot,
  PlannedMeal,
  WeekDay
} from "../types/weeklyPlan";
import { MealSlotSelector } from "./MealSlotSelector";

type DayPlannerProps = {
  day: WeekDay;
  dayLabel: string;
  meals: Meal[];
  plannedMeals: PlannedMeal[];
  onSave: (day: WeekDay, slot: MealSlot, mealId: string, servings: number) => Promise<void>;
  onDelete: (plannedMealId: string) => Promise<void>;
};

export const DayPlanner = ({
  day,
  dayLabel,
  meals,
  plannedMeals,
  onSave,
  onDelete
}: DayPlannerProps) => {
  return (
    <section className="day-card">
      <h3>{dayLabel}</h3>
      <div className="slot-stack">
        {MEAL_SLOTS.map((slot) => (
          <MealSlotSelector
            key={slot.value}
            day={day}
            slot={slot.value}
            slotLabel={slot.label}
            meals={meals}
            plannedMeal={plannedMeals.find(
              (plannedMeal) => plannedMeal.day === day && plannedMeal.slot === slot.value
            )}
            onSave={onSave}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
};
