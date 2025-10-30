import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Plus, Trash2, ChefHat } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Meal, Recipe } from "@shared/schema";

interface MealWithRecipe extends Meal {
  recipe?: Recipe;
}

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  
  const dates: Record<string, Date> = {};
  DAYS_OF_WEEK.forEach((dayName, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    dates[dayName] = date;
  });
  
  return dates;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function MealPlanner() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; type: string } | null>(null);
  const [mealPrompt, setMealPrompt] = useState("");
  const [servings, setServings] = useState(2);
  
  const weekDates = getWeekDates();
  const startDate = formatDate(weekDates.monday);
  const endDate = formatDate(weekDates.sunday);
  
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
  
  const handleGenerateMeal = () => {
    if (!selectedSlot || !mealPrompt.trim()) return;
    
    const date = weekDates[selectedSlot.day as keyof typeof weekDates];
    const dayKey = formatDate(date);
    
    generateMealMutation.mutate({
      dayKey,
      type: selectedSlot.type,
      prompt: mealPrompt,
      servings
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 text-white p-3 rounded-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
                {t("mealPlanner.title")}
              </h1>
              <p className="text-gray-600" data-testid="text-page-description">
                {t("mealPlanner.description")}
              </p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("mealPlanner.weeklyPlan")}</CardTitle>
            <CardDescription>
              {t("mealPlanner.weekRange", {
                start: weekDates.monday.toLocaleDateString(),
                end: weekDates.sunday.toLocaleDateString()
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-700 w-32">
                      {t("mealPlanner.mealType")}
                    </th>
                    {DAYS_OF_WEEK.map(day => (
                      <th key={day} className="text-center p-3 font-semibold text-gray-700" data-testid={`header-${day}`}>
                        <div className="capitalize">{t(`mealPlanner.${day}`)}</div>
                        <div className="text-xs text-gray-500 font-normal">
                          {weekDates[day].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MEAL_TYPES.map(type => (
                    <tr key={type} className="border-b">
                      <td className="p-3 font-medium text-gray-700 capitalize bg-gray-50" data-testid={`label-${type}`}>
                        {t(`mealPlanner.${type}`)}
                      </td>
                      {DAYS_OF_WEEK.map(day => {
                        const meal = getMealForSlot(day, type);
                        
                        return (
                          <td key={`${day}-${type}`} className="p-2" data-testid={`cell-${day}-${type}`}>
                            {isLoading ? (
                              <Skeleton className="h-24 w-full" />
                            ) : meal ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 min-h-24 relative group">
                                <div className="pr-8">
                                  <div className="flex items-start gap-2 mb-1">
                                    <ChefHat className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2" data-testid={`text-meal-${meal.id}`}>
                                      {meal.name}
                                    </h4>
                                  </div>
                                  {meal.recipe && (
                                    <div className="text-xs text-gray-600 ml-6 space-y-0.5">
                                      <div>{meal.recipe.cookTime}</div>
                                      <div>{meal.recipe.servings} {t("recipe.people")}</div>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => deleteMealMutation.mutate(meal.id)}
                                  data-testid={`button-delete-${meal.id}`}
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <Dialog open={selectedSlot?.day === day && selectedSlot?.type === type} onOpenChange={(open) => {
                                if (!open) {
                                  setSelectedSlot(null);
                                  setMealPrompt("");
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                                    onClick={() => setSelectedSlot({ day, type })}
                                    data-testid={`button-add-${day}-${type}`}
                                  >
                                    <Plus className="h-5 w-5 text-gray-400" />
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
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
