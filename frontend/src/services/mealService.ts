import { apiRequest } from "./api";
import { Meal, MealInput } from "../types/meal";

export const mealService = {
  getMeals: () => apiRequest<Meal[]>("/meals"),
  getMeal: (id: string) => apiRequest<Meal>(`/meals/${id}`),
  createMeal: (meal: MealInput) =>
    apiRequest<Meal>("/meals", { method: "POST", body: meal }),
  updateMeal: (id: string, meal: MealInput) =>
    apiRequest<Meal>(`/meals/${id}`, { method: "PUT", body: meal }),
  deleteMeal: (id: string) =>
    apiRequest<void>(`/meals/${id}`, { method: "DELETE" })
};
