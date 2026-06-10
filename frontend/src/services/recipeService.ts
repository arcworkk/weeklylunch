import { apiRequest } from "./api";
import { Recipe, RecipeSubmission } from "../types/recipe";

const toFormData = (submission: RecipeSubmission) => {
  const formData = new FormData();
  formData.append(
    "payload",
    JSON.stringify({
      ...submission.recipe,
      removeThumbnail: submission.removeThumbnail ?? false,
      retainedAttachmentIds: submission.retainedAttachmentIds ?? []
    })
  );

  if (submission.thumbnail) {
    formData.append("thumbnail", submission.thumbnail);
  }

  submission.attachments?.forEach((attachment) => {
    formData.append("attachments", attachment);
  });

  return formData;
};

export const recipeService = {
  getRecipes: () => apiRequest<Recipe[]>("/recipes"),
  getRecipe: (id: string) => apiRequest<Recipe>(`/recipes/${id}`),
  createRecipe: (submission: RecipeSubmission) =>
    apiRequest<Recipe>("/recipes", {
      method: "POST",
      body: toFormData(submission),
      timeoutMs: 60000
    }),
  updateRecipe: (id: string, submission: RecipeSubmission) =>
    apiRequest<Recipe>(`/recipes/${id}`, {
      method: "PUT",
      body: toFormData(submission),
      timeoutMs: 60000
    }),
  deleteRecipe: (id: string) =>
    apiRequest<void>(`/recipes/${id}`, { method: "DELETE" })
};
