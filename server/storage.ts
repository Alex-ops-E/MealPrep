import { 
  type Recipe, 
  type InsertRecipe,
  type ShoppingList,
  type InsertShoppingList,
  type ShoppingListItem,
  type InsertShoppingListItem,
  type Store,
  type InsertStore,
  type PriceQuote,
  type InsertPriceQuote,
  type RecipeWithDetails,
  type ShoppingListWithItems,
  type PriceQuoteWithStore,
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
  
  // Shopping Lists
  createShoppingList(list: InsertShoppingList): Promise<ShoppingList>;
  getShoppingList(id: string): Promise<ShoppingListWithItems | undefined>;
  getShoppingListByRecipe(recipeId: string): Promise<ShoppingListWithItems | undefined>;
  updateShoppingList(id: string, list: Partial<ShoppingList>): Promise<ShoppingList | undefined>;
  
  // Shopping List Items
  createShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem>;
  getShoppingListItems(listId: string): Promise<ShoppingListItem[]>;
  updateShoppingListItem(id: string, item: Partial<ShoppingListItem>): Promise<ShoppingListItem | undefined>;
  
  // Stores
  createStore(store: InsertStore): Promise<Store>;
  getStore(id: string): Promise<Store | undefined>;
  getStoreByName(name: string): Promise<Store | undefined>;
  getAllStores(): Promise<Store[]>;
  
  // Price Quotes
  createPriceQuote(quote: InsertPriceQuote): Promise<PriceQuote>;
  getPriceQuotes(ingredientName: string): Promise<PriceQuoteWithStore[]>;
  
  // Waitlist
  createWaitlistEntry(entry: InsertWaitlist): Promise<Waitlist>;
  getWaitlistCount(): Promise<number>;
}

// Reference: blueprint:javascript_database for database integration
export class DatabaseStorage implements IStorage {
  private initialized = false;

  private async ensureInitialized() {
    if (this.initialized) return;
    
    const stores = [
      {
        name: "Grab Food",
        logo: "https://via.placeholder.com/32x32/00b14f/ffffff?text=G",
        website: "https://food.grab.com/id/en/",
        country: "ID",
        rating: 4.3
      },
      {
        name: "Gojek GoFood",
        logo: "https://via.placeholder.com/32x32/00880d/ffffff?text=GJ",
        website: "https://www.gojek.com/en-id/gofood",
        country: "ID",
        rating: 4.2
      },
      {
        name: "Superindo",
        logo: "https://via.placeholder.com/32x32/ed1c24/ffffff?text=SI",
        website: "https://www.superindo.co.id/",
        country: "ID",
        rating: 4.1
      }
    ];

    try {
      for (const store of stores) {
        const existing = await this.getStoreByName(store.name);
        if (!existing) {
          await this.createStore(store);
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

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

  async createShoppingList(insertList: InsertShoppingList): Promise<ShoppingList> {
    const [list] = await db.insert(schema.shoppingLists).values(insertList).returning();
    return list;
  }

  async getShoppingList(id: string): Promise<ShoppingListWithItems | undefined> {
    const [list] = await db.select().from(schema.shoppingLists).where(eq(schema.shoppingLists.id, id));
    if (!list) return undefined;

    const items = await this.getShoppingListItems(id);
    return {
      ...list,
      items
    };
  }

  async getShoppingListByRecipe(recipeId: string): Promise<ShoppingListWithItems | undefined> {
    const [list] = await db.select().from(schema.shoppingLists).where(eq(schema.shoppingLists.recipeId, recipeId));
    if (!list) return undefined;

    const items = await this.getShoppingListItems(list.id);
    return {
      ...list,
      items
    };
  }

  async updateShoppingList(id: string, updateList: Partial<ShoppingList>): Promise<ShoppingList | undefined> {
    const [list] = await db.update(schema.shoppingLists).set(updateList).where(eq(schema.shoppingLists.id, id)).returning();
    return list || undefined;
  }

  async createShoppingListItem(insertItem: InsertShoppingListItem): Promise<ShoppingListItem> {
    const [item] = await db.insert(schema.shoppingListItems).values(insertItem).returning();
    return item;
  }

  async getShoppingListItems(listId: string): Promise<ShoppingListItem[]> {
    return await db.select().from(schema.shoppingListItems).where(eq(schema.shoppingListItems.listId, listId));
  }

  async updateShoppingListItem(id: string, updateItem: Partial<ShoppingListItem>): Promise<ShoppingListItem | undefined> {
    const [item] = await db.update(schema.shoppingListItems).set(updateItem).where(eq(schema.shoppingListItems.id, id)).returning();
    return item || undefined;
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const [store] = await db.insert(schema.stores).values(insertStore).returning();
    return store;
  }

  async getStore(id: string): Promise<Store | undefined> {
    const [store] = await db.select().from(schema.stores).where(eq(schema.stores.id, id));
    return store || undefined;
  }

  async getStoreByName(name: string): Promise<Store | undefined> {
    const stores = await db.select().from(schema.stores);
    return stores.find(store => store.name.toLowerCase() === name.toLowerCase()) || undefined;
  }

  async getAllStores(): Promise<Store[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.stores);
  }

  async createPriceQuote(insertQuote: InsertPriceQuote): Promise<PriceQuote> {
    const [quote] = await db.insert(schema.priceQuotes).values(insertQuote).returning();
    return quote;
  }

  async getPriceQuotes(ingredientName: string): Promise<PriceQuoteWithStore[]> {
    const quotes = await db.select().from(schema.priceQuotes);
    const filteredQuotes = quotes.filter(quote => quote.ingredientName.toLowerCase() === ingredientName.toLowerCase());
    
    const quotesWithStores: PriceQuoteWithStore[] = [];
    for (const quote of filteredQuotes) {
      const store = await this.getStore(quote.storeId);
      if (store) {
        quotesWithStores.push({ ...quote, store });
      }
    }
    
    return quotesWithStores.sort((a, b) => a.price - b.price);
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
