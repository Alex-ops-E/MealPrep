import { 
  type Product, 
  type InsertProduct,
  type Store,
  type InsertStore,
  type ProductPrice,
  type InsertProductPrice,
  type PriceAlert,
  type InsertPriceAlert,
  type SearchQuery,
  type InsertSearchQuery,
  type ProductWithPrices,
  type PriceHistoryPoint,
  type SearchParams
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Products
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  searchProducts(params: SearchParams): Promise<{ products: ProductWithPrices[], total: number }>;
  
  // Stores
  createStore(store: InsertStore): Promise<Store>;
  getStore(id: string): Promise<Store | undefined>;
  getStoreByName(name: string): Promise<Store | undefined>;
  getAllStores(): Promise<Store[]>;
  
  // Product Prices
  createProductPrice(price: InsertProductPrice): Promise<ProductPrice>;
  getProductPrices(productId: string): Promise<(ProductPrice & { store: Store })[]>;
  updateProductPrice(id: string, price: Partial<ProductPrice>): Promise<ProductPrice | undefined>;
  getPriceHistory(productId: string, days?: number): Promise<PriceHistoryPoint[]>;
  
  // Price Alerts
  createPriceAlert(alert: InsertPriceAlert): Promise<PriceAlert>;
  getPriceAlerts(productId: string): Promise<PriceAlert[]>;
  updatePriceAlert(id: string, alert: Partial<PriceAlert>): Promise<PriceAlert | undefined>;
  
  // Search Queries
  createSearchQuery(query: InsertSearchQuery): Promise<SearchQuery>;
  getRecentSearches(limit?: number): Promise<SearchQuery[]>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product> = new Map();
  private stores: Map<string, Store> = new Map();
  private productPrices: Map<string, ProductPrice> = new Map();
  private priceAlerts: Map<string, PriceAlert> = new Map();
  private searchQueries: Map<string, SearchQuery> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample stores
    const stores = [
      {
        name: "TechMart",
        logo: "https://via.placeholder.com/32x32/22c55e/ffffff?text=T",
        website: "https://techmart.com",
        country: "US",
        rating: 4.8
      },
      {
        name: "ElectroWorld",
        logo: "https://via.placeholder.com/32x32/3b82f6/ffffff?text=E",
        website: "https://electroworld.com",
        country: "US",
        rating: 4.2
      },
      {
        name: "GadgetHub",
        logo: "https://via.placeholder.com/32x32/f59e0b/ffffff?text=G",
        website: "https://gadgethub.com",
        country: "US",
        rating: 4.5
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

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      id,
      ...insertProduct,
      description: insertProduct.description || null,
      imageUrl: insertProduct.imageUrl || null,
      specifications: insertProduct.specifications || null,
      createdAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async searchProducts(params: SearchParams): Promise<{ products: ProductWithPrices[], total: number }> {
    let allProducts = Array.from(this.products.values());
    
    // Filter by category if specified
    if (params.category && params.category !== "All Categories") {
      allProducts = allProducts.filter(p => 
        p.category.toLowerCase() === params.category!.toLowerCase()
      );
    }

    // Filter by query
    if (params.query) {
      const queryLower = params.query.toLowerCase();
      allProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(queryLower) ||
        (p.description && p.description.toLowerCase().includes(queryLower))
      );
    }

    // Get products with prices
    const productsWithPrices: ProductWithPrices[] = [];
    for (const product of allProducts) {
      const prices = await this.getProductPrices(product.id);
      
      // Apply price filters
      if (params.minPrice || params.maxPrice) {
        const productPrices = prices.map(p => p.price);
        const minProductPrice = Math.min(...productPrices);
        const maxProductPrice = Math.max(...productPrices);
        
        if (params.minPrice && minProductPrice < params.minPrice) continue;
        if (params.maxPrice && maxProductPrice > params.maxPrice) continue;
      }

      // Apply stock filter
      if (params.inStockOnly && !prices.some(p => p.inStock)) continue;

      // Apply free shipping filter
      if (params.freeShippingOnly && !prices.some(p => p.shipping === 0)) continue;

      productsWithPrices.push({ ...product, prices });
    }

    // Pagination
    const total = productsWithPrices.length;
    const start = (params.page - 1) * params.limit;
    const paginatedProducts = productsWithPrices.slice(start, start + params.limit);

    return { products: paginatedProducts, total };
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

  async createProductPrice(insertPrice: InsertProductPrice): Promise<ProductPrice> {
    const id = randomUUID();
    const price: ProductPrice = {
      id,
      ...insertPrice,
      currency: insertPrice.currency || 'USD',
      shipping: insertPrice.shipping || null,
      inStock: insertPrice.inStock ?? null,
      url: insertPrice.url || null,
      lastUpdated: new Date()
    };
    this.productPrices.set(id, price);
    return price;
  }

  async getProductPrices(productId: string): Promise<(ProductPrice & { store: Store })[]> {
    const prices = Array.from(this.productPrices.values())
      .filter(price => price.productId === productId);
    
    const pricesWithStores: (ProductPrice & { store: Store })[] = [];
    for (const price of prices) {
      const store = await this.getStore(price.storeId);
      if (store) {
        pricesWithStores.push({ ...price, store });
      }
    }
    
    return pricesWithStores.sort((a, b) => a.price - b.price);
  }

  async updateProductPrice(id: string, updatePrice: Partial<ProductPrice>): Promise<ProductPrice | undefined> {
    const existingPrice = this.productPrices.get(id);
    if (!existingPrice) return undefined;

    const updatedPrice = {
      ...existingPrice,
      ...updatePrice,
      lastUpdated: new Date()
    };
    this.productPrices.set(id, updatedPrice);
    return updatedPrice;
  }

  async getPriceHistory(productId: string, days: number = 30): Promise<PriceHistoryPoint[]> {
    const prices = Array.from(this.productPrices.values())
      .filter(price => price.productId === productId);
    
    const history: PriceHistoryPoint[] = [];
    for (const price of prices) {
      const store = await this.getStore(price.storeId);
      if (store) {
        history.push({
          date: price.lastUpdated?.toISOString() || new Date().toISOString(),
          price: price.price,
          storeId: price.storeId,
          storeName: store.name
        });
      }
    }
    
    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createPriceAlert(insertAlert: InsertPriceAlert): Promise<PriceAlert> {
    const id = randomUUID();
    const alert: PriceAlert = {
      id,
      ...insertAlert,
      isActive: insertAlert.isActive ?? null,
      createdAt: new Date()
    };
    this.priceAlerts.set(id, alert);
    return alert;
  }

  async getPriceAlerts(productId: string): Promise<PriceAlert[]> {
    return Array.from(this.priceAlerts.values())
      .filter(alert => alert.productId === productId && alert.isActive);
  }

  async updatePriceAlert(id: string, updateAlert: Partial<PriceAlert>): Promise<PriceAlert | undefined> {
    const existingAlert = this.priceAlerts.get(id);
    if (!existingAlert) return undefined;

    const updatedAlert = { ...existingAlert, ...updateAlert };
    this.priceAlerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async createSearchQuery(insertQuery: InsertSearchQuery): Promise<SearchQuery> {
    const id = randomUUID();
    const query: SearchQuery = {
      id,
      ...insertQuery,
      category: insertQuery.category || null,
      results: insertQuery.results || null,
      createdAt: new Date()
    };
    this.searchQueries.set(id, query);
    return query;
  }

  async getRecentSearches(limit: number = 10): Promise<SearchQuery[]> {
    return Array.from(this.searchQueries.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
