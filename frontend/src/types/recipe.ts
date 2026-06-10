import { Ingredient, IngredientInput } from "./ingredient";

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  baseServings: number;
  instructions: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: Ingredient[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeInput {
  title: string;
  baseServings: number;
  instructions: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: IngredientInput[];
}
