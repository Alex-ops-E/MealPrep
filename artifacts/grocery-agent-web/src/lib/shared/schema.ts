export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  summary: string | null;
  prepTime: string | null;
  servings: number;
  cuisine: string | null;
  cookTime: string | null;
  difficulty: string | null;
  dietaryTags: string[] | null;
  ingredients: unknown;
  steps: string[];
  chefsTips: string | null;
  createdAt: Date | null;
}

export interface RecipeWithDetails extends Recipe {
  parsedIngredients: Ingredient[];
}

export interface Meal {
  id: string;
  name: string;
  type: string;
  dayKey: string;
  recipeId: string | null;
  createdAt: Date | null;
}

export interface MealLog {
  id: string;
  userId: string;
  name: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUrl: string | null;
  inputType: string;
  logDate: string;
  createdAt: Date | null;
}

export interface SearchParams {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  inStockOnly?: boolean;
}

export interface PriceHistoryPoint {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  currency: string;
  date: Date;
  storeName?: string;
}

export interface ProductWithPrices {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  prices: Array<{
    id: string;
    storeName: string;
    price: number;
    currency: string;
    inStock: boolean;
    url?: string;
    lastChecked?: Date;
  }>;
}
