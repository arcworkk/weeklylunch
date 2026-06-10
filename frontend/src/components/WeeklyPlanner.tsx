import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import { Meal } from "../types/meal";
import {
  MEAL_SLOTS,
  MealSlot,
  WEEK_DAYS,
  WeekDay,
  WeeklyPlan
} from "../types/weeklyPlan";
import { AddIcon, DeleteIcon } from "./ActionIcons";
import { MealSlotSelector } from "./MealSlotSelector";
import { SearchFilter } from "./SearchFilter";

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
  focusSlot: { day: WeekDay; slot: MealSlot } | null;
  onFocusSlotRestored: () => void;
};

const slotDescriptions: Record<MealSlot, string> = {
  BREAKFAST: "Matin",
  LUNCH: "Midi",
  SNACK: "Pause",
  DINNER: "Soir"
};

const daysByJavaScriptIndex: WeekDay[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
];

export const WeeklyPlanner = ({
  plans,
  selectedPlan,
  selectedPlanId,
  meals,
  onSelectPlan,
  onCreatePlan,
  onDeletePlan,
  onSaveSlot,
  onDeleteSlot,
  focusSlot,
  onFocusSlotRestored
}: WeeklyPlannerProps) => {
  const [newPlanName, setNewPlanName] = useState("");
  const [planSearch, setPlanSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const planningShellRef = useRef<HTMLDivElement>(null);
  const autoFocusedPlanRef = useRef<string | null>(null);
  const currentDay = daysByJavaScriptIndex[new Date().getDay()];
  const normalizedPlanSearch = planSearch.trim().toLocaleLowerCase("fr");
  const filteredPlans = plans.filter((plan) =>
    plan.name.toLocaleLowerCase("fr").includes(normalizedPlanSearch)
  );

  const handlePlanSearch = (value: string) => {
    setPlanSearch(value);
    const exactPlan = plans.find(
      (plan) => plan.name.toLocaleLowerCase("fr") === value.trim().toLocaleLowerCase("fr")
    );

    if (exactPlan) {
      onSelectPlan(exactPlan.id);
    }
  };

  useEffect(() => {
    const shell = planningShellRef.current;

    if (!shell) {
      return;
    }

    if (focusSlot) {
      const focusedCell = shell.querySelector<HTMLElement>(
        `[data-slot-key="${focusSlot.day}-${focusSlot.slot}"]`
      );

      if (!focusedCell) {
        return;
      }

      const targetScrollLeft =
        focusedCell.offsetLeft -
        shell.clientWidth / 2 +
        focusedCell.offsetWidth / 2;

      shell.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth"
      });
      focusedCell.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
      });
      focusedCell.focus({ preventScroll: true });
      autoFocusedPlanRef.current = selectedPlanId;
      const clearFocusTimeout = window.setTimeout(onFocusSlotRestored, 1400);
      return () => window.clearTimeout(clearFocusTimeout);
    }

    if (autoFocusedPlanRef.current === selectedPlanId) {
      return;
    }

    autoFocusedPlanRef.current = selectedPlanId;

    if (shell.scrollWidth <= shell.clientWidth) {
      return;
    }

    const currentDayHeader = shell.querySelector<HTMLElement>(
      '[data-current-day="true"]'
    );

    if (!currentDayHeader) {
      return;
    }

    const targetScrollLeft =
      currentDayHeader.offsetLeft -
      shell.clientWidth / 2 +
      currentDayHeader.offsetWidth / 2;

    shell.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: "smooth"
    });
  }, [currentDay, focusSlot, onFocusSlotRestored, selectedPlanId]);

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
          <button
            type="submit"
            className="icon-button"
            aria-label="Creer le planning"
            title="Creer le planning"
            disabled={saving}
          >
            <AddIcon />
          </button>
        </form>

        <div className="inline-form">
          <SearchFilter
            label="Filtrer les plannings"
            options={plans.map((plan) => plan.name)}
            placeholder="Rechercher un planning..."
            value={planSearch}
            onChange={handlePlanSearch}
          />
          <select
            value={selectedPlanId}
            onChange={(event) => {
              onSelectPlan(event.target.value);
              setPlanSearch("");
            }}
          >
            {filteredPlans.length === 0 ? (
              <option value="">Aucun planning trouve</option>
            ) : (
              filteredPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))
            )}
          </select>
          {selectedPlan && (
            <button
              type="button"
              className="danger-button icon-button"
              aria-label={`Supprimer ${selectedPlan.name}`}
              title="Supprimer le planning"
              onClick={() => onDeletePlan(selectedPlan.id)}
            >
              <DeleteIcon />
            </button>
          )}
        </div>
      </section>

      {selectedPlan ? (
        <>
          <div className="planning-board-shell" ref={planningShellRef}>
            <div className="planning-board">
              <div className="planning-board-corner">
                <span>Planning rempli</span>
                <strong>{selectedPlan.plannedMeals.length} sur 28</strong>
                <small>créneaux</small>
              </div>
              {WEEK_DAYS.map((day) => {
                const plannedCount = selectedPlan.plannedMeals.filter(
                  (plannedMeal) => plannedMeal.day === day.value
                ).length;

                return (
                  <div
                    className={`planning-day-header${day.value === currentDay ? " is-current-day" : ""}`}
                    data-current-day={day.value === currentDay ? "true" : undefined}
                    key={day.value}
                  >
                    <div className="planning-day-name">
                      <strong>{day.label}</strong>
                      {day.value === currentDay && (
                        <span className="today-badge">Aujourd'hui</span>
                      )}
                    </div>
                    <span>{plannedCount} repas</span>
                  </div>
                );
              })}

              {MEAL_SLOTS.map((slot) => (
                <Fragment key={slot.value}>
                  <div
                    className={`planning-slot-label slot-theme-${slot.value.toLowerCase()}`}
                  >
                    <span className="planning-slot-marker" aria-hidden="true" />
                    <div>
                      <strong>{slot.label}</strong>
                      <span>{slotDescriptions[slot.value]}</span>
                    </div>
                  </div>
                  {WEEK_DAYS.map((day) => (
                    <div
                      className={`planning-cell slot-theme-${slot.value.toLowerCase()}${day.value === currentDay ? " is-current-day" : ""}${focusSlot?.day === day.value && focusSlot.slot === slot.value ? " is-restored-focus" : ""}`}
                      data-slot-key={`${day.value}-${slot.value}`}
                      key={`${day.value}-${slot.value}`}
                      tabIndex={-1}
                    >
                      <MealSlotSelector
                        day={day.value}
                        slot={slot.value}
                        slotLabel={slot.label}
                        meals={meals}
                        plannedMeal={selectedPlan.plannedMeals.find(
                          (plannedMeal) =>
                            plannedMeal.day === day.value &&
                            plannedMeal.slot === slot.value
                        )}
                        onSave={onSaveSlot}
                        onDelete={onDeleteSlot}
                      />
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>

        </>
      ) : (
        <p className="muted">Aucun planning.</p>
      )}
    </div>
  );
};
