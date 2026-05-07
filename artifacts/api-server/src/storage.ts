import { 
  type Recipe, 
  type InsertRecipe,
  type RecipeWithDetails,
  type Ingredient,
  type Waitlist,
  type InsertWaitlist,
  type Meal,
  type InsertMeal,
  type OnboardingResponse,
  type InsertOnboardingResponse,
  type MealLog,
  type InsertMealLog
} from "@workspace/db";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import * as schema from "@workspace/db";

export interface IStorage {
  // Recipes
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  getRecipe(id: string): Promise<RecipeWithDetails | undefined>;
  getAllRecipes(): Promise<Recipe[]>;
  
  // Meals
  createMeal(meal: InsertMeal): Promise<Meal>;
  getMeal(id: string): Promise<Meal | undefined>;
  getMealsByWeek(startDate: string, endDate: string): Promise<Meal[]>;
  deleteMeal(id: string): Promise<void>;
  
  // Waitlist
  createWaitlistEntry(entry: InsertWaitlist): Promise<Waitlist>;
  getWaitlistCount(): Promise<number>;
  
  // Onboarding
  createOnboardingResponse(response: InsertOnboardingResponse): Promise<OnboardingResponse>;
  getOnboardingBySession(sessionId: string): Promise<OnboardingResponse | undefined>;
  
  // Meal Logs
  createMealLog(mealLog: InsertMealLog): Promise<MealLog>;
  getMealLogsByUser(userId: string, startDate?: string, endDate?: string): Promise<MealLog[]>;
  deleteMealLog(id: string, userId: string): Promise<void>;
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

  async createMeal(insertMeal: InsertMeal): Promise<Meal> {
    const [meal] = await db.insert(schema.meals).values(insertMeal).returning();
    return meal;
  }

  async getMeal(id: string): Promise<Meal | undefined> {
    const [meal] = await db.select().from(schema.meals).where(eq(schema.meals.id, id));
    return meal;
  }

  async getMealsByWeek(startDate: string, endDate: string): Promise<Meal[]> {
    const meals = await db.select().from(schema.meals);
    return meals.filter(meal => meal.dayKey >= startDate && meal.dayKey <= endDate);
  }

  async deleteMeal(id: string): Promise<void> {
    await db.delete(schema.meals).where(eq(schema.meals.id, id));
  }

  async createWaitlistEntry(entry: InsertWaitlist): Promise<Waitlist> {
    const [waitlistEntry] = await db.insert(schema.waitlist).values(entry).returning();
    return waitlistEntry;
  }

  async getWaitlistCount(): Promise<number> {
    const entries = await db.select().from(schema.waitlist);
    return entries.length;
  }

  async createOnboardingResponse(response: InsertOnboardingResponse): Promise<OnboardingResponse> {
    const [onboardingResponse] = await db.insert(schema.onboardingResponses).values(response).returning();
    return onboardingResponse;
  }

  async getOnboardingBySession(sessionId: string): Promise<OnboardingResponse | undefined> {
    const [response] = await db.select().from(schema.onboardingResponses).where(eq(schema.onboardingResponses.sessionId, sessionId));
    return response;
  }

  async createMealLog(mealLog: InsertMealLog): Promise<MealLog> {
    const [log] = await db.insert(schema.mealLogs).values(mealLog).returning();
    return log;
  }

  async getMealLogsByUser(userId: string, startDate?: string, endDate?: string): Promise<MealLog[]> {
    const logs = await db.select().from(schema.mealLogs)
      .where(eq(schema.mealLogs.userId, userId))
      .orderBy(desc(schema.mealLogs.createdAt));
    
    if (startDate && endDate) {
      return logs.filter(log => log.logDate >= startDate && log.logDate <= endDate);
    }
    if (startDate) {
      return logs.filter(log => log.logDate === startDate);
    }
    return logs;
  }

  async deleteMealLog(id: string, userId: string): Promise<void> {
    const [log] = await db.select().from(schema.mealLogs).where(eq(schema.mealLogs.id, id));
    if (log && log.userId === userId) {
      await db.delete(schema.mealLogs).where(eq(schema.mealLogs.id, id));
    }
  }
}

export const storage = new DatabaseStorage();
