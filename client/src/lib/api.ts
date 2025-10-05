import { apiRequest } from "./queryClient";
import type { RecipeWithDetails, Store } from "@shared/schema";

export const api = {
  generateRecipe: async (params: any): Promise<RecipeWithDetails> => {
    const response = await apiRequest("POST", "/api/recipes/generate", params);
    return response.json();
  },

  getRecipe: async (id: string): Promise<RecipeWithDetails> => {
    const response = await apiRequest("GET", `/api/recipes/${id}`);
    return response.json();
  },

  getStores: async (): Promise<Store[]> => {
    const response = await apiRequest("GET", "/api/stores");
    return response.json();
  },
};
