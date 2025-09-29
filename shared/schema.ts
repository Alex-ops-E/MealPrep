import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  specifications: jsonb("specifications"),
  createdAt: timestamp("created_at").defaultNow(),
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

export const productPrices = pgTable("product_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  storeId: varchar("store_id").notNull(),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  shipping: real("shipping"),
  inStock: boolean("in_stock").default(true),
  url: text("url"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const priceAlerts = pgTable("price_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  targetPrice: real("target_price").notNull(),
  email: text("email").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const searchQueries = pgTable("search_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  category: text("category"),
  country: text("country").notNull(),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});

export const insertProductPriceSchema = createInsertSchema(productPrices).omit({
  id: true,
  lastUpdated: true,
});

export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertSearchQuerySchema = createInsertSchema(searchQueries).omit({
  id: true,
  createdAt: true,
});

// Search schema with filters
export const searchProductsSchema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  country: z.string().default("US"),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStockOnly: z.boolean().default(false),
  freeShippingOnly: z.boolean().default(false),
  page: z.number().default(1),
  limit: z.number().default(12),
});

// Types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type ProductPrice = typeof productPrices.$inferSelect;
export type InsertProductPrice = z.infer<typeof insertProductPriceSchema>;

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;

export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;

export type SearchParams = z.infer<typeof searchProductsSchema>;

export interface ProductWithPrices extends Product {
  prices: (ProductPrice & { store: Store })[];
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  storeId: string;
  storeName: string;
}
