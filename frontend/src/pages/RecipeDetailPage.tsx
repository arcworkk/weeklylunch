import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AttachmentLink } from "../components/AttachmentLink";
import { AuthenticatedImage } from "../components/AuthenticatedImage";
import { IngredientList } from "../components/IngredientList";
import { recipeService } from "../services/recipeService";
import { Recipe } from "../types/recipe";
import { formatDuration } from "../utils/formatDuration";

export const RecipeDetailPage = () => {
  const { recipeId = "" } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void recipeService.getRecipe(recipeId).then(setRecipe).catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "Recette introuvable");
    });
  }, [recipeId]);

  if (error) return <main className="page"><p className="error-text">{error}</p></main>;
  if (!recipe) return <main className="page"><p className="muted">Chargement...</p></main>;

  return (
    <main className="page recipe-detail-page">
      <Link to="/recipes" className="recipe-back-link">← Retour aux recettes</Link>
      <article className="recipe-detail">
        <div className="recipe-detail-media"><AuthenticatedImage src={recipe.thumbnailUrl} alt={recipe.title} /></div>
        <div className="recipe-detail-intro">
          <span className="recipe-detail-eyebrow">Recette</span>
          <h1>{recipe.title}</h1>
          <div className="recipe-detail-stats">
            <span>{recipe.baseServings} portion{recipe.baseServings > 1 ? "s" : ""}</span>
            <span>Preparation {formatDuration(recipe.prepTimeMinutes)}</span>
            <span>Cuisson {formatDuration(recipe.cookTimeMinutes)}</span>
          </div>
        </div>
        <section className="recipe-detail-section">
          <h2>Ingredients</h2>
          <IngredientList ingredients={recipe.ingredients} />
        </section>
        <section className="recipe-detail-section">
          <h2>Etapes de realisation</h2>
          <p className="instructions">{recipe.instructions || "Aucune instruction renseignee."}</p>
          {recipe.attachments.length > 0 && (
            <div className="recipe-attachments">
              {recipe.attachments.map((attachment) => <AttachmentLink key={attachment.id} attachment={attachment} />)}
            </div>
          )}
        </section>
      </article>
    </main>
  );
};
