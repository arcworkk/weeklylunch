import { useEffect, useState } from "react";
import { ShoppingList } from "../components/ShoppingList";
import { WeeklyPrepSummary } from "../components/WeeklyPrepSummary";
import { weeklyPlanService } from "../services/weeklyPlanService";
import { PrepSummary } from "../types/prepSummary";
import { WeeklyPlan } from "../types/weeklyPlan";

export const PrepSummaryPage = () => {
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [summary, setSummary] = useState<PrepSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      setError("");

      try {
        const nextPlans = await weeklyPlanService.getWeeklyPlans();
        setPlans(nextPlans);
        setSelectedPlanId(nextPlans[0]?.id ?? "");
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    void loadPlans();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      if (!selectedPlanId) {
        setSummary(null);
        return;
      }

      setLoading(true);
      setError("");

      try {
        setSummary(await weeklyPlanService.getPrepSummary(selectedPlanId));
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, [selectedPlanId]);

  return (
    <main className="page">
      <div className="page-heading">
        <h1>Preparation / Liste de courses</h1>
      </div>
      {error && <p className="error-text">{error}</p>}

      <section className="panel planner-toolbar">
        <label>
          Planning
          <select
            value={selectedPlanId}
            onChange={(event) => setSelectedPlanId(event.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loading ? (
        <p className="muted">Chargement...</p>
      ) : (
        <div className="summary-layout">
          <WeeklyPrepSummary summary={summary} />
          <ShoppingList items={summary?.shoppingList ?? []} />
        </div>
      )}
    </main>
  );
};
