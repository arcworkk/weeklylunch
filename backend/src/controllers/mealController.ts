import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { recipeInclude, serializeRecipe } from "../utils/recipeMedia";

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

const mealInclude = {
  recipe: {
    include: recipeInclude
  }
};

type MealWithRecipe = Prisma.MealGetPayload<{ include: typeof mealInclude }>;

const serializeMeal = (meal: MealWithRecipe) => ({
  ...meal,
  recipe: serializeRecipe(meal.recipe)
});

const parseMealBody = (body: Record<string, unknown>) => {
  const title = String(body.title ?? "").trim();
  const recipeId = String(body.recipeId ?? "").trim();
  const desiredServings = Number(body.desiredServings);

  if (!title) {
    throw makeError("Meal title is required", 400);
  }

  if (!recipeId) {
    throw makeError("recipeId is required", 400);
  }

  if (!Number.isInteger(desiredServings) || desiredServings <= 0) {
    throw makeError("desiredServings must be a positive integer", 400);
  }

  return { title, recipeId, desiredServings };
};

export const getMeals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const meals = await prisma.meal.findMany({
      where: { userId },
      include: mealInclude,
      orderBy: { createdAt: "desc" }
    });

    res.json(meals.map(serializeMeal));
  } catch (error) {
    next(error);
  }
};

export const getMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const meal = await prisma.meal.findFirst({
      where: { id: req.params.id, userId },
      include: mealInclude
    });

    if (!meal) {
      throw makeError("Meal not found", 404);
    }

    res.json(serializeMeal(meal));
  } catch (error) {
    next(error);
  }
};

export const createMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const data = parseMealBody(req.body);
    const recipe = await prisma.recipe.findFirst({
      where: { id: data.recipeId, userId }
    });

    if (!recipe) {
      throw makeError("Recipe not found", 404);
    }

    const meal = await prisma.meal.create({
      data: { ...data, userId },
      include: mealInclude
    });

    res.status(201).json(serializeMeal(meal));
  } catch (error) {
    next(error);
  }
};

export const updateMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const existingMeal = await prisma.meal.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!existingMeal) {
      throw makeError("Meal not found", 404);
    }

    const data = parseMealBody(req.body);
    const recipe = await prisma.recipe.findFirst({
      where: { id: data.recipeId, userId }
    });

    if (!recipe) {
      throw makeError("Recipe not found", 404);
    }

    const meal = await prisma.meal.update({
      where: { id: existingMeal.id },
      data,
      include: mealInclude
    });

    res.json(serializeMeal(meal));
  } catch (error) {
    next(error);
  }
};

export const deleteMeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const meal = await prisma.meal.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!meal) {
      throw makeError("Meal not found", 404);
    }

    await prisma.meal.delete({ where: { id: meal.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
