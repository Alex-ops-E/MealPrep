import type { Express } from "express";
import { createServer, type Server } from "http";
import { createHash } from "crypto";
import { storage } from "./storage";
import { generateRecipe, generateMeal, analyzeFridgeAndGenerateRecipe } from "./services/openai";
import { 
  generateRecipeSchema,
  generateMealSchema,
  insertWaitlistSchema,
  insertOnboardingResponseSchema,
  insertMealLogSchema,
  dishMatchSessions,
  type RecipeWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, sql as sqlExpr } from "drizzle-orm";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { analyzeNutritionFromImage } from "./services/openai";

// ── Dish Match ─────────────────────────────────────────────────────────────
interface SwipeItem {
  id: string;
  type: "dish" | "restaurant";
  name: string;
  nameAr: string;
  emoji: string;
  cuisine: string;
  price: string;
  rating: number;
  description: string;
  descriptionAr: string;
  calories?: number;
}
interface SwipeSession {
  id: string;
  code: string;
  hostUserId: string;
  guestUserId: string | null;
  items: SwipeItem[];
  hostSwipes: Record<string, "left" | "right">;
  guestSwipes: Record<string, "left" | "right">;
  matches: string[];
  status: "waiting" | "active" | "done";
  createdAt: Date;
  category: string;
  dbRowId?: string;
}
const swipeSessions = new Map<string, SwipeSession>();
const codeToSessionId = new Map<string, string>();

