import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  summary: text("summary"),
  prepTime: text("prep_time"),
  servings: integer("servings").notNull(),
  cuisine: text("cuisine"),
  cookTime: text("cook_time"),
  difficulty: text("difficulty"),
  dietaryTags: text("dietary_tags").array(),
  ingredients: jsonb("ingredients").notNull(),
  steps: text("steps").array().notNull(),
  chefsTips: text("chefs_tips"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  category: text("category"),
  commonUnit: text("common_unit"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meals = pgTable("meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "breakfast", "lunch", "dinner"
  dayKey: text("day_key").notNull(), // ISO date string "2025-10-27"
  recipeId: varchar("recipe_id").references(() => recipes.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const onboardingResponses = pgTable("onboarding_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  groceryGoal: text("grocery_goal"),
  cookingFrequency: text("cooking_frequency"),
  preferredStores: text("preferred_stores").array(),
  dietPreferences: text("diet_preferences").array(),
  email: text("email"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealLogs = pgTable("meal_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  mealType: text("meal_type").notNull(), // "breakfast", "lunch", "dinner", "snack"
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(), // grams
  carbs: integer("carbs").notNull(), // grams
  fat: integer("fat").notNull(), // grams
  photoUrl: text("photo_url"),
  inputType: text("input_type").notNull(), // "photo", "manual"
  logDate: text("log_date").notNull(), // ISO date string "2026-01-20"
  createdAt: timestamp("created_at").defaultNow(),
});

export const dishMatchSessions = pgTable("dish_match_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionCode: text("session_code").notNull(),
  category: text("category").notNull().default("both"),
  isSolo: boolean("is_solo").notNull().default(false),
  source: text("source").notNull().default("dish-match"),
  matchingLaunched: boolean("matching_launched").notNull().default(false),
  hadMatch: boolean("had_match").notNull().default(false),
  matchCount: integer("match_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  createdAt: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  createdAt: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  createdAt: true,
});

export const insertOnboardingResponseSchema = createInsertSchema(onboardingResponses).omit({
  id: true,
  createdAt: true,
});

export const insertMealLogSchema = createInsertSchema(mealLogs).omit({
  id: true,
  createdAt: true,
});

export const insertDishMatchSessionSchema = createInsertSchema(dishMatchSessions).omit({
  id: true,
  createdAt: true,
});

// Recipe generation request schema
export const generateRecipeSchema = z.object({
  craving: z.string().min(1),
  servings: z.number().min(1).max(20),
  cuisine: z.string().optional(),
  cookTime: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
});

// Meal generation request schema
export const generateMealSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(["breakfast", "lunch", "dinner"]),
  dayKey: z.string(), // ISO date "2025-10-27"
  servings: z.number().min(1).max(20).default(2),
});

// Types
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type IngredientData = typeof ingredients.$inferSelect;
export type InsertIngredientData = z.infer<typeof insertIngredientSchema>;

export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type OnboardingResponse = typeof onboardingResponses.$inferSelect;
export type InsertOnboardingResponse = z.infer<typeof insertOnboardingResponseSchema>;

export type MealLog = typeof mealLogs.$inferSelect;
export type InsertMealLog = z.infer<typeof insertMealLogSchema>;

export type DishMatchSession = typeof dishMatchSessions.$inferSelect;
export type InsertDishMatchSession = z.infer<typeof insertDishMatchSessionSchema>;

export type GenerateRecipeParams = z.infer<typeof generateRecipeSchema>;
export type GenerateMealParams = z.infer<typeof generateMealSchema>;

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeWithDetails extends Recipe {
  parsedIngredients: Ingredient[];
}
