import { Link } from "react-router-dom";
import { Recipe } from "../types/recipe";
import { formatDuration } from "../utils/formatDuration";
import { DeleteIcon, PaperclipIcon } from "./ActionIcons";
import { AuthenticatedImage } from "./AuthenticatedImage";
import { EditIcon } from "./EditIcon";

type RecipeCardProps = {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
};

export const RecipeCard = ({ recipe, onEdit, onDelete }: RecipeCardProps) => (
  <article className="recipe-card">
    <Link className="recipe-card-media" to={`/recipes/${recipe.id}`} aria-label={`Voir ${recipe.title}`}>
      <AuthenticatedImage src={recipe.thumbnailUrl} alt={recipe.title} />
    </Link>
    <div className="recipe-card-body">
      <div className="recipe-card-heading">
        <div>
          <Link to={`/recipes/${recipe.id}`} className="recipe-card-title">
            {recipe.title}
          </Link>
          <p className="muted">
            {recipe.baseServings} portion{recipe.baseServings > 1 ? "s" : ""} · {formatDuration(recipe.prepTimeMinutes + recipe.cookTimeMinutes)}
          </p>
        </div>
      </div>
      <div className="recipe-card-tags">
        {recipe.ingredients.slice(0, 4).map((ingredient) => (
          <span key={ingredient.id}>{ingredient.name}</span>
        ))}
        {recipe.ingredients.length > 4 && <span>+{recipe.ingredients.length - 4}</span>}
      </div>
      <div className="recipe-card-footer">
        {recipe.attachments.length > 0 ? (
          <span className="recipe-attachment-count"><PaperclipIcon />{recipe.attachments.length} piece{recipe.attachments.length > 1 ? "s" : ""} jointe{recipe.attachments.length > 1 ? "s" : ""}</span>
        ) : <span />}
        <div className="card-actions">
          <button type="button" className="secondary-button icon-button" aria-label={`Modifier ${recipe.title}`} title="Modifier la recette" onClick={() => onEdit(recipe)}>
            <EditIcon />
          </button>
          <button type="button" className="danger-button icon-button" aria-label={`Supprimer ${recipe.title}`} title="Supprimer la recette" onClick={() => onDelete(recipe)}>
            <DeleteIcon />
          </button>
        </div>
      </div>
    </div>
  </article>
);
