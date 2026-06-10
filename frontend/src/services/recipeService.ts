import { apiRequest } from "./api";
import { Recipe, RecipeInput } from "../types/recipe";

export const recipeService = {
  getRecipes: () => apiRequest<Recipe[]>("/recipes"),
  getRecipe: (id: string) => apiRequest<Recipe>(`/recipes/${id}`),
  createRecipe: (recipe: RecipeInput) =>
    apiRequest<Recipe>("/recipes", { method: "POST", body: recipe }),
  updateRecipe: (id: string, recipe: RecipeInput) =>
    apiRequest<Recipe>(`/recipes/${id}`, { method: "PUT", body: recipe }),
  deleteRecipe: (id: string) =>
    apiRequest<void>(`/recipes/${id}`, { method: "DELETE" })
};
