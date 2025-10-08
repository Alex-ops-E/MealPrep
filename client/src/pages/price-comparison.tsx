import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Plus, Trash2, TrendingDown } from "lucide-react";

interface Store {
  id: string;
  name: string;
  logo: string;
  rating: number;
}

interface PriceQuote {
  id: string;
  ingredientName: string;
  storeId: string;
  price: number;
  unitSize: string;
  currency: string;
}

interface IngredientRow {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export default function PriceComparison() {
  const { t } = useLanguage();
  
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { id: "1", name: "", quantity: "", unit: "" },
    { id: "2", name: "", quantity: "", unit: "" },
    { id: "3", name: "", quantity: "", unit: "" },
  ]);
  
  const [showResults, setShowResults] = useState(false);

  // Mock stores data
  const stores: Store[] = [
    {
      id: "1",
      name: "Superindo",
      logo: "🏪",
      rating: 4.5,
    },
    {
      id: "2",
      name: "Alfamart",
      logo: "🏬",
      rating: 4.3,
    },
    {
      id: "3",
      name: "Indomaret",
      logo: "🏪",
      rating: 4.4,
    },
  ];

  const addRow = () => {
    const newId = (ingredients.length + 1).toString();
    setIngredients([...ingredients, { id: newId, name: "", quantity: "", unit: "" }]);
  };

  const removeRow = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  const updateIngredient = (id: string, field: keyof IngredientRow, value: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ));
  };

  const handleCompare = () => {
    const filledIngredients = ingredients.filter(ing => ing.name.trim() !== "");
    if (filledIngredients.length > 0) {
      setShowResults(true);
    }
  };

  // Filter out empty ingredients for price comparison
  const validIngredients = ingredients.filter(ing => ing.name.trim() !== "");

  // Generate mock price quotes for each ingredient
  const priceQuotes: PriceQuote[] = useMemo(() => {
    if (!showResults) return [];
    
    const quotes: PriceQuote[] = [];
    validIngredients.forEach((item, itemIndex) => {
      stores.forEach((store, storeIndex) => {
        const basePrice = 5000 + Math.random() * 45000;
        const variation = storeIndex === 0 ? 0.9 : storeIndex === 1 ? 1.1 : 1.0;
        quotes.push({
          id: `quote-${itemIndex}-${storeIndex}`,
          ingredientName: item.name,
          storeId: store.id,
          price: Math.round(basePrice * variation / 100) * 100,
          unitSize: `${item.quantity} ${item.unit}`,
          currency: "IDR",
        });
      });
    });
    return quotes;
  }, [showResults, validIngredients]);

  // Calculate basket totals for each store
  const basketTotals = useMemo(() => {
    return stores.map((store) => {
      const storeQuotes = priceQuotes.filter((q) => q.storeId === store.id);
      const total = storeQuotes.reduce((sum, quote) => sum + quote.price, 0);
      return {
        storeId: store.id,
        storeName: store.name,
        total,
      };
    });
  }, [priceQuotes]);

  const bestDeal = useMemo(() => {
    return basketTotals.reduce((best, current) =>
      current.total < best.total ? current : best
    );
  }, [basketTotals]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Card className="p-8 bg-white">
          <h1 className="text-3xl font-bold text-gray-900 mb-6" data-testid="text-price-comparison-title">
            {t("priceComparison.title")}
          </h1>

          {/* Ingredient Input Form */}
          {!showResults && (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-12 gap-4 mb-2">
                <div className="col-span-5 text-sm font-semibold text-gray-700">Ingredient Name</div>
                <div className="col-span-3 text-sm font-semibold text-gray-700">Quantity</div>
                <div className="col-span-3 text-sm font-semibold text-gray-700">Unit</div>
                <div className="col-span-1"></div>
              </div>

              {ingredients.map((ingredient) => (
                <div key={ingredient.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <Input
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                      placeholder="e.g., Chicken Breast"
                      className="w-full"
                      data-testid={`input-ingredient-name-${ingredient.id}`}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(ingredient.id, 'quantity', e.target.value)}
                      placeholder="e.g., 500"
                      className="w-full"
                      data-testid={`input-ingredient-quantity-${ingredient.id}`}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                      placeholder="e.g., g"
                      className="w-full"
                      data-testid={`input-ingredient-unit-${ingredient.id}`}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(ingredient.id)}
                      disabled={ingredients.length === 1}
                      data-testid={`button-remove-${ingredient.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={addRow}
                  className="gap-2"
                  data-testid="button-add-row"
                >
                  <Plus className="h-4 w-4" />
                  Add Row
                </Button>
                
                <Button
                  onClick={handleCompare}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                  disabled={validIngredients.length === 0}
                  data-testid="button-compare"
                >
                  <TrendingDown className="h-4 w-4" />
                  Compare Prices
                </Button>
              </div>
            </div>
          )}

          {/* Price Comparison Results */}
          {showResults && validIngredients.length > 0 && (
            <>
              {/* Basket Totals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {basketTotals.map((basket) => {
                  const store = stores.find((s) => s.id === basket.storeId);
                  const isBestDeal = basket.storeId === bestDeal.storeId;
                  
                  return (
                    <div
                      key={basket.storeId}
                      className={`relative p-6 rounded-lg border-2 transition-all ${
                        isBestDeal
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                      data-testid={`store-card-${store?.name.toLowerCase()}`}
                    >
                      {isBestDeal && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                          {t("priceComparison.bestValue")}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{store?.logo}</span>
                        <div>
                          <h3 className="font-bold text-gray-900">{store?.name}</h3>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm text-gray-600">{store?.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900" data-testid={`total-${store?.name.toLowerCase()}`}>
                        {formatPrice(basket.total)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        {t("priceComparison.ingredient")}
                      </th>
                      {stores.map((store) => (
                        <th
                          key={store.id}
                          className="text-right py-3 px-4 font-semibold text-gray-900"
                        >
                          {store.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validIngredients.map((item) => {
                      const itemQuotes = priceQuotes.filter(
                        (q) => q.ingredientName === item.name
                      );
                      const bestPrice = Math.min(...itemQuotes.map((q) => q.price));

                      return (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-900" data-testid={`ingredient-${item.id}`}>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                {item.quantity} {item.unit}
                              </div>
                            </div>
                          </td>
                          {stores.map((store) => {
                            const quote = itemQuotes.find((q) => q.storeId === store.id);
                            const isBest = quote && quote.price === bestPrice;

                            return (
                              <td
                                key={store.id}
                                className={`text-right py-3 px-4 ${
                                  isBest ? "font-bold text-green-600" : "text-gray-700"
                                }`}
                                data-testid={`price-${item.id}-${store.name.toLowerCase()}`}
                              >
                                {quote ? formatPrice(quote.price) : "-"}
                                {isBest && (
                                  <span className="ml-2 text-xs text-green-600">
                                    {t("priceComparison.bestDeal")}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                {t("priceComparison.disclaimer")}
              </p>

              <Button
                variant="outline"
                onClick={() => setShowResults(false)}
                data-testid="button-edit-ingredients"
              >
                Edit Ingredients
              </Button>
            </>
          )}
        </Card>
      </div>

      <Footer />
    </div>
  );
}
