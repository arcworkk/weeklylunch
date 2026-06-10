import { Recipe } from "./recipe";

export interface Meal {
  id: string;
  userId: string;
  title: string;
  recipeId: string;
  recipe: Recipe;
  desiredServings: number;
  createdAt: string;
  updatedAt: string;
}

export interface MealInput {
  title: string;
  recipeId: string;
  desiredServings: number;
}
