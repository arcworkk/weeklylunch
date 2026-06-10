import { Recipe } from "../types/recipe";
import { formatQuantity } from "../utils/formatQuantity";

type ScaledIngredientsProps = {
  recipe: Recipe;
  servings: number;
};

export const ScaledIngredients = ({ recipe, servings }: ScaledIngredientsProps) => {
  if (recipe.baseServings <= 0) {
    return <p className="error-text">Base de portions invalide.</p>;
  }

  const scaledIngredients = recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: (ingredient.quantity * servings) / recipe.baseServings
  }));

  return (
    <ul className="ingredient-list compact">
      {scaledIngredients.map((ingredient) => (
        <li key={ingredient.id ?? ingredient.name}>
          <span>{ingredient.name}</span>
          <strong>
            {formatQuantity(ingredient.quantity)} {ingredient.unit}
          </strong>
        </li>
      ))}
    </ul>
  );
};
