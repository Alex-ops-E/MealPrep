import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Store as StoreIcon, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RecipeWithDetails } from "@shared/schema";

type Step = 1 | 2 | 3 | 4;

interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  acquired: boolean;
}

interface Store {
  id: string;
  name: string;
  logo: string;
}

interface PriceQuote {
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
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  
  const { toast } = useToast();
  const { t } = useLanguage();

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
      // Create shopping list from ingredients
      const items: ShoppingListItem[] = data.parsedIngredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        acquired: false,
      }));
      setShoppingList(items);
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
                onClick={() => setCurrentStep(3)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-continue-shop"
              >
                {t("recipe.continueToShop")}
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  setRecipe(null);
                  setShoppingList([]);
                  form.reset();
                }}
                variant="outline"
                data-testid="button-generate-another"
              >
                {t("recipe.generateAnother")}
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 3 && recipe && (
          <Card className="p-8 bg-white">
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-shopping-list-title">
              {t("recipe.shoppingListTitle")}
            </h1>
            <p className="text-gray-600 mb-6">
              {t("recipe.shoppingListDescription")}
            </p>

            <div className="space-y-4 mb-8">
              {shoppingList.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  data-testid={`shopping-item-${index}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={item.acquired}
                      onChange={(e) => {
                        const updated = [...shoppingList];
                        updated[index].acquired = e.target.checked;
                        setShoppingList(updated);
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      data-testid={`checkbox-item-${index}`}
                    />
                    <div className={item.acquired ? "line-through text-gray-400" : ""}>
                      <span className="font-medium">{item.quantity} {item.unit} {item.name}</span>
                    </div>
                  </div>
                  {item.acquired && (
                    <span className="text-sm text-green-600 font-medium">{t("recipe.acquired")}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-continue-compare"
              >
                {t("recipe.continueToPriceComparison")}
              </Button>
              <Button
                onClick={() => setCurrentStep(2)}
                variant="outline"
                data-testid="button-back-recipe"
              >
                {t("recipe.viewRecipe")}
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 4 && recipe && (
          <Card className="p-8 bg-white">
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-price-comparison-title">
              {t("recipe.priceComparisonTitle")}
            </h1>
            <p className="text-gray-600 mb-6">
              {t("recipe.priceComparisonDescription")}
            </p>

            <PriceComparisonView shoppingList={shoppingList} t={t} />

            <div className="flex gap-4 mt-8">
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  setRecipe(null);
                  setShoppingList([]);
                  form.reset();
                }}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-start-over"
              >
                {t("recipe.startOver")}
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                variant="outline"
                data-testid="button-back-shop"
              >
                {t("recipe.shop")}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}

function PriceComparisonView({ shoppingList, t }: { shoppingList: ShoppingListItem[], t: (key: string) => string }) {
  // Mock store data (in-memory, not saved to database)
  const stores: Store[] = [
    { id: "1", name: "Superindo", logo: "🏪" },
    { id: "2", name: "Alfamart", logo: "🏬" },
    { id: "3", name: "Indomaret", logo: "🛒" },
  ];

  // Generate stable mock prices using useMemo to avoid regeneration on re-renders
  const allPrices = useMemo(() => {
    return shoppingList.map(item => {
      return stores.map(store => ({
        ingredientName: item.name,
        storeId: store.id,
        price: Math.floor(Math.random() * 50000) + 10000,
        unitSize: `${item.quantity} ${item.unit}`,
        currency: "IDR",
      }));
    });
  }, [shoppingList]);

  // Calculate total basket price for each store
  const storeTotals = stores.map(store => {
    const total = allPrices.reduce((sum, itemPrices) => {
      const price = itemPrices.find(p => p.storeId === store.id)?.price || 0;
      return sum + price;
    }, 0);
    return { storeId: store.id, total };
  });

  const sortedStoreTotals = [...storeTotals].sort((a, b) => a.total - b.total);
  const bestValueStoreId = sortedStoreTotals[0]?.storeId;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900" data-testid="text-comparison-header">
          {t("recipe.priceComparisonResults")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" data-testid="button-share">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Store Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stores.map(store => {
          const storeTotal = storeTotals.find(t => t.storeId === store.id);
          const isBestValue = store.id === bestValueStoreId;
          const priceDiff = storeTotal && bestValueStoreId !== store.id
            ? storeTotal.total - (storeTotals.find(t => t.storeId === bestValueStoreId)?.total || 0)
            : 0;

          return (
            <Card
              key={store.id}
              className={`p-6 relative ${isBestValue ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}
              data-testid={`store-card-${store.id}`}
            >
              {isBestValue && (
                <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded" data-testid="badge-best-value">
                  Best Value
                </div>
              )}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{store.logo}</span>
                  <h3 className="text-lg font-semibold">{store.name}</h3>
                </div>
                <p className="text-sm text-gray-600">Total for {shoppingList.length} items</p>
              </div>
              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">
                  IDR {storeTotal?.total.toLocaleString()}
                </p>
                {priceDiff > 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    IDR {priceDiff.toLocaleString()} more expensive
                  </p>
                )}
              </div>
              <Button
                className={`w-full ${isBestValue ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-500 hover:bg-orange-600"}`}
                data-testid={`button-shop-${store.id}`}
              >
                Shop at {store.name}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Detailed Breakdown Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">ITEM</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">QUANTITY</th>
              {stores.map(store => (
                <th key={store.id} className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  {store.name.toUpperCase()} PRICE
                </th>
              ))}
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">BEST DEAL</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shoppingList.map((item, idx) => {
              const itemPrices = allPrices[idx];
              const lowestPrice = Math.min(...itemPrices.map(p => p.price));
              const bestDealStore = stores.find(store => 
                itemPrices.find(p => p.storeId === store.id && p.price === lowestPrice)
              );

              return (
                <tr key={idx} className="hover:bg-gray-50" data-testid={`row-item-${idx}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-2xl">
                        🥘
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {item.quantity} {item.unit}
                  </td>
                  {stores.map(store => {
                    const price = itemPrices.find(p => p.storeId === store.id);
                    return (
                      <td key={store.id} className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          IDR {price?.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">{price?.unitSize}</div>
                      </td>
                    );
                  })}
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {bestDealStore?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      variant={bestDealStore?.id === stores[0].id ? "default" : "outline"}
                      data-testid={`button-action-${idx}`}
                    >
                      {bestDealStore?.id === stores[0].id ? "Search" : "Buy Now"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
        </form>
      </div>
    </div>
  );
}
