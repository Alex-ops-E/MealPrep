import type { Express } from "express";
import { createServer, type Server } from "http";
import { createHash } from "crypto";
import { storage } from "./storage";
import { generateRecipe, generateMeal } from "./services/openai";
import { 
  generateRecipeSchema,
  generateMealSchema,
  insertWaitlistSchema,
  insertOnboardingResponseSchema,
  type RecipeWithDetails
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

function getClientIP(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup authentication before other routes
  await setupAuth(app);
  registerAuthRoutes(app);
  
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

  // Meal endpoints
  app.post("/api/meals/generate", async (req, res) => {
    try {
      const params = generateMealSchema.parse(req.body);
      
      console.log(`Generating ${params.type} meal for ${params.dayKey}: ${params.prompt}`);
      
      const recipeData = await generateMeal(params);
      const recipe = await storage.createRecipe(recipeData);
      
      const meal = await storage.createMeal({
        name: recipe.title,
        type: params.type,
        dayKey: params.dayKey,
        recipeId: recipe.id,
      });
      
      res.json({
        meal,
        recipe
      });
      
    } catch (error) {
      console.error("Generate meal error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid meal data", details: error.errors });
      }
      res.status(500).json({ 
        error: "Failed to generate meal", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/meals/week", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }
      
      const meals = await storage.getMealsByWeek(startDate, endDate);
      res.json(meals);
    } catch (error) {
      console.error("Get meals error:", error);
      res.status(500).json({ error: "Failed to get meals" });
    }
  });

  app.delete("/api/meals/:id", async (req, res) => {
    try {
      await storage.deleteMeal(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete meal error:", error);
      res.status(500).json({ error: "Failed to delete meal" });
    }
  });

  // Onboarding endpoints
  app.post("/api/onboarding", async (req, res) => {
    try {
      const onboardingData = insertOnboardingResponseSchema.parse(req.body);
      
      const clientIP = getClientIP(req);
      const ipHash = hashIP(clientIP);
      
      const response = await storage.createOnboardingResponse({
        ...onboardingData,
        ipHash,
      });
      res.json(response);
    } catch (error) {
      console.error("Create onboarding response error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to save onboarding response" });
    }
  });

  // Waitlist endpoints
  app.post("/api/waitlist", async (req, res) => {
    try {
      const waitlistData = insertWaitlistSchema.parse(req.body);
      const entry = await storage.createWaitlistEntry(waitlistData);
      res.json(entry);
    } catch (error) {
      console.error("Create waitlist entry error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to join waitlist" });
    }
  });

  app.get("/api/waitlist/count", async (req, res) => {
    try {
      const count = await storage.getWaitlistCount();
      res.json({ count });
    } catch (error) {
      console.error("Get waitlist count error:", error);
      res.status(500).json({ error: "Failed to get waitlist count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
