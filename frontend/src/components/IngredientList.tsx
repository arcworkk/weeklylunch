import { Ingredient } from "../types/ingredient";
import { formatQuantity } from "../utils/formatQuantity";

type IngredientListProps = {
  ingredients: Ingredient[];
};

export const IngredientList = ({ ingredients }: IngredientListProps) => {
  if (ingredients.length === 0) {
    return <p className="muted">Aucun ingredient.</p>;
  }

  return (
    <ul className="ingredient-list">
      {ingredients.map((ingredient, index) => (
        <li key={ingredient.id ?? `${ingredient.name}-${index}`}>
          <span>{ingredient.name}</span>
          <strong>
            {formatQuantity(ingredient.quantity)} {ingredient.unit}
          </strong>
        </li>
      ))}
    </ul>
  );
};
