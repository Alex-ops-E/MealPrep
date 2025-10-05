import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";
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

export const shoppingLists = pgTable("shopping_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shoppingListItems = pgTable("shopping_list_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listId: varchar("list_id").notNull(),
  ingredientName: text("ingredient_name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  acquired: boolean("acquired").default(false),
  preferredStoreIds: text("preferred_store_ids").array(),
});

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logo: text("logo"),
  website: text("website").notNull(),
  country: text("country").notNull(),
  rating: real("rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priceQuotes = pgTable("price_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingredientName: text("ingredient_name").notNull(),
  storeId: varchar("store_id").notNull(),
  price: real("price").notNull(),
  unitSize: text("unit_size"),
  currency: text("currency").notNull().default("USD"),
  url: text("url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingListSchema = createInsertSchema(shoppingLists).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingListItemSchema = createInsertSchema(shoppingListItems).omit({
  id: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});

export const insertPriceQuoteSchema = createInsertSchema(priceQuotes).omit({
  id: true,
  updatedAt: true,
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

export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = z.infer<typeof insertShoppingListSchema>;

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type PriceQuote = typeof priceQuotes.$inferSelect;
export type InsertPriceQuote = z.infer<typeof insertPriceQuoteSchema>;

export type GenerateRecipeParams = z.infer<typeof generateRecipeSchema>;

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeWithDetails extends Recipe {
  parsedIngredients: Ingredient[];
}

export interface ShoppingListWithItems extends ShoppingList {
  items: ShoppingListItem[];
}

export interface PriceQuoteWithStore extends PriceQuote {
  store: Store;
}
