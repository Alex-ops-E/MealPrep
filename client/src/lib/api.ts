import { apiRequest } from "./queryClient";
import type { SearchParams, ProductWithPrices, PriceHistoryPoint, InsertPriceAlert, Store } from "@shared/schema";

export interface SearchResult {
  products: ProductWithPrices[];
  total: number;
}

export interface TrendingSearch {
  query: string;
  count: number;
}

export const api = {
  search: async (params: SearchParams): Promise<SearchResult> => {
    const response = await apiRequest("POST", "/api/search", params);
    return response.json();
  },

  getProduct: async (id: string): Promise<ProductWithPrices> => {
    const response = await apiRequest("GET", `/api/products/${id}`);
    return response.json();
  },

  getPriceHistory: async (id: string, days?: number): Promise<PriceHistoryPoint[]> => {
    const url = days ? `/api/products/${id}/price-history?days=${days}` : `/api/products/${id}/price-history`;
    const response = await apiRequest("GET", url);
    return response.json();
  },

  createPriceAlert: async (alert: InsertPriceAlert) => {
    const response = await apiRequest("POST", "/api/price-alerts", alert);
    return response.json();
  },

  getStores: async (): Promise<Store[]> => {
    const response = await apiRequest("GET", "/api/stores");
    return response.json();
  },

  getTrending: async (): Promise<TrendingSearch[]> => {
    const response = await apiRequest("GET", "/api/trending");
    return response.json();
  }
};
