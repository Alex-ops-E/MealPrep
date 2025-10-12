import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Store as StoreIcon, ShoppingCart, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShopping, type ShoppingListItem } from "@/contexts/ShoppingContext";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RecipeWithDetails } from "@shared/schema";

type Step = 1 | 2 | 3 | 4;

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

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<string[]>([]);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const { shoppingList, setShoppingList, toggleItemAcquired } = useShopping();

  const generateRecipeFormSchema = z.object({
    craving: z.string().min(1, t("recipe.cravingError")),
    servings: z.coerce.number().min(1).max(20),
    cuisine: z.string().optional(),
    cookTime: z.string().optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
  });

  type GenerateRecipeForm = z.infer<typeof generateRecipeFormSchema>;

  const form = useForm<GenerateRecipeForm>({
    resolver: zodResolver(generateRecipeFormSchema),
    defaultValues: {
      craving: "",
      servings: 4,
      cuisine: "Any",
      cookTime: "Any",
      dietaryRestrictions: [],
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateRecipeForm) => {
      const response = await apiRequest("POST", "/api/recipes/generate", data);
      return response.json() as Promise<RecipeWithDetails>;
    },
    onSuccess: (data) => {
      setRecipe(data);
      setCurrentStep(2);
      toast({
        title: t("recipe.generatedTitle"),
        description: t("recipe.generatedMessage"),
      });
    },
    onError: (error) => {
      toast({
        title: t("recipe.failedTitle"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GenerateRecipeForm) => {
    generateMutation.mutate({
      ...data,
      dietaryRestrictions: selectedDietaryRestrictions,
    });
  };

  const createShoppingList = () => {
    if (!recipe) return;
    
    const items: ShoppingListItem[] = recipe.parsedIngredients.map((ingredient, index) => ({
      id: `item-${index}`,
      ingredientName: ingredient.name,
      quantity: ingredient.quantity.toString(),
      unit: ingredient.unit,
      acquired: false,
    }));
    
    setShoppingList(items);
    setCurrentStep(3);
  };

  const quickStarts = [
    { label: t("recipe.healthyQuick"), craving: t("recipe.healthyQuickCraving") },
    { label: t("recipe.comfortFood"), craving: t("recipe.comfortFoodCraving") },
    { label: t("recipe.dateNight"), craving: t("recipe.dateNightCraving") },
    { label: t("recipe.familyDinner"), craving: t("recipe.familyDinnerCraving") },
  ];

  const steps = [
    { number: 1, label: t("recipe.generate") },
    { number: 2, label: t("recipe.viewRecipe") },
    { number: 3, label: t("recipe.shop") },
    { number: 4, label: t("recipe.compare") },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentStep={currentStep} />
      
      <WaitlistSection />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step.number
                      ? "bg-blue-600 text-white"
                      : currentStep > step.number
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                  data-testid={`step-indicator-${step.number}`}
                >
                  {step.number}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    currentStep === step.number
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-24 h-0.5 mx-4 ${
                    currentStep > step.number ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {currentStep === 1 && (
          <Card className="p-8 bg-white">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {t("recipe.whatToCook")}
            </h1>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="craving"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">
                        {t("recipe.craving")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("recipe.cravingPlaceholder")}
                          className="h-12"
                          data-testid="input-craving"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="text-gray-900 font-medium mb-3 block">
                    {t("recipe.quickStarts")}
                  </FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickStarts.map((quickStart) => (
                      <Button
                        key={quickStart.label}
                        type="button"
                        variant="outline"
                        className="h-auto py-3 px-4 text-left justify-start"
                        onClick={() => form.setValue("craving", quickStart.craving)}
                        data-testid={`button-quickstart-${quickStart.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {quickStart.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="servings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">{t("recipe.servings")}</FormLabel>
                        <Select
                          value={field.value.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-servings">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? t("recipe.person") : t("recipe.people")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cuisine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">{t("recipe.cuisineStyle")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-cuisine">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Any">{t("recipe.any")}</SelectItem>
                            <SelectItem value="Italian">{t("recipe.italian")}</SelectItem>
                            <SelectItem value="Mexican">{t("recipe.mexican")}</SelectItem>
                            <SelectItem value="Asian">{t("recipe.asian")}</SelectItem>
                            <SelectItem value="Mediterranean">{t("recipe.mediterranean")}</SelectItem>
                            <SelectItem value="American">{t("recipe.american")}</SelectItem>
                            <SelectItem value="French">{t("recipe.french")}</SelectItem>
                            <SelectItem value="Indian">{t("recipe.indian")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cookTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">{t("recipe.cookingTime")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-cooktime">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Any">{t("recipe.any")}</SelectItem>
                            <SelectItem value="15 minutes">{t("recipe.15min")}</SelectItem>
                            <SelectItem value="30 minutes">{t("recipe.30min")}</SelectItem>
                            <SelectItem value="45 minutes">{t("recipe.45min")}</SelectItem>
                            <SelectItem value="1 hour">{t("recipe.1hour")}</SelectItem>
                            <SelectItem value="2+ hours">{t("recipe.2hours")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel className="text-gray-900 font-medium mb-3 block">
                    {t("recipe.dietaryRestrictions")}
                  </FormLabel>
                  <RadioGroup
                    value={selectedDietaryRestrictions[0] || ""}
                    onValueChange={(value) => {
                      setSelectedDietaryRestrictions(value ? [value] : []);
                    }}
                    className="flex flex-wrap gap-4"
                  >
                    {[
                      { value: "Vegetarian", label: t("recipe.vegetarian") },
                      { value: "Vegan", label: t("recipe.vegan") },
                      { value: "Gluten-Free", label: t("recipe.glutenFree") },
                      { value: "Dairy-Free", label: t("recipe.dairyFree") },
                      { value: "Keto", label: t("recipe.keto") }
                    ].map((restriction) => (
                      <div key={restriction.value} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={restriction.value}
                          id={restriction.value}
                          data-testid={`radio-${restriction.value.toLowerCase().replace('-', '')}`}
                        />
                        <Label htmlFor={restriction.value} className="cursor-pointer font-normal">
                          {restriction.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-recipe"
                >
                  {generateMutation.isPending ? (
                    t("recipe.generating")
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {t("recipe.generateButton")}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </Card>
        )}

        {currentStep === 2 && recipe && (
          <Card className="p-8 bg-white">
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-recipe-title">
              {recipe.title}
            </h1>
            <p className="text-gray-600 mb-6" data-testid="text-recipe-summary">
              {recipe.summary}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div>
                <p className="text-sm text-gray-500">{t("recipe.servings")}</p>
                <p className="text-lg font-semibold">{recipe.servings}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("recipe.cookingTime")}</p>
                <p className="text-lg font-semibold">{recipe.cookTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("recipe.cuisineStyle")}</p>
                <p className="text-lg font-semibold">{recipe.cuisine}</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t("recipe.ingredients")}</h2>
              <ul className="space-y-2">
                {recipe.parsedIngredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start" data-testid={`ingredient-${index}`}>
                    <span className="text-blue-600 mr-2">•</span>
                    <span>
                      {ingredient.quantity} {ingredient.unit} {ingredient.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t("recipe.instructions")}</h2>
              <ol className="space-y-4">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex" data-testid={`step-${index}`}>
                    <span className="font-semibold text-blue-600 mr-3">{index + 1}.</span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  setRecipe(null);
                  form.reset();
                }}
                variant="outline"
                data-testid="button-generate-another"
              >
                {t("recipe.generateAnother")}
              </Button>
              <Button
                onClick={createShoppingList}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-create-shopping-list"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {t("recipe.createShoppingList")}
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 3 && shoppingList.length > 0 && (
          <Card className="p-8 bg-white">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {t("recipe.shoppingList")}
            </h1>

            <div className="space-y-3 mb-8">
              {shoppingList.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    item.acquired
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => toggleItemAcquired(item.id)}
                  data-testid={`shopping-item-${item.id}`}
                >
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      item.acquired
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {item.acquired && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${item.acquired ? "line-through text-gray-500" : "text-gray-900"}`}>
                      {item.ingredientName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep(2)}
                variant="outline"
                data-testid="button-back-to-recipe"
              >
                {t("recipe.backToRecipe")}
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-compare-prices"
              >
                <TrendingDown className="mr-2 h-4 w-4" />
                {t("recipe.comparePrices")}
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 4 && <PriceComparisonView shoppingList={shoppingList} />}

      </div>

      <Footer />
    </div>
  );
}

function PriceComparisonView({ shoppingList }: { shoppingList: ShoppingListItem[] }) {
  const { t } = useLanguage();
  
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

  // Generate mock price quotes for each ingredient
  const priceQuotes: PriceQuote[] = useMemo(() => {
    const quotes: PriceQuote[] = [];
    shoppingList.forEach((item, itemIndex) => {
      stores.forEach((store, storeIndex) => {
        const basePrice = 5000 + Math.random() * 45000;
        const variation = storeIndex === 0 ? 0.9 : storeIndex === 1 ? 1.1 : 1.0;
        quotes.push({
          id: `quote-${itemIndex}-${storeIndex}`,
          ingredientName: item.ingredientName,
          storeId: store.id,
          price: Math.round(basePrice * variation / 100) * 100,
          unitSize: `${item.quantity} ${item.unit}`,
          currency: "IDR",
        });
      });
    });
    return quotes;
  }, [shoppingList]);

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
    <Card className="p-8 bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-6" data-testid="text-price-comparison-title">
        {t("priceComparison.title")}
      </h1>

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
            {shoppingList.map((item) => {
              const itemQuotes = priceQuotes.filter(
                (q) => q.ingredientName === item.ingredientName
              );
              const bestPrice = Math.min(...itemQuotes.map((q) => q.price));

              return (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900" data-testid={`ingredient-${item.id}`}>
                    <div>
                      <div className="font-medium">{item.ingredientName}</div>
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
    </Card>
  );
}

function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: countData } = useQuery({
    queryKey: ["/api/waitlist/count"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/waitlist/count");
      return (await response.json()) as { count: number };
    },
  });

  const joinWaitlistMutation = useMutation({
    mutationFn: async (data: { email: string; name?: string }) => {
      const response = await apiRequest("POST", "/api/waitlist", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist/count"] });
      toast({
        title: t("waitlist.successTitle"),
        description: t("waitlist.successMessage"),
      });
      setEmail("");
      setName("");
    },
    onError: () => {
      toast({
        title: t("waitlist.errorTitle"),
        description: t("waitlist.errorMessage"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      joinWaitlistMutation.mutate({ email, name: name.trim() || undefined });
    }
  };

  const displayCount = countData?.count || 0;

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 py-8 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-3">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span className="text-xs font-medium text-white">{t("waitlist.comingSoon")}</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight" data-testid="text-waitlist-title">
            {t("waitlist.title")}
          </h2>
          <p className="text-base text-blue-100 mb-4" data-testid="text-waitlist-count">
            {displayCount > 0 
              ? t("waitlist.joinCount").replace("{count}", displayCount.toLocaleString())
              : t("waitlist.beFirst")}
          </p>

          {/* Features List */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6 text-sm text-white/90">
            <div className="flex items-center gap-1.5">
              <span className="text-green-300">✓</span>
              <span>{t("waitlist.feature.priceAlerts")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-300">✓</span>
              <span>{t("waitlist.feature.smartCart")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-300">✓</span>
              <span>{t("waitlist.feature.pantrySync")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-300">✓</span>
              <span>{t("waitlist.feature.mealPlanner")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-300">✓</span>
              <span>{t("waitlist.feature.photoScan")}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <Input
              type="text"
              placeholder={t("waitlist.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/95 backdrop-blur border-white/20 h-11 text-sm"
              data-testid="input-waitlist-name"
            />
            <Input
              type="email"
              placeholder={t("waitlist.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/95 backdrop-blur border-white/20 h-11 text-sm"
              data-testid="input-waitlist-email"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold h-11 text-sm shadow-lg hover:shadow-xl transition-all"
            disabled={joinWaitlistMutation.isPending}
            data-testid="button-join-waitlist"
          >
            {joinWaitlistMutation.isPending ? t("waitlist.buttonJoining") : t("waitlist.button")}
          </Button>
          <p className="text-xs text-white/70 mt-2 text-center">
            By submitting, I agree that my data (email) may be processed and stored securely on Replit's servers located.
          </p>
        </form>
      </div>
    </div>
  );
}
