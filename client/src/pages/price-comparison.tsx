import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store as StoreIcon, Search } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { apiRequest } from "@/lib/queryClient";
import type { PriceQuoteWithStore } from "@shared/schema";

export default function PriceComparison() {
  const [ingredientName, setIngredientName] = useState("");
  const [searchIngredient, setSearchIngredient] = useState("");

  const { data: priceQuotes, isLoading } = useQuery({
    queryKey: ["/api/ingredients", searchIngredient, "prices"],
    queryFn: async () => {
      if (!searchIngredient) return [];
      const response = await apiRequest("GET", `/api/ingredients/${encodeURIComponent(searchIngredient)}/prices?country=US`);
      return (await response.json()) as PriceQuoteWithStore[];
    },
    enabled: !!searchIngredient,
  });

  const handleSearch = () => {
    if (ingredientName.trim()) {
      setSearchIngredient(ingredientName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentStep={4} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8 bg-white">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Price Comparison</h1>
          <p className="text-gray-600 mb-6">
            Search for any ingredient to compare prices across different stores
          </p>

          <div className="mb-6">
            <Label className="text-gray-900 font-medium mb-3 block">Search Ingredient</Label>
            <div className="flex gap-4">
              <Input
                value={ingredientName}
                onChange={(e) => setIngredientName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g., chicken breast, tomatoes, olive oil"
                className="flex-1"
                data-testid="input-ingredient-search"
              />
              <Button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-search-ingredient"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && priceQuotes && priceQuotes.length > 0 && (
            <div className="space-y-3">
              {priceQuotes.map((quote, index) => (
                <div
                  key={quote.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  data-testid={`price-quote-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <StoreIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{quote.store.name}</h3>
                        <p className="text-sm text-gray-500">
                          {quote.unitSize || "Standard size"} • Rating: {quote.store.rating?.toFixed(1) || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${quote.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">{quote.currency}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && priceQuotes && priceQuotes.length === 0 && searchIngredient && (
            <div className="text-center py-8 text-gray-500">
              <p>No price data available for "{searchIngredient}"</p>
            </div>
          )}

          {!searchIngredient && (
            <div className="text-center py-12 text-gray-400">
              <p>Enter an ingredient name above to see price comparisons</p>
            </div>
          )}
        </Card>
      </div>

      <Footer />
    </div>
  );
}
