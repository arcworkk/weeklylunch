import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useConfirm } from "../hooks/useConfirm";
import { IngredientInput } from "../types/ingredient";
import { Recipe, RecipeAttachment, RecipeSubmission } from "../types/recipe";
import { AddIcon, CollapseIcon, DeleteIcon, ExpandIcon, ImageIcon, PaperclipIcon } from "./ActionIcons";
import { AttachmentPreview } from "./AttachmentPreview";
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
  const [thumbnailError, setThumbnailError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const thumbnailInputId = useId();
  const instructionsInputId = useId();
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
      setThumbnailError("");
      setAttachmentError("");
      setInstructionsExpanded(false);
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
    setThumbnailError("");
    setAttachmentError("");
    setInstructionsExpanded(false);
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

    const allowedTypes = new Set([
      "image/jpeg",
      "image/jpg",
      "image/pjpeg",
      "image/png",
      "image/x-png",
      "image/webp",
      "image/gif",
      "image/avif"
    ]);
    const hasAllowedExtension = /\.(?:avif|gif|jpe?g|png|webp)$/i.test(file.name);

    if (!allowedTypes.has(file.type) && !hasAllowedExtension) {
      setThumbnailError("Utilisez une image JPG, PNG, WebP, GIF ou AVIF.");
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setThumbnailError("L'image depasse la taille maximale de 10 Mo.");
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      return;
    }

    setThumbnailError("");
    setThumbnail(file);
    setRemoveThumbnail(false);
  };

  const clearThumbnail = () => {
    setThumbnail(null);
    setRemoveThumbnail(true);
    setThumbnailError("");
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const addAttachments = (files: FileList | null) => {
    if (!files) return;

    const allowedTypes = new Set([
      "image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/x-png",
      "image/webp", "image/gif", "image/avif", "application/pdf", "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]);
    const allowedExtension = /\.(?:avif|docx|gif|jpe?g|pdf|png|txt|webp)$/i;
    const selectedFiles = Array.from(files);
    const invalidFile = selectedFiles.find((file) =>
      (!allowedTypes.has(file.type) && !allowedExtension.test(file.name)) ||
      file.size > 10 * 1024 * 1024
    );

    if (invalidFile) {
      setAttachmentError(
        invalidFile.size > 10 * 1024 * 1024
          ? `Le fichier ${invalidFile.name} depasse 10 Mo.`
          : `Le format de ${invalidFile.name} n'est pas pris en charge.`
      );
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
      return;
    }

    const remaining = Math.max(0, 5 - retainedAttachments.length - attachments.length);
    if (selectedFiles.length > remaining) {
      setAttachmentError("Une recette peut contenir au maximum 5 pieces jointes.");
    } else {
      setAttachmentError("");
    }
    setAttachments((current) => [...current, ...selectedFiles.slice(0, remaining)]);
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
            inputMode="numeric"
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
            inputMode="numeric"
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
            inputMode="numeric"
            min="0"
            value={cookTimeMinutes}
            onChange={(event) => setCookTimeMinutes(event.target.value)}
            required
          />
        </label>
      </div>

      <section className="recipe-thumbnail-section">
        <input
          ref={thumbnailInputRef}
          id={thumbnailInputId}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.avif"
          onChange={(event) => handleThumbnailChange(event.target.files?.[0])}
        />
        <label className="recipe-media-editor recipe-media-picker" htmlFor={thumbnailInputId}>
          <div className="recipe-thumbnail-preview">
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="Nouvelle miniature" />
            ) : (
              <AuthenticatedImage
                src={!removeThumbnail ? initialRecipe?.thumbnailUrl ?? null : null}
                alt={initialRecipe?.title ?? "Recette sans image"}
              />
            )}
          </div>
          <div className="recipe-media-picker-content">
            <div className="recipe-media-editor-copy">
              <ImageIcon />
              <div>
                <strong>Miniature de la recette</strong>
                <span>Facultative, image de 10 Mo maximum.</span>
              </div>
            </div>
            <div className="recipe-media-picker-copy">
              <strong>{thumbnail?.name ?? (initialRecipe?.thumbnailUrl && !removeThumbnail ? "Image enregistree" : "Ajouter une image")}</strong>
              <span>Appuyez ici pour choisir une photo ou un fichier image.</span>
            </div>
          </div>
        </label>
        {thumbnailError && <p className="error-text recipe-thumbnail-error">{thumbnailError}</p>}
        {(thumbnailPreview || (!removeThumbnail && initialRecipe?.thumbnailUrl)) && (
          <button type="button" className="ghost-button recipe-thumbnail-remove" onClick={clearThumbnail}>
            Retirer la miniature
          </button>
        )}
      </section>

      <section className="instructions-field">
        <div className="instructions-field-heading">
          <label htmlFor={instructionsInputId}>Etapes de realisation</label>
          <div className="instructions-field-actions">
            <button
              type="button"
              className="ghost-button icon-button"
              aria-label={instructionsExpanded ? "Reduire la zone des etapes" : "Agrandir la zone des etapes"}
              title={instructionsExpanded ? "Reduire" : "Agrandir"}
              aria-pressed={instructionsExpanded}
              onClick={() => setInstructionsExpanded((current) => !current)}
            >
              {instructionsExpanded ? <CollapseIcon /> : <ExpandIcon />}
            </button>
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
          </div>
        </div>
        <textarea
          id={instructionsInputId}
          className={`recipe-instructions-textarea${instructionsExpanded ? " is-expanded" : ""}`}
          rows={8}
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
        />
        <input
          ref={attachmentInputRef}
          className="visually-hidden"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.jpg,.jpeg,.png,.webp,.gif,.avif,.pdf,.txt,.docx"
          onChange={(event) => addAttachments(event.target.files)}
        />
        {attachmentError && <p className="error-text attachment-error">{attachmentError}</p>}
      </section>

      {(retainedAttachments.length > 0 || attachments.length > 0) && (
        <div className="attachment-preview-grid">
          {retainedAttachments.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => setRetainedAttachments((current) => current.filter((item) => item.id !== attachment.id))}
            />
          ))}
          {attachments.map((attachment, index) => (
            <AttachmentPreview
              key={`${attachment.name}-${index}`}
              file={attachment}
              onRemove={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
            />
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
                  inputMode="decimal"
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
