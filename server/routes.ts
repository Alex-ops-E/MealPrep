import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeProductPrices } from "./services/scraper";
import { categorizeProduct } from "./services/openai";
import { 
  searchProductsSchema, 
  insertPriceAlertSchema,
  type ProductWithPrices,
  type SearchParams 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Search products
  app.post("/api/search", async (req, res) => {
    try {
      const searchParams = searchProductsSchema.parse(req.body);
      
      // First try to find existing products in storage
      let result = await storage.searchProducts(searchParams);
      
      // If no results found and it's a new search, scrape for new products
      if (result.products.length === 0 && searchParams.page === 1) {
        console.log(`Scraping for new products: ${searchParams.query}`);
        
        const scrapeResult = await scrapeProductPrices(searchParams.query, searchParams.country);
        
        if (scrapeResult.errors.length > 0) {
          console.warn("Scraping errors:", scrapeResult.errors);
        }
        
        // Create products and prices from scraped data
        const createdProducts: ProductWithPrices[] = [];
        
        for (const productInfo of scrapeResult.products) {
          try {
            // Categorize the product
            const category = await categorizeProduct(productInfo.name, productInfo.description);
            
            // Create product
            const product = await storage.createProduct({
              name: productInfo.name,
              description: productInfo.description || "",
              category,
              imageUrl: productInfo.imageUrl,
              specifications: productInfo.specifications
            });
            
            // Create store and price for this product
            const prices = [];
            
            // Create a generic store for scraped price
            let store = await storage.getStoreByName("Online Store");
            if (!store) {
              store = await storage.createStore({
                name: "Online Store",
                logo: "https://via.placeholder.com/32x32/6366f1/ffffff?text=OS",
                website: "https://example.com",
                country: searchParams.country,
                rating: 4.0
              });
            }
            
            const price = await storage.createProductPrice({
              productId: product.id,
              storeId: store.id,
              price: productInfo.price,
              currency: productInfo.currency,
              shipping: productInfo.shipping || 0,
              inStock: productInfo.inStock,
              url: ""
            });
            
            prices.push({ ...price, store });
            createdProducts.push({ ...product, prices });
            
          } catch (error) {
            console.error("Error creating product:", error);
          }
        }
        
        // Add prices from different stores
        for (const priceInfo of scrapeResult.prices) {
          try {
            // Find or create store
            let store = await storage.getStoreByName(priceInfo.storeName);
            if (!store) {
              store = await storage.createStore({
                name: priceInfo.storeName,
                logo: `https://via.placeholder.com/32x32/6366f1/ffffff?text=${priceInfo.storeName.charAt(0)}`,
                website: priceInfo.url,
                country: searchParams.country,
                rating: 4.0 + Math.random() * 1.0
              });
            }
            
            // Find matching product for this price
            const matchingProduct = createdProducts.find(p => 
              p.name.toLowerCase().includes(searchParams.query.toLowerCase()) ||
              searchParams.query.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
            );
            
            if (matchingProduct) {
              const price = await storage.createProductPrice({
                productId: matchingProduct.id,
                storeId: store.id,
                price: priceInfo.price,
                currency: priceInfo.currency,
                shipping: priceInfo.shipping || 0,
                inStock: priceInfo.inStock,
                url: priceInfo.url
              });
              
              matchingProduct.prices.push({ ...price, store });
            }
            
          } catch (error) {
            console.error("Error creating store price:", error);
          }
        }
        
        // Save search query
        await storage.createSearchQuery({
          query: searchParams.query,
          category: searchParams.category,
          country: searchParams.country,
          results: createdProducts
        });
        
        // Return the newly created products
        result = {
          products: createdProducts,
          total: createdProducts.length
        };
      }
      
      res.json(result);
      
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ 
        error: "Search failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get product details
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const prices = await storage.getProductPrices(product.id);
      const productWithPrices: ProductWithPrices = { ...product, prices };
      
      res.json(productWithPrices);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Failed to get product" });
    }
  });

  // Get price history
  app.get("/api/products/:id/price-history", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const history = await storage.getPriceHistory(req.params.id, days);
      res.json(history);
    } catch (error) {
      console.error("Get price history error:", error);
      res.status(500).json({ error: "Failed to get price history" });
    }
  });

  // Create price alert
  app.post("/api/price-alerts", async (req, res) => {
    try {
      const alertData = insertPriceAlertSchema.parse(req.body);
      const alert = await storage.createPriceAlert(alertData);
      res.json(alert);
    } catch (error) {
      console.error("Create price alert error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid alert data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create price alert" });
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

  // Get trending searches
  app.get("/api/trending", async (req, res) => {
    try {
      const recentSearches = await storage.getRecentSearches(10);
      
      // Group by query and count frequency
      const searchCounts = recentSearches.reduce((acc, search) => {
        acc[search.query] = (acc[search.query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Sort by frequency and return top searches
      const trending = Object.entries(searchCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([query, count]) => ({ query, count }));
      
      res.json(trending);
    } catch (error) {
      console.error("Get trending error:", error);
      res.status(500).json({ error: "Failed to get trending searches" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
