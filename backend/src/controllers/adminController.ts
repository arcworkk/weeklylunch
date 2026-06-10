import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { getAdminEmail } from "../middlewares/adminMiddleware";
import { prisma } from "../utils/prisma";
import { removeStoredRecipeFiles } from "../utils/recipeMedia";

type ImportedIngredient = {
  name?: unknown;
  quantity?: unknown;
  unit?: unknown;
};

type ImportedRecipe = {
  userEmail?: unknown;
  title?: unknown;
  baseServings?: unknown;
  instructions?: unknown;
  prepTimeMinutes?: unknown;
  cookTimeMinutes?: unknown;
  ingredients?: unknown;
};

const makeError = (message: string, status: number) => {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { recipes: true, meals: true, weeklyPlans: true }
  }
};

const parseEmail = (value: unknown) => {
  const email = String(value ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    throw makeError("A valid email is required", 400);
  }

  return email;
};

const parsePassword = (value: unknown, required: boolean) => {
  const password = String(value ?? "");

  if (!password && !required) {
    return null;
  }

  if (password.length < 8) {
    throw makeError("Password must contain at least 8 characters", 400);
  }

  return password;
};

const parseImportedRecipe = (recipe: ImportedRecipe, index: number) => {
  const title = String(recipe.title ?? "").trim();
  const userEmail = parseEmail(recipe.userEmail);
  const baseServings = Number(recipe.baseServings);
  const prepTimeMinutes = Number(recipe.prepTimeMinutes);
  const cookTimeMinutes = Number(recipe.cookTimeMinutes);
  const instructions = String(recipe.instructions ?? "").trim();

  if (!title) {
    throw makeError(`Recipe ${index + 1}: title is required`, 400);
  }

  if (!Number.isInteger(baseServings) || baseServings <= 0) {
    throw makeError(`Recipe ${index + 1}: invalid baseServings`, 400);
  }

  if (!Number.isInteger(prepTimeMinutes) || prepTimeMinutes < 0) {
    throw makeError(`Recipe ${index + 1}: invalid prepTimeMinutes`, 400);
  }

  if (!Number.isInteger(cookTimeMinutes) || cookTimeMinutes < 0) {
    throw makeError(`Recipe ${index + 1}: invalid cookTimeMinutes`, 400);
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    throw makeError(`Recipe ${index + 1}: at least one ingredient is required`, 400);
  }

  const ingredients = (recipe.ingredients as ImportedIngredient[]).map(
    (ingredient, ingredientIndex) => {
      const name = String(ingredient.name ?? "").trim();
      const quantity = Number(ingredient.quantity);
      const unit = String(ingredient.unit ?? "").trim();

      if (!name || !unit || !Number.isFinite(quantity) || quantity < 0) {
        throw makeError(
          `Recipe ${index + 1}, ingredient ${ingredientIndex + 1}: invalid data`,
          400
        );
      }

      return { name, quantity, unit };
    }
  );

  return {
    userEmail,
    title,
    baseServings,
    prepTimeMinutes,
    cookTimeMinutes,
    instructions,
    ingredients
  };
};

export const getAdminOverview = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [users, recipes] = await Promise.all([
      prisma.user.count(),
      prisma.recipe.count()
    ]);

    res.json({ users, recipes, adminEmail: getAdminEmail() });
  } catch (error) {
    next(error);
  }
};

export const getAdminAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      throw makeError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true }
    });

    res.json({
      isAdmin: Boolean(
        user && user.email.toLowerCase() === getAdminEmail()
      )
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = parseEmail(req.body.email);
    const password = parsePassword(req.body.password, true)!;
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw makeError("Email is already used", 409);
    }

    const user = await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 10) },
      select: userSelect
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existingUser = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!existingUser) {
      throw makeError("User not found", 404);
    }

    const email = parseEmail(req.body.email);
    const password = parsePassword(req.body.password, false);
    const adminEmail = getAdminEmail();

    if (existingUser.email.toLowerCase() === adminEmail && email !== adminEmail) {
      throw makeError("The configured admin email cannot be changed here", 400);
    }

    const conflictingUser = await prisma.user.findFirst({
      where: { email, id: { not: existingUser.id } }
    });

    if (conflictingUser) {
      throw makeError("Email is already used", 409);
    }

    const data: Prisma.UserUpdateInput = { email };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data,
      select: userSelect
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!user) {
      throw makeError("User not found", 404);
    }

    if (user.email.toLowerCase() === getAdminEmail()) {
      throw makeError("The configured admin user cannot be deleted", 400);
    }

    const recipes = await prisma.recipe.findMany({
      where: { userId: user.id },
      select: {
        thumbnailStoredName: true,
        attachments: { select: { storedName: true } }
      }
    });

    await prisma.user.delete({ where: { id: user.id } });
    await removeStoredRecipeFiles(
      recipes.flatMap((recipe) => [
        recipe.thumbnailStoredName,
        ...recipe.attachments.map((attachment) => attachment.storedName)
      ])
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const exportRecipes = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        user: { select: { email: true } },
        ingredients: { orderBy: { createdAt: "asc" } }
      },
      orderBy: { createdAt: "asc" }
    });

    res.json({
      format: "weeklylunch-recipes",
      version: 1,
      exportedAt: new Date().toISOString(),
      recipes: recipes.map((recipe) => ({
        userEmail: recipe.user.email,
        title: recipe.title,
        baseServings: recipe.baseServings,
        instructions: recipe.instructions,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        ingredients: recipe.ingredients.map(({ name, quantity, unit }) => ({
          name,
          quantity,
          unit
        }))
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const importRecipes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as { format?: unknown; version?: unknown; recipes?: unknown };

    if (
      payload.format !== "weeklylunch-recipes" ||
      payload.version !== 1 ||
      !Array.isArray(payload.recipes)
    ) {
      throw makeError("Invalid WeeklyLunch recipe export", 400);
    }

    if (payload.recipes.length > 1000) {
      throw makeError("A maximum of 1000 recipes can be imported at once", 400);
    }

    const recipes = (payload.recipes as ImportedRecipe[]).map(parseImportedRecipe);
    const emails = [...new Set(recipes.map((recipe) => recipe.userEmail))];
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true }
    });
    const userIdsByEmail = new Map(users.map((user) => [user.email, user.id]));
    const missingEmails = emails.filter((email) => !userIdsByEmail.has(email));

    if (missingEmails.length > 0) {
      throw makeError(`Unknown recipe owner(s): ${missingEmails.join(", ")}`, 400);
    }

    await prisma.$transaction(async (tx) => {
      for (const recipe of recipes) {
        await tx.recipe.create({
          data: {
            userId: userIdsByEmail.get(recipe.userEmail)!,
            title: recipe.title,
            baseServings: recipe.baseServings,
            instructions: recipe.instructions,
            prepTimeMinutes: recipe.prepTimeMinutes,
            cookTimeMinutes: recipe.cookTimeMinutes,
            ingredients: { create: recipe.ingredients }
          }
        });
      }
    });

    res.status(201).json({ imported: recipes.length });
  } catch (error) {
    next(error);
  }
};
