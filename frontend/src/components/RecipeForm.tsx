import { FormEvent, useEffect, useRef, useState } from "react";
import { useConfirm } from "../hooks/useConfirm";
import { IngredientInput } from "../types/ingredient";
import { Recipe, RecipeAttachment, RecipeSubmission } from "../types/recipe";
import { AddIcon, DeleteIcon, ImageIcon, PaperclipIcon } from "./ActionIcons";
import { AttachmentLink } from "./AttachmentLink";
import { AuthenticatedImage } from "./AuthenticatedImage";

type RecipeFormProps = {
  initialRecipe?: Recipe | null;
  ingredientSuggestions?: IngredientSuggestion[];
  loading?: boolean;
  onCancel?: () => void;
  onSubmit: (recipe: RecipeSubmission) => Promise<void>;
};

type FormIngredient = Omit<IngredientInput, "quantity"> & {
  quantity: string;
};

export type IngredientSuggestion = {
  name: string;
  unit: string;
};

const emptyIngredient = (): FormIngredient => ({
  name: "",
  quantity: "",
  unit: "g"
});

const units = [
  "g",
  "kg",
  "ml",
  "L",
  "pièce",
  "pièces",
  "boîte",
  "boîtes",
  "cuillère à soupe",
  "cuillères à soupe",
  "cuillère à café",
  "cuillères à café"
];

