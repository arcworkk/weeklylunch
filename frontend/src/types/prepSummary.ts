import { Ingredient } from "./ingredient";

export interface RecipePrepSummary {
  recipeId: string;
  recipeTitle: string;
  totalServings: number;
  scaledIngredients: Ingredient[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
}

export interface PrepSummary {
  recipesToPrepare: RecipePrepSummary[];
  shoppingList: Ingredient[];
  totalBatchCookingTimeMinutes: number;
}
