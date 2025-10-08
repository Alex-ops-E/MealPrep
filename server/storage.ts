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
  type Ingredient
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private recipes: Map<string, Recipe> = new Map();
  private shoppingLists: Map<string, ShoppingList> = new Map();
  private shoppingListItems: Map<string, ShoppingListItem> = new Map();
  private stores: Map<string, Store> = new Map();
  private priceQuotes: Map<string, PriceQuote> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
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

    stores.forEach(store => {
      const id = randomUUID();
      this.stores.set(id, {
        id,
        ...store,
        createdAt: new Date()
      });
    });
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const id = randomUUID();
    const recipe: Recipe = {
      id,
      ...insertRecipe,
      summary: insertRecipe.summary || null,
      cuisine: insertRecipe.cuisine || null,
      cookTime: insertRecipe.cookTime || null,
      dietaryTags: insertRecipe.dietaryTags || null,
      createdAt: new Date()
    };
    this.recipes.set(id, recipe);
    return recipe;
  }

  async getRecipe(id: string): Promise<RecipeWithDetails | undefined> {
    const recipe = this.recipes.get(id);
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
    return Array.from(this.recipes.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createShoppingList(insertList: InsertShoppingList): Promise<ShoppingList> {
    const id = randomUUID();
    const list: ShoppingList = {
      id,
      ...insertList,
      status: insertList.status || "pending",
      createdAt: new Date()
    };
    this.shoppingLists.set(id, list);
    return list;
  }

  async getShoppingList(id: string): Promise<ShoppingListWithItems | undefined> {
    const list = this.shoppingLists.get(id);
    if (!list) return undefined;

    const items = await this.getShoppingListItems(id);
    return {
      ...list,
      items
    };
  }

  async getShoppingListByRecipe(recipeId: string): Promise<ShoppingListWithItems | undefined> {
    const list = Array.from(this.shoppingLists.values())
      .find(l => l.recipeId === recipeId);
    
    if (!list) return undefined;

    const items = await this.getShoppingListItems(list.id);
    return {
      ...list,
      items
    };
  }

  async updateShoppingList(id: string, updateList: Partial<ShoppingList>): Promise<ShoppingList | undefined> {
    const existingList = this.shoppingLists.get(id);
    if (!existingList) return undefined;

    const updatedList = { ...existingList, ...updateList };
    this.shoppingLists.set(id, updatedList);
    return updatedList;
  }

  async createShoppingListItem(insertItem: InsertShoppingListItem): Promise<ShoppingListItem> {
    const id = randomUUID();
    const item: ShoppingListItem = {
      id,
      ...insertItem,
      acquired: insertItem.acquired ?? false,
      preferredStoreIds: insertItem.preferredStoreIds || null
    };
    this.shoppingListItems.set(id, item);
    return item;
  }

  async getShoppingListItems(listId: string): Promise<ShoppingListItem[]> {
    return Array.from(this.shoppingListItems.values())
      .filter(item => item.listId === listId);
  }

  async updateShoppingListItem(id: string, updateItem: Partial<ShoppingListItem>): Promise<ShoppingListItem | undefined> {
    const existingItem = this.shoppingListItems.get(id);
    if (!existingItem) return undefined;

    const updatedItem = { ...existingItem, ...updateItem };
    this.shoppingListItems.set(id, updatedItem);
    return updatedItem;
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const id = randomUUID();
    const store: Store = {
      id,
      ...insertStore,
      logo: insertStore.logo || null,
      rating: insertStore.rating || null,
      createdAt: new Date()
    };
    this.stores.set(id, store);
    return store;
  }

  async getStore(id: string): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getStoreByName(name: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(store => 
      store.name.toLowerCase() === name.toLowerCase()
    );
  }

  async getAllStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async createPriceQuote(insertQuote: InsertPriceQuote): Promise<PriceQuote> {
    const id = randomUUID();
    const quote: PriceQuote = {
      id,
      ...insertQuote,
      currency: insertQuote.currency || "USD",
      unitSize: insertQuote.unitSize || null,
      url: insertQuote.url || null,
      updatedAt: new Date()
    };
    this.priceQuotes.set(id, quote);
    return quote;
  }

  async getPriceQuotes(ingredientName: string): Promise<PriceQuoteWithStore[]> {
    const quotes = Array.from(this.priceQuotes.values())
      .filter(quote => quote.ingredientName.toLowerCase() === ingredientName.toLowerCase());
    
    const quotesWithStores: PriceQuoteWithStore[] = [];
    for (const quote of quotes) {
      const store = await this.getStore(quote.storeId);
      if (store) {
        quotesWithStores.push({ ...quote, store });
      }
    }
    
    return quotesWithStores.sort((a, b) => a.price - b.price);
  }
}

export const storage = new MemStorage();
