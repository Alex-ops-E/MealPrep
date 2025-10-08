import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  summary: text("summary"),
  servings: integer("servings").notNull(),
  cuisine: text("cuisine"),
  cookTime: text("cook_time"),
  dietaryTags: text("dietary_tags").array(),
  ingredients: jsonb("ingredients").notNull(),
  steps: text("steps").array().notNull(),
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

// Recipe generation request schema
export const generateRecipeSchema = z.object({
  craving: z.string().min(1),
  servings: z.number().min(1).max(20),
  cuisine: z.string().optional(),
  cookTime: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
});

// Types
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type IngredientData = typeof ingredients.$inferSelect;
export type InsertIngredientData = z.infer<typeof insertIngredientSchema>;

export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;

export type GenerateRecipeParams = z.infer<typeof generateRecipeSchema>;

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeWithDetails extends Recipe {
  parsedIngredients: Ingredient[];
}
