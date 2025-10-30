import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Plus, ChevronLeft, ChevronRight, ShoppingCart, Sparkles, Trash2, ChefHat } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Meal, Recipe } from "@shared/schema";

interface MealWithRecipe extends Meal {
  recipe?: Recipe;
}

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
  const { t } = useLanguage();
  const { toast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; type: string; mode: 'add' | 'generate' } | null>(null);
  const [mealPrompt, setMealPrompt] = useState("");
  const [servings, setServings] = useState(2);
  
  const { dates: weekDates, monday } = getWeekDates(weekOffset);
  const sunday = weekDates.sunday;
  const startDate = formatDate(monday);
  const endDate = formatDate(new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000));
  
  const { data: meals = [], isLoading } = useQuery<MealWithRecipe[]>({
    queryKey: ["/api/meals/week", startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/meals/week?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error("Failed to fetch meals");
      return response.json();
    }
  });
  
  const generateMealMutation = useMutation({
    mutationFn: async (params: { dayKey: string; type: string; prompt: string; servings: number }) => {
      return apiRequest("POST", "/api/meals/generate", params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals/week", startDate, endDate] });
      setSelectedSlot(null);
      setMealPrompt("");
      toast({
        title: t("mealPlanner.successTitle"),
        description: t("mealPlanner.successMessage")
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("mealPlanner.errorTitle"),
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const deleteMealMutation = useMutation({
    mutationFn: async (mealId: string) => {
      return apiRequest("DELETE", `/api/meals/${mealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals/week", startDate, endDate] });
      toast({
        title: t("mealPlanner.deletedTitle"),
        description: t("mealPlanner.deletedMessage")
      });
    }
  });
  
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
    
    generateMealMutation.mutate({
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
    
    generateMealMutation.mutate({
      dayKey,
      type: selectedSlot.type,
      prompt,
      servings
    });
  };
  
  const today = new Date();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
                  {t("mealPlanner.title")}
                </h1>
                <p className="text-gray-600 text-sm" data-testid="text-page-description">
                  {t("mealPlanner.description")}
                </p>
              </div>
            </div>
            
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2" data-testid="button-generate-shopping-list">
              <ShoppingCart className="h-4 w-4" />
              {t("mealPlanner.generateShoppingList")}
            </Button>
          </div>
          
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
                        
                        {isLoading ? (
                          <Skeleton className="h-20 w-full" />
                        ) : meal ? (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 relative group">
                            <div className="pr-6">
                              <div className="flex items-start gap-2 mb-1">
                                <ChefHat className="h-3.5 w-3.5 text-purple-600 mt-0.5 flex-shrink-0" />
                                {meal.recipeId ? (
                                  <Link href={`/recipe/${meal.recipeId}`}>
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
                              onClick={() => deleteMealMutation.mutate(meal.id)}
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
                                    disabled={!mealPrompt.trim() || generateMealMutation.isPending}
                                    data-testid="button-generate-meal"
                                  >
                                    {generateMealMutation.isPending ? t("recipe.generating") : t("mealPlanner.generateMeal")}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9 text-xs text-purple-600 border-purple-300 hover:bg-purple-50"
                              onClick={() => handleQuickGenerate(day, type)}
                              disabled={generateMealMutation.isPending}
                              data-testid={`button-generate-${day}-${type}`}
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              {generateMealMutation.isPending ? t("recipe.generating") : t("mealPlanner.generate")}
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
      </div>
    </div>
  );
}
