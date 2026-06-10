import { apiRequest } from "./api";
import { PrepSummary } from "../types/prepSummary";
import {
  PlannedMeal,
  PlannedMealInput,
  WeeklyPlan,
  WeeklyPlanInput
} from "../types/weeklyPlan";

export const weeklyPlanService = {
  getWeeklyPlans: () => apiRequest<WeeklyPlan[]>("/weekly-plans"),
  getWeeklyPlan: (id: string) => apiRequest<WeeklyPlan>(`/weekly-plans/${id}`),
  createWeeklyPlan: (plan: WeeklyPlanInput) =>
    apiRequest<WeeklyPlan>("/weekly-plans", { method: "POST", body: plan }),
  updateWeeklyPlan: (id: string, plan: WeeklyPlanInput) =>
    apiRequest<WeeklyPlan>(`/weekly-plans/${id}`, {
      method: "PUT",
      body: plan
    }),
  deleteWeeklyPlan: (id: string) =>
    apiRequest<void>(`/weekly-plans/${id}`, { method: "DELETE" }),
  addPlannedMeal: (weeklyPlanId: string, plannedMeal: PlannedMealInput) =>
    apiRequest<PlannedMeal>(`/weekly-plans/${weeklyPlanId}/planned-meals`, {
      method: "POST",
      body: plannedMeal
    }),
  updatePlannedMeal: (id: string, plannedMeal: PlannedMealInput) =>
    apiRequest<PlannedMeal>(`/planned-meals/${id}`, {
      method: "PUT",
      body: plannedMeal
    }),
  deletePlannedMeal: (id: string) =>
    apiRequest<void>(`/planned-meals/${id}`, { method: "DELETE" }),
  getPrepSummary: (weeklyPlanId: string) =>
    apiRequest<PrepSummary>(`/weekly-plans/${weeklyPlanId}/prep-summary`)
};
