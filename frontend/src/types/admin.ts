export interface AdminOverview {
  users: number;
  recipes: number;
  adminEmail: string;
}

export interface AdminAccess {
  isAdmin: boolean;
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    recipes: number;
    meals: number;
    weeklyPlans: number;
  };
}

export interface RecipeExport {
  format: "weeklylunch-recipes";
  version: 1;
  exportedAt: string;
  recipes: Array<{
    userEmail: string;
    title: string;
    baseServings: number;
    instructions: string;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    ingredients: Array<{
      name: string;
      quantity: number;
      unit: string;
    }>;
  }>;
}
