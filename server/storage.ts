import { 
  type Recipe, 
  type InsertRecipe,
  type RecipeWithDetails,
  type Ingredient,
  type Waitlist,
  type InsertWaitlist
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

export interface IStorage {
  // Recipes
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  getRecipe(id: string): Promise<RecipeWithDetails | undefined>;
  getAllRecipes(): Promise<Recipe[]>;
  
  // Waitlist
  createWaitlistEntry(entry: InsertWaitlist): Promise<Waitlist>;
  getWaitlistCount(): Promise<number>;
}

// Reference: blueprint:javascript_database for database integration
export class DatabaseStorage implements IStorage {

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(schema.recipes).values(insertRecipe).returning();
    return recipe;
  }

  async getRecipe(id: string): Promise<RecipeWithDetails | undefined> {
    const [recipe] = await db.select().from(schema.recipes).where(eq(schema.recipes.id, id));
    if (!recipe) return undefined;

    const parsedIngredients = Array.isArray(recipe.ingredients) 
      ? recipe.ingredients as Ingredient[]
      : [];

    return {
      ...recipe,
      parsedIngredients
    };
  }

  async getAllRecipes(): Promise<Recipe[]> {
    return await db.select().from(schema.recipes).orderBy(desc(schema.recipes.createdAt));
  }

  async createWaitlistEntry(entry: InsertWaitlist): Promise<Waitlist> {
    const [waitlistEntry] = await db.insert(schema.waitlist).values(entry).returning();
    return waitlistEntry;
  }

  async getWaitlistCount(): Promise<number> {
    const entries = await db.select().from(schema.waitlist);
    return entries.length;
  }
}

export const storage = new DatabaseStorage();
