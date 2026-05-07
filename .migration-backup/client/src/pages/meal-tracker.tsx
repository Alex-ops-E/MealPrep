import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Loader2, 
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Flame
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { MealLog } from "@shared/schema";
import Header from "@/components/header";

const WEEKDAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

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

export default function MealTracker() {
  const { language, t, isRTL } = useLanguage();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; mealType: typeof MEAL_TYPES[number] } | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [analyzedNutrition, setAnalyzedNutrition] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  
  const [manualForm, setManualForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const { dates: weekDates, monday } = getWeekDates(weekOffset);
  const sunday = weekDates.sunday;

  const translations: Record<string, Record<string, string>> = {
    en: {
      "mt.title": "Meal Tracker",
      "mt.weekOf": "Week of",
      "mt.logMeal": "Log Your Meal",
      "mt.photoMode": "Photo",
      "mt.manualMode": "Manual",
      "mt.uploadPhoto": "Tap to upload food photo",
      "mt.uploadHint": "AI analyzes calories",
      "mt.analyzing": "Analyzing...",
      "mt.foodName": "Food Name",
      "mt.foodNamePlaceholder": "e.g., Grilled Chicken",
      "mt.calories": "Calories",
      "mt.protein": "Protein (g)",
      "mt.carbs": "Carbs (g)",
      "mt.fat": "Fat (g)",
      "mt.save": "Save",
      "mt.cancel": "Cancel",
      "mt.breakfast": "Breakfast",
      "mt.lunch": "Lunch",
      "mt.dinner": "Dinner",
      "mt.snack": "Snack",
      "mt.monday": "Mon",
      "mt.tuesday": "Tue",
      "mt.wednesday": "Wed",
      "mt.thursday": "Thu",
      "mt.friday": "Fri",
      "mt.saturday": "Sat",
      "mt.sunday": "Sun",
      "mt.mondayFull": "Monday",
      "mt.tuesdayFull": "Tuesday",
      "mt.wednesdayFull": "Wednesday",
      "mt.thursdayFull": "Thursday",
      "mt.fridayFull": "Friday",
      "mt.saturdayFull": "Saturday",
      "mt.sundayFull": "Sunday",
      "mt.today": "Today",
      "mt.dailyTotal": "Daily",
      "mt.weeklyTotal": "Weekly",
      "mt.kcal": "kcal",
      "mt.saved": "Saved!",
      "mt.savedDescription": "Meal logged",
      "mt.deleted": "Deleted",
      "mt.deletedDescription": "Meal removed",
      "mt.analyzeError": "Analysis failed",
      "mt.saveError": "Save failed",
      "mt.fillRequired": "Name & calories required",
      "mt.addMeal": "Add",
    },
    ar: {
      "mt.title": "متتبع الوجبات",
      "mt.weekOf": "أسبوع",
      "mt.logMeal": "سجل وجبتك",
      "mt.photoMode": "صورة",
      "mt.manualMode": "يدوي",
      "mt.uploadPhoto": "اضغط لرفع صورة",
      "mt.uploadHint": "تحليل ذكي للسعرات",
      "mt.analyzing": "جاري التحليل...",
      "mt.foodName": "اسم الطعام",
      "mt.foodNamePlaceholder": "مثال: دجاج مشوي",
      "mt.calories": "السعرات",
      "mt.protein": "بروتين (غ)",
      "mt.carbs": "كربوهيدرات (غ)",
      "mt.fat": "دهون (غ)",
      "mt.save": "حفظ",
      "mt.cancel": "إلغاء",
      "mt.breakfast": "إفطار",
      "mt.lunch": "غداء",
      "mt.dinner": "عشاء",
      "mt.snack": "خفيفة",
      "mt.monday": "الإثنين",
      "mt.tuesday": "الثلاثاء",
      "mt.wednesday": "الأربعاء",
      "mt.thursday": "الخميس",
      "mt.friday": "الجمعة",
      "mt.saturday": "السبت",
      "mt.sunday": "الأحد",
      "mt.mondayFull": "الإثنين",
      "mt.tuesdayFull": "الثلاثاء",
      "mt.wednesdayFull": "الأربعاء",
      "mt.thursdayFull": "الخميس",
      "mt.fridayFull": "الجمعة",
      "mt.saturdayFull": "السبت",
      "mt.sundayFull": "الأحد",
      "mt.today": "اليوم",
      "mt.dailyTotal": "يومي",
      "mt.weeklyTotal": "أسبوعي",
      "mt.kcal": "سعرة",
      "mt.saved": "تم الحفظ!",
      "mt.savedDescription": "تم تسجيل الوجبة",
      "mt.deleted": "تم الحذف",
      "mt.deletedDescription": "تمت إزالة الوجبة",
      "mt.analyzeError": "فشل التحليل",
      "mt.saveError": "فشل الحفظ",
      "mt.fillRequired": "الاسم والسعرات مطلوبة",
      "mt.addMeal": "إضافة",
    }
  };

  const tf = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation(`/${language}/room`);
    }
  }, [authLoading, isAuthenticated, language, setLocation]);

  const startDate = formatDate(monday);
  const endDate = formatDate(sunday);

  const { data: mealLogs = [], isLoading: logsLoading } = useQuery<MealLog[]>({
    queryKey: ["/api/meal-logs", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/meal-logs?startDate=${startDate}&endDate=${endDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch meal logs");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const res = await apiRequest("POST", "/api/meal-logs/analyze", { image: imageData });
      return res.json();
    },
    onSuccess: (data) => {
      setAnalyzedNutrition(data);
    },
    onError: (error) => {
      toast({
        title: tf("mt.analyzeError"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (mealData: any) => {
      const res = await apiRequest("POST", "/api/meal-logs", mealData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-logs"] });
      toast({
        title: tf("mt.saved"),
        description: tf("mt.savedDescription"),
      });
      resetForm();
      setSelectedSlot(null);
    },
    onError: (error) => {
      toast({
        title: tf("mt.saveError"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/meal-logs/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-logs"] });
      toast({
        title: tf("mt.deleted"),
        description: tf("mt.deletedDescription"),
      });
    },
  });

  const resetForm = () => {
    setPreviewImage(null);
    setAnalyzedNutrition(null);
    setManualForm({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });
    setIsManualMode(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      analyzeMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!selectedSlot) return;
    
    const dayDate = formatDate(weekDates[selectedSlot.day as keyof typeof weekDates]);
    
    if (isManualMode) {
      if (!manualForm.name || !manualForm.calories) {
        toast({
          title: tf("mt.fillRequired"),
          variant: "destructive",
        });
        return;
      }
      saveMutation.mutate({
        name: manualForm.name,
        mealType: selectedSlot.mealType,
        calories: parseInt(manualForm.calories) || 0,
        protein: parseInt(manualForm.protein) || 0,
        carbs: parseInt(manualForm.carbs) || 0,
        fat: parseInt(manualForm.fat) || 0,
        inputType: "manual",
        logDate: dayDate,
      });
    } else if (analyzedNutrition) {
      saveMutation.mutate({
        name: analyzedNutrition.name,
        mealType: selectedSlot.mealType,
        calories: analyzedNutrition.calories,
        protein: analyzedNutrition.protein,
        carbs: analyzedNutrition.carbs,
        fat: analyzedNutrition.fat,
        photoUrl: previewImage,
        inputType: "photo",
        logDate: dayDate,
      });
    }
  };

  const getMealsForSlot = (dayKey: string, mealType: string): MealLog[] => {
    const dayDate = formatDate(weekDates[dayKey as keyof typeof weekDates]);
    return mealLogs.filter(log => log.logDate === dayDate && log.mealType === mealType);
  };

  const getDayTotals = (dayKey: string) => {
    const dayDate = formatDate(weekDates[dayKey as keyof typeof weekDates]);
    const dayMeals = mealLogs.filter(log => log.logDate === dayDate);
    return dayMeals.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const weeklyTotals = mealLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const isToday = (dayKey: string) => {
    return isSameDay(weekDates[dayKey as keyof typeof weekDates], new Date());
  };

  const selectedDayKey = WEEKDAY_KEYS[selectedDayIndex];
  const selectedDate = weekDates[selectedDayKey];
  const selectedDayTotals = getDayTotals(selectedDayKey);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900" data-testid="text-page-title">
            {tf("mt.title")}
          </h1>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setWeekOffset(prev => prev - 1)}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm font-medium px-1 sm:px-3 whitespace-nowrap">
              {monday.toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US', { month: 'short', day: 'numeric' })}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setWeekOffset(prev => prev + 1)}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-3">
              <p className="text-xs opacity-80">{tf("mt.weeklyTotal")}</p>
              <p className="text-xl sm:text-2xl font-bold">{weeklyTotals.calories}</p>
              <p className="text-xs opacity-80">{tf("mt.kcal")}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-400 to-orange-500 text-white">
            <CardContent className="p-3">
              <p className="text-xs opacity-80">{tf("mt.dailyTotal")}</p>
              <p className="text-xl sm:text-2xl font-bold">{selectedDayTotals.calories}</p>
              <p className="text-xs opacity-80">{tf("mt.kcal")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
          {WEEKDAY_KEYS.map((dayKey, index) => {
            const date = weekDates[dayKey];
            const today = isToday(dayKey);
            const isSelected = index === selectedDayIndex;
            return (
              <button
                key={dayKey}
                onClick={() => setSelectedDayIndex(index)}
                className={`flex-1 min-w-[44px] p-2 rounded-lg text-center transition-all ${
                  isSelected 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : today 
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                data-testid={`button-day-${dayKey}`}
              >
                <p className="text-[10px] sm:text-xs font-medium">
                  {tf(`mt.${dayKey}`)}
                </p>
                <p className="text-sm sm:text-lg font-bold">
                  {date.getDate()}
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {MEAL_TYPES.map((mealType) => {
            const meals = getMealsForSlot(selectedDayKey, mealType);
            return (
              <Card key={mealType} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                    <span className="font-medium text-gray-700">
                      {tf(`mt.${mealType}`)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={() => setSelectedSlot({ day: selectedDayKey, mealType })}
                      data-testid={`button-add-${mealType}`}
                    >
                      <Plus className="h-4 w-4 me-1" />
                      {tf("mt.addMeal")}
                    </Button>
                  </div>
                  
                  {meals.length > 0 ? (
                    <div className="divide-y">
                      {meals.map((meal) => (
                        <div 
                          key={meal.id} 
                          className="flex items-center justify-between p-3 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            {meal.photoUrl && (
                              <img 
                                src={meal.photoUrl} 
                                alt={meal.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-sm">{meal.name}</p>
                              <p className="text-xs text-gray-500">
                                P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-end">
                              <p className="font-bold text-emerald-600">{meal.calories}</p>
                              <p className="text-xs text-gray-500">{tf("mt.kcal")}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => deleteMutation.mutate(meal.id)}
                              data-testid={`button-delete-${meal.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      <Flame className="h-5 w-5 mx-auto mb-1 opacity-50" />
                      <span>-</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="hidden lg:block mt-8">
          <h2 className="text-lg font-semibold mb-4">{tf("mt.weekOf")} {monday.toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US', { month: 'long', day: 'numeric' })}</h2>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="p-2"></div>
                {WEEKDAY_KEYS.map((dayKey) => {
                  const date = weekDates[dayKey];
                  const today = isToday(dayKey);
                  return (
                    <div 
                      key={dayKey} 
                      className={`p-2 text-center rounded-lg ${today ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-gray-50'}`}
                    >
                      <p className={`text-xs font-medium ${today ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {tf(`mt.${dayKey}`)}
                      </p>
                      <p className={`text-lg font-bold ${today ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {MEAL_TYPES.map((mealType) => (
                <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="p-3 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {tf(`mt.${mealType}`)}
                    </span>
                  </div>
                  {WEEKDAY_KEYS.map((dayKey) => {
                    const meals = getMealsForSlot(dayKey, mealType);
                    const today = isToday(dayKey);
                    return (
                      <Card 
                        key={`${dayKey}-${mealType}`} 
                        className={`min-h-[80px] cursor-pointer hover:shadow-md transition-shadow ${today ? 'border-emerald-200' : ''}`}
                        onClick={() => setSelectedSlot({ day: dayKey, mealType })}
                        data-testid={`slot-${dayKey}-${mealType}`}
                      >
                        <CardContent className="p-2">
                          {meals.length > 0 ? (
                            <div className="space-y-1">
                              {meals.map((meal) => (
                                <div 
                                  key={meal.id} 
                                  className="bg-emerald-50 rounded p-1.5 text-xs group relative"
                                >
                                  <p className="font-medium text-emerald-800 truncate">{meal.name}</p>
                                  <p className="text-emerald-600">{meal.calories} {tf("mt.kcal")}</p>
                                  <button
                                    className="absolute top-1 end-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMutation.mutate(meal.id);
                                    }}
                                  >
                                    <X className="h-3 w-3 text-red-500" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 hover:text-emerald-500">
                              <Plus className="h-5 w-5" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ))}

              <div className="grid grid-cols-8 gap-2 mt-4">
                <div className="p-3 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-emerald-700">{tf("mt.dailyTotal")}</span>
                </div>
                {WEEKDAY_KEYS.map((dayKey) => {
                  const totals = getDayTotals(dayKey);
                  const today = isToday(dayKey);
                  return (
                    <div 
                      key={`totals-${dayKey}`} 
                      className={`p-2 rounded-lg text-center ${today ? 'bg-emerald-100' : 'bg-gray-50'}`}
                    >
                      <p className={`text-lg font-bold ${today ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {totals.calories}
                      </p>
                      <p className="text-xs text-gray-500">{tf("mt.kcal")}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && (setSelectedSlot(null), resetForm())}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{tf("mt.logMeal")}</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  {tf(`mt.${selectedSlot.mealType}`)} - {tf(`mt.${selectedSlot.day}`)} {weekDates[selectedSlot.day as keyof typeof weekDates]?.getDate()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3 py-2">
            <span className={`text-sm ${!isManualMode ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>
              {tf("mt.photoMode")}
            </span>
            <Switch
              checked={isManualMode}
              onCheckedChange={setIsManualMode}
              data-testid="switch-input-mode"
            />
            <span className={`text-sm ${isManualMode ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>
              {tf("mt.manualMode")}
            </span>
          </div>

          {!isManualMode ? (
            <div className="space-y-3">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone-photo"
              >
                {previewImage ? (
                  <div className="space-y-2">
                    <img 
                      src={previewImage} 
                      alt="Food preview" 
                      className="max-h-28 mx-auto rounded-lg"
                      data-testid="img-preview"
                    />
                    {analyzeMutation.isPending && (
                      <div className="flex items-center justify-center gap-2 text-emerald-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{tf("mt.analyzing")}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Camera className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">{tf("mt.uploadPhoto")}</p>
                    <p className="text-xs text-gray-400">{tf("mt.uploadHint")}</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                data-testid="input-photo"
              />

              {analyzedNutrition && (
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="font-medium text-emerald-800 mb-2 text-sm">{analyzedNutrition.name}</p>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="font-bold text-emerald-700">{analyzedNutrition.calories}</p>
                      <p className="text-gray-500">{tf("mt.kcal")}</p>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-700">{analyzedNutrition.protein}g</p>
                      <p className="text-gray-500">P</p>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-700">{analyzedNutrition.carbs}g</p>
                      <p className="text-gray-500">C</p>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-700">{analyzedNutrition.fat}g</p>
                      <p className="text-gray-500">F</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-sm">{tf("mt.foodName")}</Label>
                <Input
                  id="name"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder={tf("mt.foodNamePlaceholder")}
                  className="h-9"
                  data-testid="input-food-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="calories" className="text-sm">{tf("mt.calories")}</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={manualForm.calories}
                    onChange={(e) => setManualForm({ ...manualForm, calories: e.target.value })}
                    placeholder="0"
                    className="h-9"
                    data-testid="input-calories"
                  />
                </div>
                <div>
                  <Label htmlFor="protein" className="text-sm">{tf("mt.protein")}</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={manualForm.protein}
                    onChange={(e) => setManualForm({ ...manualForm, protein: e.target.value })}
                    placeholder="0"
                    className="h-9"
                    data-testid="input-protein"
                  />
                </div>
                <div>
                  <Label htmlFor="carbs" className="text-sm">{tf("mt.carbs")}</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={manualForm.carbs}
                    onChange={(e) => setManualForm({ ...manualForm, carbs: e.target.value })}
                    placeholder="0"
                    className="h-9"
                    data-testid="input-carbs"
                  />
                </div>
                <div>
                  <Label htmlFor="fat" className="text-sm">{tf("mt.fat")}</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={manualForm.fat}
                    onChange={(e) => setManualForm({ ...manualForm, fat: e.target.value })}
                    placeholder="0"
                    className="h-9"
                    data-testid="input-fat"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <Button 
              variant="outline" 
              className="flex-1 h-10"
              onClick={() => { setSelectedSlot(null); resetForm(); }}
            >
              {tf("mt.cancel")}
            </Button>
            <Button 
              className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={saveMutation.isPending || (!isManualMode && !analyzedNutrition)}
              data-testid="button-save-meal"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin me-1" />
              ) : (
                <Plus className="h-4 w-4 me-1" />
              )}
              {tf("mt.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