const SWIPE_ITEMS: SwipeItem[] = [
  { id: "d1", type: "dish", name: "Chicken Mandi", nameAr: "مندي الدجاج", emoji: "🍗", cuisine: "Arabic", price: "55 AED", rating: 4.8, description: "Slow-cooked chicken over fragrant saffron rice", descriptionAr: "دجاج مطبوخ ببطء فوق أرز الزعفران العطر", calories: 680 },
  { id: "d2", type: "dish", name: "Beef Shawarma", nameAr: "شاورما لحم", emoji: "🌯", cuisine: "Arabic", price: "22 AED", rating: 4.6, description: "Marinated beef with garlic sauce in fresh bread", descriptionAr: "لحم بقري متبل مع صلصة الثوم في خبز طازج", calories: 520 },
  { id: "d3", type: "dish", name: "Margherita Pizza", nameAr: "بيتزا مرغريتا", emoji: "🍕", cuisine: "Italian", price: "65 AED", rating: 4.5, description: "Classic Neapolitan pizza with fresh mozzarella", descriptionAr: "بيتزا نابولية كلاسيكية مع جبن موزاريلا طازج", calories: 720 },
  { id: "d4", type: "dish", name: "Sushi Platter", nameAr: "طبق سوشي", emoji: "🍣", cuisine: "Japanese", price: "120 AED", rating: 4.9, description: "Fresh salmon & tuna nigiri with maki rolls", descriptionAr: "نيجيري السلمون والتونة الطازج مع لفائف ماكي", calories: 480 },
  { id: "d5", type: "dish", name: "Grilled Hammour", nameAr: "هامور مشوي", emoji: "🐟", cuisine: "Emirati", price: "95 AED", rating: 4.7, description: "UAE's favourite fish grilled with local spices", descriptionAr: "السمك المفضل في الإمارات، مشوي بالتوابل المحلية", calories: 420 },
  { id: "d6", type: "dish", name: "Lamb Biryani", nameAr: "برياني لحم", emoji: "🍛", cuisine: "Indian", price: "48 AED", rating: 4.8, description: "Fragrant basmati rice with tender slow-cooked lamb", descriptionAr: "أرز بسمتي عطر مع لحم ضأن طري", calories: 750 },
  { id: "d7", type: "dish", name: "Wagyu Burger", nameAr: "برجر واغيو", emoji: "🍔", cuisine: "American", price: "85 AED", rating: 4.6, description: "A5 Wagyu patty with truffle aioli and aged cheddar", descriptionAr: "باتي واغيو A5 مع أيولي الكمأة وشيدر المعتق", calories: 890 },
  { id: "d8", type: "dish", name: "Falafel Wrap", nameAr: "لفة فلافل", emoji: "🧆", cuisine: "Lebanese", price: "18 AED", rating: 4.4, description: "Crispy falafel with tahini and fresh vegetables", descriptionAr: "فلافل مقرمشة مع الطحينة والخضار الطازجة", calories: 410 },
  { id: "d9", type: "dish", name: "Pad Thai", nameAr: "باد تاي", emoji: "🍜", cuisine: "Thai", price: "65 AED", rating: 4.6, description: "Stir-fried rice noodles with shrimp and peanuts", descriptionAr: "شعيرية أرز مقلية مع الروبيان والفول السوداني", calories: 580 },
  { id: "d10", type: "dish", name: "Cheese Manakish", nameAr: "مناقيش جبنة", emoji: "🥙", cuisine: "Lebanese", price: "15 AED", rating: 4.5, description: "Freshly baked flatbread with melted akkawi cheese", descriptionAr: "خبز مخبوز طازج مع جبنة عكاوي ذائبة", calories: 380 },
  { id: "r1", type: "restaurant", name: "Nobu Abu Dhabi", nameAr: "نوبو أبوظبي", emoji: "⭐", cuisine: "Japanese Fusion", price: "250–400 AED/person", rating: 4.9, description: "World-famous Japanese fusion by Nobu Matsuhisa", descriptionAr: "مطبخ ياباني مشهور عالمياً من نوبو ماتسوهيسا" },
  { id: "r2", type: "restaurant", name: "Tamba Dubai", nameAr: "تامبا دبي", emoji: "🌙", cuisine: "Indian", price: "100–180 AED/person", rating: 4.7, description: "Modern Indian with rooftop views of the Dubai skyline", descriptionAr: "مطبخ هندي عصري مع إطلالات على أسطح دبي" },
  { id: "r3", type: "restaurant", name: "Zuma DIFC", nameAr: "زوما المركز المالي", emoji: "🏮", cuisine: "Japanese", price: "200–350 AED/person", rating: 4.8, description: "Contemporary Japanese izakaya in the heart of DIFC", descriptionAr: "إيزاكايا يابانية معاصرة في قلب مركز دبي المالي" },
  { id: "r4", type: "restaurant", name: "Operation Falafel", nameAr: "عملية فلافل", emoji: "🧆", cuisine: "Lebanese", price: "30–60 AED/person", rating: 4.5, description: "Popular Lebanese street food with a cult following", descriptionAr: "أكل شارع لبناني شعبي بمتابعين متحمسين" },
  { id: "r5", type: "restaurant", name: "Nusr-Et Steakhouse", nameAr: "نصرت ستيك", emoji: "🥩", cuisine: "Turkish Steakhouse", price: "200–400 AED/person", rating: 4.6, description: "Salt Bae's legendary theatrical steakhouse experience", descriptionAr: "تجربة مطعم اللحوم المسرحية الأسطورية لسولت باي" },
];

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function generateId(): string {
  return Math.random().toString(36).substring(2, 18) + Date.now().toString(36);
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// ───────────────────────────────────────────────────────────────────────────

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

  // Meal photo analysis (public) - detect meal name + calories from a photo
  app.post("/api/meals/analyze-photo", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image || typeof image !== "string") {
        return res.status(400).json({ error: "Image data is required" });
      }
      const nutrition = await analyzeNutritionFromImage(image);
      res.json(nutrition);
    } catch (error) {
      console.error("Meal photo analyze error:", error);
      res.status(500).json({
        error: "Failed to analyze meal photo",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Fridge scan: analyze image -> detect ingredients -> generate recipe
  app.post("/api/fridge-scan", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image || typeof image !== "string") {
        return res.status(400).json({ error: "Image data is required" });
      }
      const result = await analyzeFridgeAndGenerateRecipe(image);
      const savedRecipe = await storage.createRecipe(result.recipe);
      const recipeWithDetails = await storage.getRecipe(savedRecipe.id);
      res.json({ ingredients: result.ingredients, recipe: recipeWithDetails });
    } catch (error) {
      console.error("Fridge scan error:", error);
      res.status(500).json({
        error: "Failed to analyze image",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ── Dish Match API ─────────────────────────────────────────────────────────
  app.post("/api/dish-match/sessions", async (req, res) => {
    const { userId, category } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const id = generateId();
    let code = generateCode();
    while (codeToSessionId.has(code)) code = generateCode();
    const cat = category || "both";
    const filtered = cat === "dishes"
      ? SWIPE_ITEMS.filter(i => i.type === "dish")
      : cat === "restaurants"
      ? SWIPE_ITEMS.filter(i => i.type === "restaurant")
      : SWIPE_ITEMS;
    const session: SwipeSession = {
      id, code,
      hostUserId: userId,
      guestUserId: null,
      items: shuffle(filtered),
      hostSwipes: {},
      guestSwipes: {},
      matches: [],
      status: "waiting",
      createdAt: new Date(),
      category: cat,
    };
    // Persist to DB for analytics
    try {
      const [row] = await db.insert(dishMatchSessions).values({
        sessionCode: code,
        category: cat,
        hadMatch: false,
        matchCount: 0,
      }).returning();
      session.dbRowId = row.id;
    } catch (e) {
      console.error("Failed to insert dish match session to DB", e);
    }
    swipeSessions.set(id, session);
    codeToSessionId.set(code, id);
    res.json({ id, code, items: session.items });
  });

  app.post("/api/dish-match/sessions/join", (req, res) => {
    const { code, userId } = req.body;
    if (!code || !userId) return res.status(400).json({ error: "code and userId required" });
    const sessionId = codeToSessionId.get(code.toUpperCase());
    if (!sessionId) return res.status(404).json({ error: "Session not found" });
    const session = swipeSessions.get(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.guestUserId && session.guestUserId !== userId) return res.status(409).json({ error: "Session already has a guest" });
    session.guestUserId = userId;
    session.status = "active";
    res.json({ id: session.id, code: session.code, items: session.items });
  });

  app.get("/api/dish-match/sessions/:id", (req, res) => {
    const session = swipeSessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({
      id: session.id,
      code: session.code,
      status: session.status,
      guestJoined: !!session.guestUserId,
      matches: session.matches,
      hostSwipeCount: Object.keys(session.hostSwipes).length,
      guestSwipeCount: Object.keys(session.guestSwipes).length,
    });
  });

  app.post("/api/dish-match/sessions/:id/swipe", async (req, res) => {
    const { userId, itemId, direction } = req.body;
    if (!userId || !itemId || !direction) return res.status(400).json({ error: "userId, itemId, direction required" });
    const session = swipeSessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const isHost = session.hostUserId === userId;
    const isGuest = session.guestUserId === userId;
    if (!isHost && !isGuest) return res.status(403).json({ error: "Not a participant" });

    if (isHost) session.hostSwipes[itemId] = direction;
    else session.guestSwipes[itemId] = direction;

    const prevMatchCount = session.matches.length;

    // Recalculate matches
    const matches: string[] = [];
    for (const id of Object.keys(session.hostSwipes)) {
      if (session.hostSwipes[id] === "right" && session.guestSwipes[id] === "right") {
        matches.push(id);
      }
    }
    session.matches = matches;

    // Update DB when new matches are found
    if (session.dbRowId && matches.length > prevMatchCount) {
      try {
        await db.update(dishMatchSessions)
          .set({ hadMatch: true, matchCount: matches.length })
          .where(eq(dishMatchSessions.id, session.dbRowId));
      } catch (e) {
        console.error("Failed to update dish match session in DB", e);
      }
    }

    const allSwiped = session.items.every(item =>
      session.hostSwipes[item.id] && session.guestSwipes[item.id]
    );
    if (allSwiped) session.status = "done";

    res.json({ matches: session.matches, newMatches: matches.filter(m => !session.matches.includes(m)) });
  });

  app.post("/api/dish-match/solo", async (req, res) => {
    const { category } = req.body;
    const cat = category || "both";
    try {
      const [row] = await db.insert(dishMatchSessions).values({
        sessionCode: "SOLO",
        category: cat,
        isSolo: true,
        hadMatch: false,
        matchCount: 0,
      }).returning();
      res.json({ id: row.id });
    } catch (e) {
      console.error("Failed to record solo session", e);
      res.status(500).json({ error: "Failed to record session" });
    }
  });

  app.get("/api/dish-match/stats", async (_req, res) => {
    try {
      const rows = await db.select().from(dishMatchSessions);
      const totalSessions = rows.filter(r => !r.isSolo).length;
      const soloSessions = rows.filter(r => r.isSolo).length;
      const sessionsWithMatch = rows.filter(r => r.hadMatch && !r.isSolo).length;
      res.json({ totalSessions, soloSessions, sessionsWithMatch });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  // ───────────────────────────────────────────────────────────────────────────

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

  // Meal Log endpoints (protected - requires authentication)
  app.post("/api/meal-logs/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }
      
      console.log("Analyzing food image for nutrition...");
      const nutrition = await analyzeNutritionFromImage(image);
      
      res.json(nutrition);
    } catch (error) {
      console.error("Analyze nutrition error:", error);
      res.status(500).json({ 
        error: "Failed to analyze food image",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/meal-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const mealLogData = insertMealLogSchema.parse({
        ...req.body,
        userId,
      });
      
      const mealLog = await storage.createMealLog(mealLogData);
      res.json(mealLog);
    } catch (error) {
      console.error("Create meal log error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create meal log" });
    }
  });

  app.get("/api/meal-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const mealLogs = await storage.getMealLogsByUser(userId, startDate, endDate);
      res.json(mealLogs);
    } catch (error) {
      console.error("Get meal logs error:", error);
      res.status(500).json({ error: "Failed to get meal logs" });
    }
  });

  app.delete("/api/meal-logs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      await storage.deleteMealLog(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete meal log error:", error);
      res.status(500).json({ error: "Failed to delete meal log" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
