import { Ingredient, IngredientInput } from "./ingredient";

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  baseServings: number;
  instructions: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: Ingredient[];
  thumbnailUrl: string | null;
  thumbnailOriginalName: string | null;
  thumbnailMimeType: string | null;
  attachments: RecipeAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url: string;
}

export interface RecipeInput {
  title: string;
  baseServings: number;
  instructions: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: IngredientInput[];
}

export interface RecipeSubmission {
  recipe: RecipeInput;
  thumbnail?: File | null;
  removeThumbnail?: boolean;
  attachments?: File[];
  retainedAttachmentIds?: string[];
}
