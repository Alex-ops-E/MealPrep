import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { apiRequest } from "@/lib/queryClient";
import type { RecipeWithDetails, ShoppingListWithItems, PriceQuoteWithStore } from "@shared/schema";

const generateRecipeFormSchema = z.object({
  craving: z.string().min(1, "Please describe what you'd like to cook"),
  servings: z.coerce.number().min(1).max(20),
  cuisine: z.string().optional(),
  cookTime: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
});

type GenerateRecipeForm = z.infer<typeof generateRecipeFormSchema>;

type Step = 1 | 2 | 3 | 4;

function PriceComparisonStep({ 
  recipe, 
  onBack, 
  onStartOver 
}: { 
  recipe: RecipeWithDetails | null;
  onBack: () => void;
  onStartOver: () => void;
}) {
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(
    recipe?.parsedIngredients[0]?.name || null
  );

  const { data: priceQuotes, isLoading } = useQuery({
    queryKey: ["/api/ingredients", selectedIngredient, "prices"],
    queryFn: async () => {
      if (!selectedIngredient) return [];
      const response = await apiRequest("GET", `/api/ingredients/${encodeURIComponent(selectedIngredient)}/prices?country=ID`);
      return (await response.json()) as PriceQuoteWithStore[];
    },
    enabled: !!selectedIngredient,
  });

  if (!recipe) return null;

  return (
    <Card className="p-8 bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Price Comparison</h1>
      <p className="text-gray-600 mb-6">
        Compare ingredient prices across different stores
      </p>

      <div className="mb-6">
        <Label className="text-gray-900 font-medium mb-3 block">Select Ingredient</Label>
        <Select value={selectedIngredient || ""} onValueChange={setSelectedIngredient}>
          <SelectTrigger data-testid="select-ingredient">
            <SelectValue placeholder="Choose an ingredient" />
          </SelectTrigger>
          <SelectContent>
            {recipe.parsedIngredients.map((ingredient, index) => (
              <SelectItem key={index} value={ingredient.name}>
                {ingredient.quantity} {ingredient.unit} {ingredient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && priceQuotes && priceQuotes.length > 0 && (
        <div className="space-y-3 mb-8">
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
                    Rp {quote.price.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-500">{quote.currency}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && priceQuotes && priceQuotes.length === 0 && selectedIngredient && (
        <div className="text-center py-8 text-gray-500">
          <p>No price data available for {selectedIngredient}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          data-testid="button-back-to-shopping"
        >
          Back to Shopping List
        </Button>
        <Button
          onClick={onStartOver}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="button-start-over"
        >
          Start Over
        </Button>
      </div>
    </Card>
  );
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListWithItems | null>(null);
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<string[]>([]);
  
  const { toast } = useToast();

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
        title: "Recipe generated!",
        description: "Your recipe is ready to view",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
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
    { label: "Healthy & Quick", craving: "a healthy 30-minute meal" },
    { label: "Comfort Food", craving: "comfort food that's hearty and satisfying" },
    { label: "Date Night", craving: "an impressive romantic dinner" },
    { label: "Family Dinner", craving: "a family-friendly dinner everyone will enjoy" },
  ];

  const steps = [
    { number: 1, label: "Generate" },
    { number: 2, label: "View Recipe" },
    { number: 3, label: "Shop" },
    { number: 4, label: "Compare" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentStep={currentStep} />
      
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
              What would you like to cook?
            </h1>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="craving"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 font-medium">
                        Describe your craving
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., a healthy 30-minute chicken meal for dinner"
                          className="h-12"
                          data-testid="input-craving"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="text-gray-900 font-medium mb-3 block">
                    Quick starts
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
                        <FormLabel className="text-gray-900 font-medium">Servings</FormLabel>
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
                                {num} {num === 1 ? "person" : "people"}
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
                        <FormLabel className="text-gray-900 font-medium">Cuisine Style</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-cuisine">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Any">Any</SelectItem>
                            <SelectItem value="Italian">Italian</SelectItem>
                            <SelectItem value="Mexican">Mexican</SelectItem>
                            <SelectItem value="Asian">Asian</SelectItem>
                            <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                            <SelectItem value="American">American</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="Indian">Indian</SelectItem>
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
                        <FormLabel className="text-gray-900 font-medium">Cooking Time</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-cooktime">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Any">Any</SelectItem>
                            <SelectItem value="15 minutes">15 minutes</SelectItem>
                            <SelectItem value="30 minutes">30 minutes</SelectItem>
                            <SelectItem value="45 minutes">45 minutes</SelectItem>
                            <SelectItem value="1 hour">1 hour</SelectItem>
                            <SelectItem value="2+ hours">2+ hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel className="text-gray-900 font-medium mb-3 block">
                    Dietary Restrictions
                  </FormLabel>
                  <RadioGroup
                    value={selectedDietaryRestrictions[0] || ""}
                    onValueChange={(value) => {
                      setSelectedDietaryRestrictions(value ? [value] : []);
                    }}
                    className="flex flex-wrap gap-4"
                  >
                    {["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto"].map((restriction) => (
                      <div key={restriction} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={restriction}
                          id={restriction}
                          data-testid={`radio-${restriction.toLowerCase().replace('-', '')}`}
                        />
                        <Label htmlFor={restriction} className="cursor-pointer font-normal">
                          {restriction}
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
                    "Generating..."
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Recipe with AI
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
                <p className="text-sm text-gray-500">Servings</p>
                <p className="text-lg font-semibold">{recipe.servings}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cook Time</p>
                <p className="text-lg font-semibold">{recipe.cookTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cuisine</p>
                <p className="text-lg font-semibold">{recipe.cuisine}</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h2>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
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
                variant="outline"
                onClick={() => setCurrentStep(1)}
                data-testid="button-back-to-generate"
              >
                Generate Another
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const listResponse = await apiRequest("GET", `/api/shopping-lists/recipe/${recipe.id}`);
                    const existingList = await listResponse.json() as ShoppingListWithItems;
                    setShoppingList(existingList);
                  } catch {
                    const newListResponse = await apiRequest("POST", "/api/shopping-lists", {
                      recipeId: recipe.id,
                      status: "pending",
                    });
                    const newList = await newListResponse.json() as ShoppingListWithItems;
                    
                    for (const ingredient of recipe.parsedIngredients) {
                      await apiRequest("POST", `/api/shopping-lists/${newList.id}/items`, {
                        ingredientName: ingredient.name,
                        quantity: ingredient.quantity,
                        unit: ingredient.unit,
                        acquired: false,
                      });
                    }
                    setShoppingList(newList);
                  }
                  setCurrentStep(3);
                }}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-create-shopping-list"
              >
                Create Shopping List
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 3 && recipe && (
          <Card className="p-8 bg-white">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping List</h1>
            <p className="text-gray-600 mb-6">
              These are the ingredients you'll need to make {recipe.title}
            </p>
            
            <div className="space-y-3 mb-8">
              {recipe.parsedIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 border border-gray-200 rounded-lg"
                  data-testid={`shopping-item-${index}`}
                >
                  <input
                    type="checkbox"
                    className="mr-4 h-5 w-5"
                    data-testid={`checkbox-ingredient-${index}`}
                  />
                  <span className="flex-1">
                    {ingredient.quantity} {ingredient.unit} {ingredient.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                data-testid="button-back-to-recipe"
              >
                Back to Recipe
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-compare-prices"
              >
                Compare Prices
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 4 && recipe && <PriceComparisonStep
          recipe={recipe}
          onBack={() => setCurrentStep(3)}
          onStartOver={() => {
            setCurrentStep(1);
            setRecipe(null);
            setShoppingList(null);
            form.reset();
          }}
        />}
      </div>

      <Footer />
    </div>
  );
}
