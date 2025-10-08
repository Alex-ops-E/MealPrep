import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRecipe } from "./services/openai";
import { scrapeIngredientPrices } from "./services/scraper";
import { 
  generateRecipeSchema,
  insertShoppingListSchema,
  insertShoppingListItemSchema,
  type RecipeWithDetails,
  type ShoppingListWithItems
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate recipe with AI
  app.post("/api/recipes/generate", async (req, res) => {
    try {
      const params = generateRecipeSchema.parse(req.body);
      
      console.log(`Generating recipe for: ${params.craving}`);
      
      const recipeData = await generateRecipe(params);
      
      const recipe = await storage.createRecipe(recipeData);
      
      const recipeWithDetails = await storage.getRecipe(recipe.id);
      
      res.json(recipeWithDetails);
      
    } catch (error) {
      console.error("Generate recipe error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid recipe data", details: error.errors });
      }
      res.status(500).json({ 
        error: "Failed to generate recipe", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get recipe details
  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const recipe = await storage.getRecipe(req.params.id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      console.error("Get recipe error:", error);
      res.status(500).json({ error: "Failed to get recipe" });
    }
  });

  // Get all recipes
  app.get("/api/recipes", async (req, res) => {
    try {
      const recipes = await storage.getAllRecipes();
      res.json(recipes);
    } catch (error) {
      console.error("Get recipes error:", error);
      res.status(500).json({ error: "Failed to get recipes" });
    }
  });

  // Create shopping list
  app.post("/api/shopping-lists", async (req, res) => {
    try {
      const listData = insertShoppingListSchema.parse(req.body);
      const list = await storage.createShoppingList(listData);
      res.json(list);
    } catch (error) {
      console.error("Create shopping list error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid shopping list data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create shopping list" });
    }
  });

  // Get shopping list
  app.get("/api/shopping-lists/:id", async (req, res) => {
    try {
      const list = await storage.getShoppingList(req.params.id);
      if (!list) {
        return res.status(404).json({ error: "Shopping list not found" });
      }
      res.json(list);
    } catch (error) {
      console.error("Get shopping list error:", error);
      res.status(500).json({ error: "Failed to get shopping list" });
    }
  });

  // Get shopping list by recipe
  app.get("/api/shopping-lists/recipe/:recipeId", async (req, res) => {
    try {
      const list = await storage.getShoppingListByRecipe(req.params.recipeId);
      if (!list) {
        return res.status(404).json({ error: "Shopping list not found" });
      }
      res.json(list);
    } catch (error) {
      console.error("Get shopping list error:", error);
      res.status(500).json({ error: "Failed to get shopping list" });
    }
  });

  // Add item to shopping list
  app.post("/api/shopping-lists/:id/items", async (req, res) => {
    try {
      const itemData = insertShoppingListItemSchema.parse({
        ...req.body,
        listId: req.params.id
      });
      const item = await storage.createShoppingListItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Add shopping list item error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid item data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add item" });
    }
  });

  // Update shopping list item
  app.patch("/api/shopping-list-items/:id", async (req, res) => {
    try {
      const item = await storage.updateShoppingListItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Update shopping list item error:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Get ingredient prices
  app.get("/api/ingredients/:name/prices", async (req, res) => {
    try {
      const ingredientName = req.params.name;
      const country = (req.query.country as string) || "ID";
      
      let quotes = await storage.getPriceQuotes(ingredientName);
      
      if (quotes.length === 0) {
        console.log(`Scraping prices for ingredient: ${ingredientName}`);
        const scrapedPrices = await scrapeIngredientPrices(ingredientName, country);
        
        for (const priceInfo of scrapedPrices) {
          let store = await storage.getStoreByName(priceInfo.storeName);
          if (!store) {
            store = await storage.createStore({
              name: priceInfo.storeName,
              logo: `https://via.placeholder.com/32x32/6366f1/ffffff?text=${priceInfo.storeName.charAt(0)}`,
              website: priceInfo.url || "https://example.com",
              country,
              rating: 4.0 + Math.random() * 1.0
            });
          }
          
          await storage.createPriceQuote({
            ingredientName,
            storeId: store.id,
            price: priceInfo.price,
            unitSize: priceInfo.unitSize,
            currency: priceInfo.currency || "IDR",
            url: priceInfo.url
          });
        }
        
        quotes = await storage.getPriceQuotes(ingredientName);
      }
      
      res.json(quotes);
    } catch (error) {
      console.error("Get ingredient prices error:", error);
      res.status(500).json({ error: "Failed to get ingredient prices" });
    }
  });

  // Get stores
  app.get("/api/stores", async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      console.error("Get stores error:", error);
      res.status(500).json({ error: "Failed to get stores" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
