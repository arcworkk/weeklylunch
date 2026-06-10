import { FormEvent, useEffect, useState } from "react";
import { useConfirm } from "../hooks/useConfirm";
import { IngredientInput } from "../types/ingredient";
import { Recipe, RecipeInput } from "../types/recipe";

type RecipeFormProps = {
  initialRecipe?: Recipe | null;
  loading?: boolean;
  onCancel?: () => void;
  onSubmit: (recipe: RecipeInput) => Promise<void>;
};

const emptyIngredient = (): IngredientInput => ({
  name: "",
  quantity: 0,
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
  loading = false,
  onCancel,
  onSubmit
}: RecipeFormProps) => {
  const [title, setTitle] = useState("");
  const [baseServings, setBaseServings] = useState(1);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(0);
  const [cookTimeMinutes, setCookTimeMinutes] = useState(0);
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    emptyIngredient()
  ]);
  const { confirm, confirmationModal } = useConfirm();

  useEffect(() => {
    if (initialRecipe) {
      setTitle(initialRecipe.title);
      setBaseServings(initialRecipe.baseServings);
      setPrepTimeMinutes(initialRecipe.prepTimeMinutes);
      setCookTimeMinutes(initialRecipe.cookTimeMinutes);
      setInstructions(initialRecipe.instructions);
      setIngredients(
        initialRecipe.ingredients.map(({ name, quantity, unit }) => ({
          name,
          quantity,
          unit
        }))
      );
      return;
    }

    setTitle("");
    setBaseServings(1);
    setPrepTimeMinutes(0);
    setCookTimeMinutes(0);
    setInstructions("");
    setIngredients([emptyIngredient()]);
  }, [initialRecipe]);

  const updateIngredient = (
    index: number,
    field: keyof IngredientInput,
    value: string
  ) => {
    setIngredients((current) =>
      current.map((ingredient, ingredientIndex) =>
        ingredientIndex === index
          ? {
              ...ingredient,
              [field]: field === "quantity" ? Number(value) : value
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({
      title,
      baseServings,
      prepTimeMinutes,
      cookTimeMinutes,
      instructions,
      ingredients
    });
  };

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <h2>{initialRecipe ? "Modifier la recette" : "Nouvelle recette"}</h2>
      </div>

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
            onChange={(event) => setBaseServings(Number(event.target.value))}
            required
          />
        </label>
        <label>
          Preparation
          <input
            type="number"
            min="0"
            value={prepTimeMinutes}
            onChange={(event) => setPrepTimeMinutes(Number(event.target.value))}
            required
          />
        </label>
        <label>
          Cuisson
          <input
            type="number"
            min="0"
            value={cookTimeMinutes}
            onChange={(event) => setCookTimeMinutes(Number(event.target.value))}
            required
          />
        </label>
      </div>

      <label>
        Instructions
        <textarea
          rows={5}
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
        />
      </label>

      <div className="subsection-heading">
        <h3>Ingredients</h3>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setIngredients((current) => [...current, emptyIngredient()])}
        >
          Ajouter
        </button>
      </div>

      <div className="ingredient-editor">
        {ingredients.map((ingredient, index) => (
          <div className="ingredient-row" key={index}>
            <input
              placeholder="Nom"
              value={ingredient.name}
              onChange={(event) => updateIngredient(index, "name", event.target.value)}
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Quantite"
              value={ingredient.quantity}
              onChange={(event) =>
                updateIngredient(index, "quantity", event.target.value)
              }
              required
            />
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
            <button
              type="button"
              className="danger-button"
              onClick={() => void removeIngredient(index)}
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="ghost-button" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
      {confirmationModal}
    </form>
  );
};