export const RecipeForm = ({
  initialRecipe,
  ingredientSuggestions = [],
  loading = false,
  onCancel,
  onSubmit
}: RecipeFormProps) => {
  const [title, setTitle] = useState("");
  const [baseServings, setBaseServings] = useState("1");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState("0");
  const [cookTimeMinutes, setCookTimeMinutes] = useState("0");
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<FormIngredient[]>([
    emptyIngredient()
  ]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [retainedAttachments, setRetainedAttachments] = useState<RecipeAttachment[]>([]);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const firstIngredientInputRef = useRef<HTMLInputElement>(null);
  const { confirm, confirmationModal } = useConfirm();

  useEffect(() => {
    if (initialRecipe) {
      setTitle(initialRecipe.title);
      setBaseServings(String(initialRecipe.baseServings));
      setPrepTimeMinutes(String(initialRecipe.prepTimeMinutes));
      setCookTimeMinutes(String(initialRecipe.cookTimeMinutes));
      setInstructions(initialRecipe.instructions);
      setIngredients(
        initialRecipe.ingredients.map(({ name, quantity, unit }) => ({
          name,
          quantity: String(quantity),
          unit
        }))
      );
      setRetainedAttachments(initialRecipe.attachments ?? []);
      setThumbnail(null);
      setRemoveThumbnail(false);
      setAttachments([]);
      return;
    }

    setTitle("");
    setBaseServings("1");
    setPrepTimeMinutes("0");
    setCookTimeMinutes("0");
    setInstructions("");
    setIngredients([emptyIngredient()]);
    setRetainedAttachments([]);
    setThumbnail(null);
    setRemoveThumbnail(false);
    setAttachments([]);
  }, [initialRecipe]);

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailPreview(null);
      return;
    }

    const preview = URL.createObjectURL(thumbnail);
    setThumbnailPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [thumbnail]);

  const updateIngredient = (
    index: number,
    field: keyof FormIngredient,
    value: string
  ) => {
    setIngredients((current) =>
      current.map((ingredient, ingredientIndex) =>
        ingredientIndex === index
          ? {
              ...ingredient,
              [field]: value
            }
          : ingredient
      )
    );
  };

  const removeIngredient = async (index: number) => {
    if (ingredients.length === 1) {
      return;
    }

    const ingredient = ingredients[index];
    const confirmed = await confirm({
      title: "Supprimer l'ingrédient",
      message: `Supprimer "${ingredient?.name || "cet ingrédient"}" de la recette ?`,
      confirmLabel: "Supprimer"
    });

    if (!confirmed) {
      return;
    }

    setIngredients((current) =>
      current.filter((_, ingredientIndex) => ingredientIndex !== index)
    );
  };

  const addIngredient = () => {
    setIngredients((current) => [emptyIngredient(), ...current]);
    window.requestAnimationFrame(() => firstIngredientInputRef.current?.focus());
  };

  const getSuggestions = (value: string) => {
    const query = value.trim().toLocaleLowerCase("fr");

    if (query.length < 3) {
      return [];
    }

    return ingredientSuggestions
      .filter((suggestion) => {
        const name = suggestion.name.toLocaleLowerCase("fr");
        return name.includes(query) && name !== query;
      })
      .slice(0, 6);
  };

  const selectSuggestion = (index: number, suggestion: IngredientSuggestion) => {
    setIngredients((current) =>
      current.map((ingredient, ingredientIndex) =>
        ingredientIndex === index
          ? { ...ingredient, name: suggestion.name, unit: suggestion.unit }
          : ingredient
      )
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({
      recipe: {
        title,
        baseServings: Number(baseServings),
        prepTimeMinutes: Number(prepTimeMinutes),
        cookTimeMinutes: Number(cookTimeMinutes),
        instructions,
        ingredients: ingredients.map((ingredient) => ({
          ...ingredient,
          quantity: Number(ingredient.quantity)
        }))
      },
      thumbnail,
      removeThumbnail,
      attachments,
      retainedAttachmentIds: retainedAttachments.map((attachment) => attachment.id)
    });
  };

  const handleThumbnailChange = (file: File | undefined) => {
    if (!file) return;
    setThumbnail(file);
    setRemoveThumbnail(false);
  };

  const clearThumbnail = () => {
    setThumbnail(null);
    setRemoveThumbnail(true);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const addAttachments = (files: FileList | null) => {
    if (!files) return;
    const remaining = Math.max(0, 5 - retainedAttachments.length - attachments.length);
    setAttachments((current) => [...current, ...Array.from(files).slice(0, remaining)]);
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  };

  return (
    <form className="form-panel modal-form" onSubmit={handleSubmit}>
      <label>
        Titre
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>

      <div className="form-grid">
        <label>
          Personnes de reference
          <input
            type="number"
            min="1"
            value={baseServings}
            onChange={(event) => setBaseServings(event.target.value)}
            required
          />
        </label>
        <label>
          Preparation
          <input
            type="number"
            min="0"
            value={prepTimeMinutes}
            onChange={(event) => setPrepTimeMinutes(event.target.value)}
            required
          />
        </label>
        <label>
          Cuisson
          <input
            type="number"
            min="0"
            value={cookTimeMinutes}
            onChange={(event) => setCookTimeMinutes(event.target.value)}
            required
          />
        </label>
      </div>

      <section className="recipe-media-editor">
        <div className="recipe-media-editor-copy">
          <ImageIcon />
          <div>
            <strong>Miniature de la recette</strong>
            <span>Facultative, image de 10 Mo maximum.</span>
          </div>
        </div>
        <div className="recipe-thumbnail-editor">
          {thumbnailPreview ? (
            <img src={thumbnailPreview} alt="Nouvelle miniature" />
          ) : (
            <AuthenticatedImage
              src={!removeThumbnail ? initialRecipe?.thumbnailUrl ?? null : null}
              alt={initialRecipe?.title ?? "Recette sans image"}
            />
          )}
          <div className="recipe-media-actions">
            <input
              ref={thumbnailInputRef}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => handleThumbnailChange(event.target.files?.[0])}
            />
            <button type="button" className="secondary-button" onClick={() => thumbnailInputRef.current?.click()}>
              Choisir une image
            </button>
            {(thumbnailPreview || (!removeThumbnail && initialRecipe?.thumbnailUrl)) && (
              <button type="button" className="ghost-button" onClick={clearThumbnail}>
                Retirer
              </button>
            )}
          </div>
        </div>
      </section>

      <label className="instructions-field">
        <span className="instructions-field-heading">
          <span>Etapes de realisation</span>
          <button
            type="button"
            className="secondary-button icon-button"
            aria-label="Ajouter une piece jointe"
            title="Ajouter une piece jointe"
            disabled={retainedAttachments.length + attachments.length >= 5}
            onClick={() => attachmentInputRef.current?.click()}
          >
            <PaperclipIcon />
          </button>
        </span>
        <textarea
          rows={5}
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
        />
        <input
          ref={attachmentInputRef}
          className="visually-hidden"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => addAttachments(event.target.files)}
        />
      </label>

      {(retainedAttachments.length > 0 || attachments.length > 0) && (
        <div className="attachment-editor">
          {retainedAttachments.map((attachment) => (
            <div className="attachment-editor-item" key={attachment.id}>
              <AttachmentLink attachment={attachment} />
              <button
                type="button"
                className="danger-button icon-button"
                aria-label={`Retirer ${attachment.originalName}`}
                onClick={() => setRetainedAttachments((current) => current.filter((item) => item.id !== attachment.id))}
              >
                <DeleteIcon />
              </button>
            </div>
          ))}
          {attachments.map((attachment, index) => (
            <div className="attachment-editor-item" key={`${attachment.name}-${index}`}>
              <span className="pending-attachment"><PaperclipIcon />{attachment.name}</span>
              <button
                type="button"
                className="danger-button icon-button"
                aria-label={`Retirer ${attachment.name}`}
                onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                <DeleteIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="subsection-heading">
        <h3>Ingredients</h3>
        <button
          type="button"
          className="secondary-button icon-button"
          aria-label="Ajouter un ingredient"
          title="Ajouter un ingredient"
          onClick={addIngredient}
        >
          <AddIcon />
        </button>
      </div>

      <div className="ingredient-editor">
        {ingredients.map((ingredient, index) => {
          const suggestions = getSuggestions(ingredient.name);

          return (
          <article className="ingredient-card" key={index}>
            <div className="ingredient-card-heading">
              <div>
                <strong>Ingredient {index + 1}</strong>
                <span>{ingredient.name || "Nouvel ingredient"}</span>
              </div>
              <button
                type="button"
                className="danger-button icon-button"
                aria-label={`Supprimer ${ingredient.name || "cet ingredient"}`}
                title="Supprimer l'ingredient"
                disabled={ingredients.length === 1}
                onClick={() => void removeIngredient(index)}
              >
                <DeleteIcon />
              </button>
            </div>
            <div className="ingredient-card-fields">
              <label className="ingredient-name-field">
                Nom
                <input
                  ref={index === 0 ? firstIngredientInputRef : undefined}
                  autoComplete="off"
                  placeholder="Ex. tomates, riz, poulet..."
                  value={ingredient.name}
                  onChange={(event) => updateIngredient(index, "name", event.target.value)}
                  required
                />
                {suggestions.length > 0 && (
                  <div className="ingredient-suggestions" role="listbox" aria-label="Suggestions d'ingredients">
                    {suggestions.map((suggestion) => (
                      <button
                        type="button"
                        role="option"
                        key={`${suggestion.name}-${suggestion.unit}`}
                        onClick={() => selectSuggestion(index, suggestion)}
                      >
                        <span>{suggestion.name}</span>
                        <small>{suggestion.unit}</small>
                      </button>
                    ))}
                  </div>
                )}
              </label>
              <label>
                Quantite
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ingredient.quantity}
                  onChange={(event) =>
                    updateIngredient(index, "quantity", event.target.value)
                  }
                  required
                />
              </label>
              <label>
                Unite
                <select
                  value={ingredient.unit}
                  onChange={(event) => updateIngredient(index, "unit", event.target.value)}
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>
          );
        })}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="ghost-button" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button type="submit" disabled={loading}>
          {loading
            ? "Enregistrement..."
            : initialRecipe
              ? "Enregistrer les modifications"
              : "Creer la recette"}
        </button>
      </div>
      {confirmationModal}
    </form>
  );
};
