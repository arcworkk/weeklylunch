import { useEffect, useState } from "react";
import { WeeklyPlanner } from "../components/WeeklyPlanner";
import { useConfirm } from "../hooks/useConfirm";
import { mealService } from "../services/mealService";
import { weeklyPlanService } from "../services/weeklyPlanService";
import { Meal } from "../types/meal";
import {
  MealSlot,
  PlannedMealInput,
  WeekDay,
  WeeklyPlan
} from "../types/weeklyPlan";

export const WeeklyPlannerPage = () => {
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { confirm, confirmationModal } = useConfirm();

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  const loadData = async (preferredPlanId?: string) => {
    setLoading(true);
    setError("");

    try {
      const [nextPlans, nextMeals] = await Promise.all([
        weeklyPlanService.getWeeklyPlans(),
        mealService.getMeals()
      ]);
      setPlans(nextPlans);
      setMeals(nextMeals);

      const nextSelectedId =
        preferredPlanId && nextPlans.some((plan) => plan.id === preferredPlanId)
          ? preferredPlanId
          : nextPlans[0]?.id ?? "";
      setSelectedPlanId(nextSelectedId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreatePlan = async (name: string) => {
    const plan = await weeklyPlanService.createWeeklyPlan({ name });
    await loadData(plan.id);
  };

  const handleDeletePlan = async (id: string) => {
    const plan = plans.find((currentPlan) => currentPlan.id === id);
    const confirmed = await confirm({
      title: "Supprimer le planning",
      message: `Supprimer "${plan?.name ?? "ce planning"}" et tous ses créneaux ?`,
      confirmLabel: "Supprimer"
    });

    if (!confirmed) {
      return;
    }

    await weeklyPlanService.deleteWeeklyPlan(id);
    await loadData();
  };

  const handleSaveSlot = async (
    day: WeekDay,
    slot: MealSlot,
    mealId: string,
    servings: number
  ) => {
    if (!selectedPlan) {
      return;
    }

    const payload: PlannedMealInput = { day, slot, mealId, servings };
    const existingSlot = selectedPlan.plannedMeals.find(
      (plannedMeal) => plannedMeal.day === day && plannedMeal.slot === slot
    );

    if (existingSlot) {
      await weeklyPlanService.updatePlannedMeal(existingSlot.id, payload);
    } else {
      await weeklyPlanService.addPlannedMeal(selectedPlan.id, payload);
    }

    await loadData(selectedPlan.id);
  };

  const handleDeleteSlot = async (plannedMealId: string) => {
    if (!selectedPlan) {
      return;
    }

    const plannedMeal = selectedPlan.plannedMeals.find(
      (currentPlannedMeal) => currentPlannedMeal.id === plannedMealId
    );
    const confirmed = await confirm({
      title: "Supprimer le créneau",
      message: plannedMeal
        ? `Retirer "${plannedMeal.meal.title}" de ce créneau ?`
        : "Supprimer ce repas planifié ?",
      confirmLabel: "Supprimer"
    });

    if (!confirmed) {
      return;
    }

    await weeklyPlanService.deletePlannedMeal(plannedMealId);
    await loadData(selectedPlan.id);
  };

  return (
    <main className="page wide-page">
      <div className="page-heading">
        <h1>Planning semaine</h1>
      </div>
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="muted">Chargement...</p>
      ) : (
        <WeeklyPlanner
          plans={plans}
          selectedPlan={selectedPlan}
          selectedPlanId={selectedPlanId}
          meals={meals}
          onSelectPlan={setSelectedPlanId}
          onCreatePlan={handleCreatePlan}
          onDeletePlan={handleDeletePlan}
          onSaveSlot={handleSaveSlot}
          onDeleteSlot={handleDeleteSlot}
        />
      )}
      {confirmationModal}
    </main>
  );
};
