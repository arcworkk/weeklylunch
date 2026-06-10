export interface Ingredient {
  id?: string;
  recipeId?: string;
  name: string;
  quantity: number;
  unit: string;
  createdAt?: string;
  updatedAt?: string;
}

export type IngredientInput = Pick<Ingredient, "name" | "quantity" | "unit">;
