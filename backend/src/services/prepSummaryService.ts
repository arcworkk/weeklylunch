import { calculateScaledIngredients } from "../utils/calculateIngredients";
import { prisma } from "../utils/prisma";

const makeError = (message: string, status: number) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

const normalizeIngredientName = (name: string) => name.trim().toLowerCase();
const roundQuantity = (quantity: number) => Number(quantity.toFixed(4));

export const buildPrepSummary = async (weeklyPlanId: string, userId: string) => {
  const weeklyPlan = await prisma.weeklyPlan.findFirst({
    where: { id: weeklyPlanId, userId },
    include: {
      plannedMeals: {
        include: {
          meal: {
            include: {
              recipe: {
                include: {
                  ingredients: {
                    orderBy: { createdAt: "asc" }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!weeklyPlan) {
    throw makeError("Weekly plan not found", 404);
  }

  const groupedRecipes = new Map<
    string,
    {
      recipe: (typeof weeklyPlan.plannedMeals)[number]["meal"]["recipe"];
      totalServings: number;
    }
  >();

  for (const plannedMeal of weeklyPlan.plannedMeals) {
    const recipe = plannedMeal.meal.recipe;
    const current = groupedRecipes.get(recipe.id);

    if (current) {
      current.totalServings += plannedMeal.servings;
    } else {
      groupedRecipes.set(recipe.id, {
        recipe,
        totalServings: plannedMeal.servings
      });
    }
  }

  const shoppingListMap = new Map<
    string,
    {
      name: string;
      quantity: number;
      unit: string;
    }
  >();

  const recipesToPrepare = Array.from(groupedRecipes.values()).map(
    ({ recipe, totalServings }) => {
      const scaledIngredients = calculateScaledIngredients(recipe, totalServings);

      for (const ingredient of scaledIngredients) {
        const cleanName = ingredient.name.trim();
        const cleanUnit = ingredient.unit.trim();
        const key = `${normalizeIngredientName(cleanName)}__${cleanUnit}`;
        const existing = shoppingListMap.get(key);

        if (existing) {
          existing.quantity = roundQuantity(existing.quantity + ingredient.quantity);
        } else {
          shoppingListMap.set(key, {
            name: cleanName,
            quantity: ingredient.quantity,
            unit: cleanUnit
          });
        }
      }

      return {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        totalServings,
        scaledIngredients,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        totalTimeMinutes: recipe.prepTimeMinutes + recipe.cookTimeMinutes
      };
    }
  );

  const totalBatchCookingTimeMinutes = recipesToPrepare.reduce(
    (total, recipe) => total + recipe.totalTimeMinutes,
    0
  );

  const shoppingList = Array.from(shoppingListMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return {
    recipesToPrepare,
    shoppingList,
    totalBatchCookingTimeMinutes
  };
};
