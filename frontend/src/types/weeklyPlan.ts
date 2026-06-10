import { Meal } from "./meal";

export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type MealSlot = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export const WEEK_DAYS: { value: WeekDay; label: string }[] = [
  { value: "MONDAY", label: "Lundi" },
  { value: "TUESDAY", label: "Mardi" },
  { value: "WEDNESDAY", label: "Mercredi" },
  { value: "THURSDAY", label: "Jeudi" },
  { value: "FRIDAY", label: "Vendredi" },
  { value: "SATURDAY", label: "Samedi" },
  { value: "SUNDAY", label: "Dimanche" }
];

export const MEAL_SLOTS: { value: MealSlot; label: string }[] = [
  { value: "BREAKFAST", label: "Petit-déjeuner" },
  { value: "LUNCH", label: "Déjeuner" },
  { value: "SNACK", label: "Collation" },
  { value: "DINNER", label: "Dîner" }
];

export interface PlannedMeal {
  id: string;
  weeklyPlanId: string;
  mealId: string;
  meal: Meal;
  day: WeekDay;
  slot: MealSlot;
  servings: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  name: string;
  plannedMeals: PlannedMeal[];
  createdAt: string;
  updatedAt: string;
}

export interface PlannedMealInput {
  mealId: string;
  day: WeekDay;
  slot: MealSlot;
  servings: number;
}

export interface WeeklyPlanInput {
  name: string;
}
