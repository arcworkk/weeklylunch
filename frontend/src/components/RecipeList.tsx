import { Recipe } from "../types/recipe";
import { RecipeCard } from "./RecipeCard";

type RecipeListProps = {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
};

export const RecipeList = ({ recipes, onEdit, onDelete }: RecipeListProps) => {
  if (recipes.length === 0) {
    return <p className="muted">Aucune recette.</p>;
  }

  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
