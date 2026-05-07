import { apiRequest } from "./queryClient";
import type { RecipeWithDetails } from "@shared/schema";

export const api = {
  generateRecipe: async (params: any): Promise<RecipeWithDetails> => {
    const response = await apiRequest("POST", "/api/recipes/generate", params);
    return response.json();
  },

  getRecipe: async (id: string): Promise<RecipeWithDetails> => {
    const response = await apiRequest("GET", `/api/recipes/${id}`);
    return response.json();
  },
};
