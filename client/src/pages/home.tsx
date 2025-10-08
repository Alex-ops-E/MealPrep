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
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RecipeWithDetails } from "@shared/schema";

const generateRecipeFormSchema = z.object({
  craving: z.string().min(1, "Please describe what you'd like to cook"),
  servings: z.coerce.number().min(1).max(20),
  cuisine: z.string().optional(),
  cookTime: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
});

type GenerateRecipeForm = z.infer<typeof generateRecipeFormSchema>;

type Step = 1 | 2;

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
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
                onClick={() => {
                  setCurrentStep(1);
                  setRecipe(null);
                  form.reset();
                }}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-generate-another"
              >
                Generate Another Recipe
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Footer />
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
