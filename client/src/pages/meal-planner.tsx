import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Plus, ChevronLeft, ChevronRight, ShoppingCart, Sparkles, Trash2, ChefHat, Home, TrendingUp, Globe, Flame, Dumbbell, Edit, MessageSquare, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Meal, Recipe } from "@shared/schema";
import Header from "@/components/header";

interface MealWithRecipe extends Meal {
  recipe?: Recipe;
}

interface RecommendedMeal {
  id: string;
  type: "breakfast" | "lunch" | "dinner";
  restaurant: string;
  dishName: string;
  calories: number;
  protein: number;
  price: number;
}

const SAMPLE_MEALS: RecommendedMeal[] = [
  { id: "1", type: "breakfast", restaurant: "Fresh Kitchen", dishName: "Avocado Toast with Eggs", calories: 420, protein: 18, price: 35 },
  { id: "2", type: "breakfast", restaurant: "Healthy Choice", dishName: "Greek Yogurt Parfait", calories: 320, protein: 22, price: 28 },
  { id: "3", type: "breakfast", restaurant: "Morning Bliss", dishName: "Protein Smoothie Bowl", calories: 380, protein: 25, price: 32 },
  { id: "4", type: "lunch", restaurant: "Green Garden", dishName: "Grilled Chicken Salad", calories: 480, protein: 35, price: 45 },
  { id: "5", type: "lunch", restaurant: "Protein House", dishName: "Salmon with Quinoa", calories: 520, protein: 42, price: 58 },
  { id: "6", type: "lunch", restaurant: "Home Style", dishName: "Mediterranean Bowl", calories: 450, protein: 28, price: 42 },
  { id: "7", type: "dinner", restaurant: "Protein House", dishName: "Grilled Steak & Vegetables", calories: 620, protein: 48, price: 65 },
  { id: "8", type: "dinner", restaurant: "Healthy Choice", dishName: "Baked Salmon with Quinoa", calories: 550, protein: 40, price: 58 },
  { id: "9", type: "dinner", restaurant: "Home Style", dishName: "Chicken Tikka Masala", calories: 580, protein: 35, price: 42 },
];

const WEEKDAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

