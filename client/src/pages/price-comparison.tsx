import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store as StoreIcon, Search, Plus, X } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { apiRequest } from "@/lib/queryClient";
import type { PriceQuoteWithStore } from "@shared/schema";

interface IngredientRow {
  id: string;
  name: string;
  searching: boolean;
}

export default function PriceComparison() {
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([
    { id: "1", name: "", searching: false },
    { id: "2", name: "", searching: false },
  ]);

  const addIngredientRow = () => {
    setIngredientRows([
      ...ingredientRows,
      { id: Date.now().toString(), name: "", searching: false },
    ]);
  };

  const removeIngredientRow = (id: string) => {
    if (ingredientRows.length > 1) {
      setIngredientRows(ingredientRows.filter(row => row.id !== id));
    }
  };

  const updateIngredientName = (id: string, name: string) => {
    setIngredientRows(ingredientRows.map(row => 
      row.id === id ? { ...row, name } : row
    ));
  };

  const searchIngredient = (id: string) => {
    setIngredientRows(ingredientRows.map(row =>
      row.id === id ? { ...row, searching: true } : row
    ));
  };

  const searchingIngredients = ingredientRows.filter(row => row.searching && row.name.trim());

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentStep={4} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8 bg-white">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Price Comparison</h1>
          <p className="text-gray-600 mb-6">
            Search for ingredients to compare prices across different stores
          </p>

          <div className="mb-6">
            <Label className="text-gray-900 font-medium mb-3 block">Search Ingredients</Label>
            <div className="space-y-3">
              {ingredientRows.map((row, index) => (
                <div key={row.id} className="flex gap-2">
                  <Input
                    value={row.name}
                    onChange={(e) => updateIngredientName(row.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && row.name.trim()) {
                        searchIngredient(row.id);
                      }
                    }}
                    placeholder={`Ingredient ${index + 1} (e.g., chicken breast, tomatoes)`}
                    className="flex-1"
                    data-testid={`input-ingredient-${index}`}
                  />
                  <Button
                    onClick={() => searchIngredient(row.id)}
                    disabled={!row.name.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid={`button-search-${index}`}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  {ingredientRows.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => removeIngredientRow(row.id)}
                      data-testid={`button-remove-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={addIngredientRow}
              className="mt-3 w-full"
              data-testid="button-add-ingredient"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add More Ingredients
            </Button>
          </div>

          {searchingIngredients.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Enter ingredient names above and click search to see price comparisons</p>
            </div>
          )}

          {searchingIngredients.map((ingredient) => (
            <IngredientPriceSection key={ingredient.id} ingredientName={ingredient.name} />
          ))}
        </Card>
      </div>

      <Footer />
    </div>
  );
}

function IngredientPriceSection({ ingredientName }: { ingredientName: string }) {
  const { data: priceQuotes, isLoading } = useQuery({
    queryKey: ["/api/ingredients", ingredientName, "prices"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ingredients/${encodeURIComponent(ingredientName)}/prices?country=US`);
      return (await response.json()) as PriceQuoteWithStore[];
    },
  });

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{ingredientName}</h2>
      
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
              data-testid={`price-quote-${ingredientName}-${index}`}
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

      {!isLoading && priceQuotes && priceQuotes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No price data available for "{ingredientName}"</p>
        </div>
      )}
    </div>
  );
}
