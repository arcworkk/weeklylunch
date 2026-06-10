type IngredientLike = {
  name: string;
  quantity: number;
  unit: string;
};

type RecipeLike = {
  baseServings: number;
  ingredients: IngredientLike[];
};

export const calculateScaledIngredients = (
  recipe: RecipeLike,
  desiredServings: number
) => {
  if (recipe.baseServings <= 0) {
    throw new Error("baseServings must be greater than 0 to scale ingredients");
  }

  if (desiredServings < 0) {
    throw new Error("desiredServings must be greater than or equal to 0");
  }

  return recipe.ingredients.map((ingredient) => ({
    name: ingredient.name,
    quantity: Number(
      ((ingredient.quantity * desiredServings) / recipe.baseServings).toFixed(4)
    ),
    unit: ingredient.unit
  }));
};
