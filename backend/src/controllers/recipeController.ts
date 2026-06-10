import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma";

type IngredientInput = {
  name?: string;
  quantity?: number | string;
  unit?: string;
};

const makeError = (message: string, status: number) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

const requireUserId = (req: Request) => {
  if (!req.user?.userId) {
    throw makeError("Unauthorized", 401);
  }

  return req.user.userId;
};

const parseRecipeBody = (body: Record<string, unknown>) => {
  const title = String(body.title ?? "").trim();
  const baseServings = Number(body.baseServings);
  const prepTimeMinutes = Number(body.prepTimeMinutes);
  const cookTimeMinutes = Number(body.cookTimeMinutes);
  const instructions = String(body.instructions ?? "").trim();
  const ingredients = body.ingredients as IngredientInput[];

  if (!title) {
    throw makeError("Recipe title is required", 400);
  }

  if (!Number.isInteger(baseServings) || baseServings <= 0) {
    throw makeError("baseServings must be a positive integer", 400);
  }

  if (!Number.isInteger(prepTimeMinutes) || prepTimeMinutes < 0) {
    throw makeError("prepTimeMinutes must be a positive integer or zero", 400);
  }

  if (!Number.isInteger(cookTimeMinutes) || cookTimeMinutes < 0) {
    throw makeError("cookTimeMinutes must be a positive integer or zero", 400);
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw makeError("At least one ingredient is required", 400);
  }

  const cleanIngredients = ingredients.map((ingredient) => {
    const name = String(ingredient.name ?? "").trim();
    const unit = String(ingredient.unit ?? "").trim();
    const quantity = Number(ingredient.quantity);

    if (!name || !unit || !Number.isFinite(quantity) || quantity < 0) {
      throw makeError("Each ingredient needs a name, quantity and unit", 400);
    }

    return { name, quantity, unit };
  });

  return {
    title,
    baseServings,
    prepTimeMinutes,
    cookTimeMinutes,
    instructions,
    ingredients: cleanIngredients
  };
};

const recipeInclude = {
  ingredients: {
    orderBy: { createdAt: "asc" as const }
  }
};

export const getRecipes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const recipes = await prisma.recipe.findMany({
      where: { userId },
      include: recipeInclude,
      orderBy: { createdAt: "desc" }
    });

    res.json(recipes);
  } catch (error) {
    next(error);
  }
};

export const getRecipe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId },
      include: recipeInclude
    });

    if (!recipe) {
      throw makeError("Recipe not found", 404);
    }

    res.json(recipe);
  } catch (error) {
    next(error);
  }
};

export const createRecipe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const data = parseRecipeBody(req.body);
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: data.title,
        baseServings: data.baseServings,
        instructions: data.instructions,
        prepTimeMinutes: data.prepTimeMinutes,
        cookTimeMinutes: data.cookTimeMinutes,
        ingredients: { create: data.ingredients }
      },
      include: recipeInclude
    });

    res.status(201).json(recipe);
  } catch (error) {
    next(error);
  }
};

export const updateRecipe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!recipe) {
      throw makeError("Recipe not found", 404);
    }

    const data = parseRecipeBody(req.body);
    const updatedRecipe = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.ingredient.deleteMany({ where: { recipeId: recipe.id } });

      return tx.recipe.update({
        where: { id: recipe.id },
        data: {
          title: data.title,
          baseServings: data.baseServings,
          instructions: data.instructions,
          prepTimeMinutes: data.prepTimeMinutes,
          cookTimeMinutes: data.cookTimeMinutes,
          ingredients: { create: data.ingredients }
        },
        include: recipeInclude
      });
    });

    res.json(updatedRecipe);
  } catch (error) {
    next(error);
  }
};

export const deleteRecipe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!recipe) {
      throw makeError("Recipe not found", 404);
    }

    await prisma.recipe.delete({ where: { id: recipe.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