function getWeekDates(weekOffset: number = 0) {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setDate(monday.getDate() + (weekOffset * 7));
  
  const dates: Record<string, Date> = {};
  WEEKDAY_KEYS.forEach((dayName, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    dates[dayName] = date;
  });
  
  return { dates, monday };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

export default function MealPlanner() {
  const { t, language } = useLanguage();
  const [location, setLocationNav] = useLocation();
  const { toast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; type: string; mode: 'add' | 'generate' } | null>(null);
  const [mealPrompt, setMealPrompt] = useState("");
  const [servings, setServings] = useState(2);
  const [meals, setMeals] = useState<MealWithRecipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"recommendations" | "weekly">("recommendations");
  
  const isRTL = language === "ar";
  
  const translations: Record<string, Record<string, string>> = {
    en: {
      "mp.myCustomPlan": "My Custom Meal Plan",
      "mp.planDescription": "Your personalized meal plan is balanced, calorie-counted, and optimized for your preferences. Fresh ingredients from your favorite stores.",
      "mp.recommendedBreakfast": "Recommended Breakfast Meals",
      "mp.recommendedLunch": "Recommended Lunch Meals",
      "mp.recommendedDinner": "Recommended Dinner Meals",
      "mp.customize": "Customize",
      "mp.addNote": "Add a note",
      "mp.swapMeal": "Swap meal",
      "mp.totalSavings": "Total savings: AED 45",
      "mp.viewCart": "View Cart",
      "mp.recommendations": "Recommendations",
      "mp.weeklyPlan": "Weekly Plan",
    },
    ar: {
      "mp.myCustomPlan": "خطة وجباتي المخصصة",
      "mp.planDescription": "خطة وجباتك الشخصية متوازنة ومحسوبة السعرات ومُحسّنة وفقاً لتفضيلاتك. مكونات طازجة من متاجرك المفضلة.",
      "mp.recommendedBreakfast": "وجبات الإفطار الموصى بها",
      "mp.recommendedLunch": "وجبات الغداء الموصى بها",
      "mp.recommendedDinner": "وجبات العشاء الموصى بها",
      "mp.customize": "تخصيص",
      "mp.addNote": "إضافة ملاحظة",
      "mp.swapMeal": "تبديل الوجبة",
      "mp.totalSavings": "إجمالي التوفير: 45 درهم",
      "mp.viewCart": "عرض السلة",
      "mp.recommendations": "التوصيات",
      "mp.weeklyPlan": "الخطة الأسبوعية",
    }
  };
  
  const tf = (key: string) => translations[language]?.[key] || translations.en[key] || key;
  
  const handleLanguageChange = (newLang: "en" | "ar") => {
    const currentPath = location.replace(/^\/(en|ar)/, '');
    setLocationNav(`/${newLang}${currentPath || ''}`);
  };
  
  const { dates: weekDates, monday } = getWeekDates(weekOffset);
  const sunday = weekDates.sunday;
  
  const generateMeal = async (params: { dayKey: string; type: string; prompt: string; servings: number }) => {
    setIsGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/recipes/generate", {
        craving: params.prompt,
        servings: params.servings,
        cuisine: "any",
        cookTime: "30-60min",
        dietaryRestrictions: []
      });
      
      const recipe = await res.json();
      
      const newMeal: MealWithRecipe = {
        id: `meal_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        dayKey: params.dayKey,
        type: params.type,
        name: recipe.title,
        recipeId: recipe.id,
        recipe: recipe,
        createdAt: new Date()
      };
      
      setMeals(prev => [...prev.filter(m => !(m.dayKey === params.dayKey && m.type === params.type)), newMeal]);
      setSelectedSlot(null);
      setMealPrompt("");
      
      toast({
        title: t("mealPlanner.successTitle"),
        description: t("mealPlanner.successMessage")
      });
    } catch (error) {
      toast({
        title: t("mealPlanner.errorTitle"),
        description: error instanceof Error ? error.message : "Failed to generate meal",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const deleteMeal = (mealId: string) => {
    setMeals(prev => prev.filter(m => m.id !== mealId));
    toast({
      title: t("mealPlanner.deletedTitle"),
      description: t("mealPlanner.deletedMessage")
    });
  };
  
  const getMealForSlot = (day: string, type: string): MealWithRecipe | undefined => {
    const date = weekDates[day as keyof typeof weekDates];
    const dayKey = formatDate(date);
    return meals.find(m => m.dayKey === dayKey && m.type === type);
  };
  
  const handleOpenDialog = (day: string, type: string, mode: 'add' | 'generate') => {
    setSelectedSlot({ day, type, mode });
    setMealPrompt("");
  };
  
  const handleQuickGenerate = (day: string, type: string) => {
    const date = weekDates[day as keyof typeof weekDates];
    const dayKey = formatDate(date);
    
    generateMeal({
      dayKey,
      type,
      prompt: `a delicious ${type} meal`,
      servings: 2
    });
  };
  
  const handleGenerateMeal = () => {
    if (!selectedSlot) return;
    
    const date = weekDates[selectedSlot.day as keyof typeof weekDates];
    const dayKey = formatDate(date);
    
    const prompt = mealPrompt.trim() || `a delicious ${selectedSlot.type} meal`;
    
    generateMeal({
      dayKey,
      type: selectedSlot.type,
      prompt,
      servings
    });
  };
  
  const getFilteredMeals = (type: "breakfast" | "lunch" | "dinner") => {
    return SAMPLE_MEALS.filter(meal => meal.type === type);
  };
  
  const renderMealCard = (meal: RecommendedMeal) => (
    <Card key={meal.id} className="p-4 bg-white shadow-sm border border-gray-100" data-testid={`card-meal-${meal.id}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm text-gray-500">{meal.restaurant}</p>
          <h4 className="font-semibold text-gray-900">{meal.dishName}</h4>
        </div>
        <span className="text-lg font-bold text-orange-600">{meal.price} AED</span>
      </div>
      
      <div className="flex gap-4 text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-1">
          <Flame className="h-4 w-4 text-red-500" />
          {meal.calories} kcal
        </span>
        <span className="flex items-center gap-1">
          <Dumbbell className="h-4 w-4 text-blue-500" />
          {meal.protein}g protein
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="text-xs" data-testid={`button-customize-${meal.id}`}>
          <Edit className="h-3 w-3 mr-1" />
          {tf("mp.customize")}
        </Button>
        <Button variant="outline" size="sm" className="text-xs" data-testid={`button-note-${meal.id}`}>
          <MessageSquare className="h-3 w-3 mr-1" />
          {tf("mp.addNote")}
        </Button>
        <Button variant="outline" size="sm" className="text-xs" data-testid={`button-swap-${meal.id}`}>
          <RefreshCw className="h-3 w-3 mr-1" />
          {tf("mp.swapMeal")}
        </Button>
      </div>
    </Card>
  );
  
  const today = new Date();
  
  return (
    <div className={`min-h-screen bg-gray-50 overflow-x-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-orange-100 text-orange-600 p-2 sm:p-3 rounded-lg">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900" data-testid="text-page-title">
                {t("mealPlanner.title")}
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm hidden sm:block" data-testid="text-page-description">
                {t("mealPlanner.description")}
              </p>
            </div>
          </div>
          
        </div>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "recommendations" | "weekly")} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="recommendations" data-testid="tab-recommendations">
                {tf("mp.recommendations")}
              </TabsTrigger>
              <TabsTrigger value="weekly" data-testid="tab-weekly">
                {tf("mp.weeklyPlan")}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recommendations" className="space-y-8">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2" data-testid="text-plan-title">
                  {tf("mp.myCustomPlan")}
                </h2>
                <p className="text-orange-100">
                  {tf("mp.planDescription")}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="text-breakfast-section">
                  {tf("mp.recommendedBreakfast")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredMeals("breakfast").map(renderMealCard)}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="text-lunch-section">
                  {tf("mp.recommendedLunch")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredMeals("lunch").map(renderMealCard)}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="text-dinner-section">
                  {tf("mp.recommendedDinner")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredMeals("dinner").map(renderMealCard)}
                </div>
              </div>

              <div className="h-20" />
              
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                  <span className="text-green-600 font-medium">{tf("mp.totalSavings")}</span>
                  <Button className="bg-orange-600 hover:bg-orange-700" data-testid="button-view-cart">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {tf("mp.viewCart")}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="weekly">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWeekOffset(weekOffset - 1)}
                  data-testid="button-prev-week"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500">{t("mealPlanner.weekOf")}</div>
                  <div className="text-lg font-semibold text-gray-900" data-testid="text-week-range">
                    {monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWeekOffset(weekOffset + 1)}
                  data-testid="button-next-week"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
                {WEEKDAY_KEYS.map(day => {
                  const dayDate = weekDates[day];
                  const isToday = isSameDay(dayDate, today);
                  
                  return (
                    <div
                      key={day}
                      className={`bg-white rounded-lg border-2 transition-all ${
                        isToday ? 'border-blue-400 shadow-md' : 'border-gray-200'
                      }`}
                      data-testid={`card-${day}`}
                    >
                      <div className="p-4 border-b">
                        <div className={`font-semibold capitalize ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {t(`mealPlanner.${day}`)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      
                      <div className="p-3 space-y-4">
                        {MEAL_TYPES.map(type => {
                          const meal = getMealForSlot(day, type);
                          
                          return (
                            <div key={type} className="space-y-2">
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide" data-testid={`label-${day}-${type}`}>
                                {t(`mealPlanner.${type}`)}
                              </div>
                              
                              {meal ? (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 relative group">
                                  <div className="pr-6">
                                    <div className="flex items-start gap-2 mb-1">
                                      <ChefHat className="h-3.5 w-3.5 text-purple-600 mt-0.5 flex-shrink-0" />
                                      {meal.recipeId ? (
                                        <Link href={`/${language}/recipe/${meal.recipeId}`}>
                                          <h4 className="font-medium text-xs text-purple-700 hover:text-purple-900 underline cursor-pointer line-clamp-2" data-testid={`text-meal-${meal.id}`}>
                                            {meal.name}
                                          </h4>
                                        </Link>
                                      ) : (
                                        <h4 className="font-medium text-xs text-gray-900 line-clamp-2" data-testid={`text-meal-${meal.id}`}>
                                          {meal.name}
                                        </h4>
                                      )}
                                    </div>
                                    {meal.recipe && (
                                      <div className="text-xs text-gray-600 ml-5">
                                        {meal.recipe.cookTime}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteMeal(meal.id)}
                                    data-testid={`button-delete-${meal.id}`}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Dialog 
                                    open={selectedSlot?.day === day && selectedSlot?.type === type && selectedSlot?.mode === 'add'} 
                                    onOpenChange={(open) => {
                                      if (!open) {
                                        setSelectedSlot(null);
                                        setMealPrompt("");
                                      }
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9 text-xs border-dashed hover:bg-gray-50"
                                        onClick={() => handleOpenDialog(day, type, 'add')}
                                        data-testid={`button-add-${day}-${type}`}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        {t("mealPlanner.add")}
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent data-testid="dialog-add-meal">
                                      <DialogHeader>
                                        <DialogTitle>{t("mealPlanner.addMeal")}</DialogTitle>
                                        <DialogDescription>
                                          {t("mealPlanner.addMealDescription", {
                                            day: t(`mealPlanner.${day}`),
                                            type: t(`mealPlanner.${type}`)
                                          })}
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="meal-prompt">{t("mealPlanner.whatToMake")}</Label>
                                          <Input
                                            id="meal-prompt"
                                            value={mealPrompt}
                                            onChange={(e) => setMealPrompt(e.target.value)}
                                            placeholder={t("mealPlanner.promptPlaceholder")}
                                            data-testid="input-meal-prompt"
                                          />
                                        </div>
                                        
                                        <div>
                                          <Label htmlFor="servings">{t("recipe.servings")}</Label>
                                          <Select value={servings.toString()} onValueChange={(v) => setServings(parseInt(v))}>
                                            <SelectTrigger id="servings" data-testid="select-servings">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {[1, 2, 3, 4, 5, 6, 8].map(num => (
                                                <SelectItem key={num} value={num.toString()}>
                                                  {num} {num === 1 ? t("recipe.person") : t("recipe.people")}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <Button
                                          className="w-full bg-blue-600 hover:bg-blue-700"
                                          onClick={handleGenerateMeal}
                                          disabled={!mealPrompt.trim() || isGenerating}
                                          data-testid="button-generate-meal"
                                        >
                                          {isGenerating ? t("recipe.generating") : t("mealPlanner.generateMeal")}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-9 text-xs text-purple-600 border-purple-300 hover:bg-purple-50"
                                    onClick={() => handleQuickGenerate(day, type)}
                                    disabled={isGenerating}
                                    data-testid={`button-generate-${day}-${type}`}
                                  >
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {isGenerating ? t("recipe.generating") : t("mealPlanner.generate")}
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
