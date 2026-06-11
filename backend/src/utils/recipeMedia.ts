import { Prisma } from "@prisma/client";
import path from "node:path";
import fs from "node:fs/promises";

export const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads")
);

export const recipeInclude = {
  ingredients: {
    orderBy: { createdAt: "asc" as const }
  },
  attachments: {
    orderBy: { createdAt: "asc" as const }
  }
} satisfies Prisma.RecipeInclude;

export type RecipeWithMedia = Prisma.RecipeGetPayload<{
  include: typeof recipeInclude;
}>;

export const serializeRecipe = (recipe: RecipeWithMedia) => {
  const { thumbnailStoredName: _thumbnailStoredName, attachments, ...safeRecipe } = recipe;

  return {
    ...safeRecipe,
    thumbnailUrl: recipe.thumbnailStoredName
      ? `/recipes/${recipe.id}/thumbnail?v=${recipe.updatedAt.getTime()}`
      : null,
    attachments: attachments.map(({ storedName: _storedName, ...attachment }) => ({
      ...attachment,
      url: `/recipes/${recipe.id}/attachments/${attachment.id}`
    }))
  };
};

export const getStoredFilePath = (storedName: string) =>
  path.join(uploadRoot, storedName);

export const removeStoredRecipeFiles = async (
  storedNames: Array<string | null | undefined>
) => {
  await Promise.all(
    storedNames.filter(Boolean).map((storedName) =>
      fs.rm(getStoredFilePath(storedName!), { force: true }).catch(() => undefined)
    )
  );
};
