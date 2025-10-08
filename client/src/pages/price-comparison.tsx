import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, X, ExternalLink } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { apiRequest } from "@/lib/queryClient";
import type { PriceQuoteWithStore, Store } from "@shared/schema";

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

  const { data: stores } = useQuery({
    queryKey: ["/api/stores"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stores");
      return (await response.json()) as Store[];
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentStep={4} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    placeholder={`Ingredient ${index + 1} (e.g., chicken breast, tomatoes)`}
                    className="flex-1"
                    data-testid={`input-ingredient-${index}`}
                  />
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
            
            <div className="flex gap-3 mt-3">
              <Button
                variant="outline"
                onClick={addIngredientRow}
                className="flex-1"
                data-testid="button-add-ingredient"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Ingredients
              </Button>
              <Button
                onClick={() => {
                  ingredientRows.forEach(row => {
                    if (row.name.trim()) {
                      searchIngredient(row.id);
                    }
                  });
                }}
                disabled={!ingredientRows.some(row => row.name.trim())}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-compare-all"
              >
                <Search className="h-4 w-4 mr-2" />
                Compare Prices
              </Button>
            </div>
          </div>

          {searchingIngredients.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Enter ingredient names above and click search to see price comparisons</p>
            </div>
          )}

          {searchingIngredients.length > 0 && stores && stores.length > 0 && (
            <PriceComparisonTable 
              ingredients={searchingIngredients} 
              stores={stores}
            />
          )}
        </Card>
      </div>

      <Footer />
    </div>
  );
}

function PriceComparisonTable({ 
  ingredients, 
  stores 
}: { 
  ingredients: IngredientRow[]; 
  stores: Store[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" data-testid="price-comparison-table">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
              Ingredients
            </th>
            {stores.map((store) => (
              <th 
                key={store.id} 
                className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900"
                data-testid={`header-store-${store.name}`}
              >
                {store.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ingredient) => (
            <IngredientRow 
              key={ingredient.id} 
              ingredientName={ingredient.name} 
              stores={stores}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IngredientRow({ 
  ingredientName, 
  stores 
}: { 
  ingredientName: string; 
  stores: Store[];
}) {
  const { data: priceQuotes, isLoading } = useQuery({
    queryKey: ["/api/ingredients", ingredientName, "prices"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/ingredients/${encodeURIComponent(ingredientName)}/prices?country=ID`);
      return (await response.json()) as PriceQuoteWithStore[];
    },
  });

  const getPriceForStore = (storeId: string) => {
    return priceQuotes?.find(quote => quote.storeId === storeId);
  };

  return (
    <tr data-testid={`row-ingredient-${ingredientName}`}>
      <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
        {ingredientName}
      </td>
      {stores.map((store) => {
        const quote = getPriceForStore(store.id);
        
        if (isLoading) {
          return (
            <td 
              key={store.id} 
              className="border border-gray-300 px-4 py-3"
            >
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </td>
          );
        }

        if (!quote) {
          return (
            <td 
              key={store.id} 
              className="border border-gray-300 px-4 py-3 text-center text-gray-400"
            >
              Not available
            </td>
          );
        }

        return (
          <td 
            key={store.id} 
            className="border border-gray-300 px-4 py-3"
            data-testid={`cell-${ingredientName}-${store.name}`}
          >
            <div className="space-y-1">
              <a 
                href={quote.url || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                data-testid={`link-product-${ingredientName}-${store.name}`}
              >
                <ExternalLink className="h-4 w-4" />
                {ingredientName}
              </a>
              <p className="text-sm text-gray-600">{quote.unitSize || "Standard size"}</p>
              <p className="text-lg font-bold text-gray-900">
                Rp {quote.price.toLocaleString('id-ID')}
              </p>
            </div>
          </td>
        );
      })}
    </tr>
  );
}
