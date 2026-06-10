import { AdminAccess, AdminOverview, AdminUser, RecipeExport } from "../types/admin";
import { apiRequest } from "./api";

export const adminService = {
  getAccess: () => apiRequest<AdminAccess>("/admin/access"),
  getOverview: () => apiRequest<AdminOverview>("/admin/overview"),
  getUsers: () => apiRequest<AdminUser[]>("/admin/users"),
  createUser: (email: string, password: string) =>
    apiRequest<AdminUser>("/admin/users", {
      method: "POST",
      body: { email, password }
    }),
  updateUser: (id: string, email: string, password: string) =>
    apiRequest<AdminUser>(`/admin/users/${id}`, {
      method: "PUT",
      body: { email, password: password || undefined }
    }),
  deleteUser: (id: string) =>
    apiRequest<void>(`/admin/users/${id}`, { method: "DELETE" }),
  exportRecipes: () => apiRequest<RecipeExport>("/admin/recipes/export"),
  importRecipes: (payload: unknown) =>
    apiRequest<{ imported: number }>("/admin/recipes/import", {
      method: "POST",
      body: payload as object
    })
};
