import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import {
  getStoredFilePath,
  recipeInclude,
  removeStoredRecipeFiles,
  serializeRecipe
} from "../utils/recipeMedia";

type IngredientInput = {
  name?: string;
  quantity?: number | string;
  unit?: string;
};

type RecipePayload = Record<string, unknown> & {
  retainedAttachmentIds?: unknown;
  removeThumbnail?: unknown;
};

type RecipeFiles = {
  thumbnail?: Express.Multer.File[];
  attachments?: Express.Multer.File[];
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

const parseRequestPayload = (req: Request): RecipePayload => {
  if (typeof req.body.payload !== "string") {
    return req.body;
  }

  try {
    return JSON.parse(req.body.payload) as RecipePayload;
  } catch {
    throw makeError("Invalid recipe payload", 400);
  }
};

const parseRecipeBody = (body: RecipePayload) => {
  const title = String(body.title ?? "").trim();
  const baseServings = Number(body.baseServings);
  const prepTimeMinutes = Number(body.prepTimeMinutes);
  const cookTimeMinutes = Number(body.cookTimeMinutes);
  const instructions = String(body.instructions ?? "").trim();
  const ingredients = body.ingredients as IngredientInput[];
  const retainedAttachmentIds = Array.isArray(body.retainedAttachmentIds)
    ? body.retainedAttachmentIds.map(String)
    : [];

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
    ingredients: cleanIngredients,
    retainedAttachmentIds,
    removeThumbnail: body.removeThumbnail === true
  };
};

const getFiles = (req: Request) => (req.files ?? {}) as RecipeFiles;

const attachmentCreateData = (files: Express.Multer.File[] = []) =>
  files.map((file) => ({
    storedName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  }));

export const getRecipes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const recipes = await prisma.recipe.findMany({
      where: { userId },
      include: recipeInclude,
      orderBy: { createdAt: "desc" }
    });

    res.json(recipes.map(serializeRecipe));
  } catch (error) {
    next(error);
  }
};

export const getRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId },
      include: recipeInclude
    });

    if (!recipe) {
      throw makeError("Recipe not found", 404);
    }

    res.json(serializeRecipe(recipe));
  } catch (error) {
    next(error);
  }
};

export const createRecipe = async (req: Request, res: Response, next: NextFunction) => {
  const files = getFiles(req);

  try {
    const userId = requireUserId(req);
    const data = parseRecipeBody(parseRequestPayload(req));
    const thumbnail = files.thumbnail?.[0];
    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: data.title,
        baseServings: data.baseServings,
        instructions: data.instructions,
        prepTimeMinutes: data.prepTimeMinutes,
        cookTimeMinutes: data.cookTimeMinutes,
        thumbnailStoredName: thumbnail?.filename,
        thumbnailOriginalName: thumbnail?.originalname,
        thumbnailMimeType: thumbnail?.mimetype,
        ingredients: { create: data.ingredients },
        attachments: { create: attachmentCreateData(files.attachments) }
      },
      include: recipeInclude
    });

    res.status(201).json(serializeRecipe(recipe));
  } catch (error) {
    await removeStoredRecipeFiles([
      ...(files.thumbnail ?? []).map((file) => file.filename),
      ...(files.attachments ?? []).map((file) => file.filename)
    ]);
    next(error);
  }
};

export const updateRecipe = async (req: Request, res: Response, next: NextFunction) => {
  const files = getFiles(req);

  try {
    const userId = requireUserId(req);
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId },
      include: recipeInclude
    });

    if (!recipe) {
      throw makeError("Recipe not found", 404);
    }

    const data = parseRecipeBody(parseRequestPayload(req));
    const retainedIds = new Set(data.retainedAttachmentIds);
    const removedAttachments = recipe.attachments.filter(
      (attachment) => !retainedIds.has(attachment.id)
    );
    const thumbnail = files.thumbnail?.[0];
    const removeExistingThumbnail = Boolean(thumbnail) || data.removeThumbnail;

    const updatedRecipe = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.ingredient.deleteMany({ where: { recipeId: recipe.id } });
      await tx.recipeAttachment.deleteMany({
        where: {
          recipeId: recipe.id,
          id: { in: removedAttachments.map((attachment) => attachment.id) }
        }
      });

      return tx.recipe.update({
        where: { id: recipe.id },
        data: {
          title: data.title,
          baseServings: data.baseServings,
          instructions: data.instructions,
          prepTimeMinutes: data.prepTimeMinutes,
          cookTimeMinutes: data.cookTimeMinutes,
          ...(removeExistingThumbnail
            ? {
                thumbnailStoredName: thumbnail?.filename ?? null,
                thumbnailOriginalName: thumbnail?.originalname ?? null,
                thumbnailMimeType: thumbnail?.mimetype ?? null
              }
            : {}),
          ingredients: { create: data.ingredients },
          attachments: { create: attachmentCreateData(files.attachments) }
        },
        include: recipeInclude
      });
    });

    await removeStoredRecipeFiles([
      ...(removeExistingThumbnail ? [recipe.thumbnailStoredName] : []),
      ...removedAttachments.map((attachment) => attachment.storedName)
    ]);
    res.json(serializeRecipe(updatedRecipe));
  } catch (error) {
    await removeStoredRecipeFiles([
      ...(files.thumbnail ?? []).map((file) => file.filename),
      ...(files.attachments ?? []).map((file) => file.filename)
    ]);
    next(error);
  }
};

export const deleteRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId },
      include: { attachments: true }
    });

    if (!recipe) {
      throw makeError("Recipe not found", 404);
    }

    await prisma.recipe.delete({ where: { id: recipe.id } });
    await removeStoredRecipeFiles([
      recipe.thumbnailStoredName,
      ...recipe.attachments.map((attachment) => attachment.storedName)
    ]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getRecipeThumbnail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, userId },
      select: {
        thumbnailStoredName: true,
        thumbnailOriginalName: true,
        thumbnailMimeType: true
      }
    });

    if (!recipe?.thumbnailStoredName) {
      throw makeError("Recipe thumbnail not found", 404);
    }

    res.type(recipe.thumbnailMimeType ?? "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.sendFile(getStoredFilePath(recipe.thumbnailStoredName));
  } catch (error) {
    next(error);
  }
};

export const downloadRecipeAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const attachment = await prisma.recipeAttachment.findFirst({
      where: {
        id: req.params.attachmentId,
        recipeId: req.params.id,
        recipe: { userId }
      }
    });

    if (!attachment) {
      throw makeError("Recipe attachment not found", 404);
    }

    res.download(getStoredFilePath(attachment.storedName), attachment.originalName);
  } catch (error) {
    next(error);
  }
};
