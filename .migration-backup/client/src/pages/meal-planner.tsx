import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Plus, ChevronLeft, ChevronRight, Sparkles, Trash2, ChefHat, Home, TrendingUp, Globe, Flame, Dumbbell, Edit, MessageSquare, RefreshCw, Camera, Upload, X, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Meal, Recipe } from "@shared/schema";
import Header from "@/components/header";

interface MealWithRecipe extends Meal {
  recipe?: Recipe;
  calories?: number;
  protein?: number;
}

interface NutritionResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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

const EXPERTS = [
  {
    id: "fitness-trainer",
    emoji: "💪",
    avatarBg: "from-blue-500 to-cyan-500",
    nameEn: "Alex Carter",
    nameAr: "أليكس كارتر",
    titleEn: "Certified Fitness Trainer",
    titleAr: "مدرب لياقة معتمد",
    bioEn: "ISSA-certified PT with 10+ years helping clients burn fat and build muscle through strategic nutrition. High-protein, whole-food focused.",
    bioAr: "مدرب معتمد من ISSA مع أكثر من 10 سنوات خبرة في مساعدة العملاء على حرق الدهون وبناء العضلات من خلال التغذية السليمة.",
    tags: ["High Protein", "Low Carb", "Meal Prep", "Muscle Gain"],
    tagsAr: ["بروتين عالي", "كارب منخفض", "تحضير وجبات", "بناء عضلات"],
    followers: "312",
    meals: [
      { nameEn: "Grilled Chicken & Quinoa Bowl", nameAr: "وعاء دجاج مشوي وكينوا", kcal: 520, protein: 48 },
      { nameEn: "Egg White Omelette & Spinach", nameAr: "أومليت بياض البيض والسبانخ", kcal: 310, protein: 36 },
      { nameEn: "Salmon with Sweet Potato", nameAr: "سلمون مع بطاطا حلوة", kcal: 580, protein: 44 },
    ]
  },
  {
    id: "michelin-chef",
    emoji: "👨‍🍳",
    avatarBg: "from-amber-500 to-orange-500",
    nameEn: "Hiroshi Beaumont",
    nameAr: "هيروشي بومون",
    titleEn: "Michelin-Star Chef",
    titleAr: "شيف نجمة ميشلان",
    bioEn: "Tokyo-trained, Paris-refined. 2 Michelin stars across French, Mediterranean, and Japanese cuisines. Elevation of everyday ingredients into extraordinary dishes.",
    bioAr: "تدرّب في طوكيو وتألّق في باريس. نجمتا ميشلان في المطابخ الفرنسية والمتوسطية واليابانية. يحوّل المكونات اليومية إلى أطباق استثنائية.",
    tags: ["French", "Japanese", "Mediterranean", "Fusion"],
    tagsAr: ["فرنسي", "ياباني", "متوسطي", "فيوجن"],
    followers: "874",
    meals: [
      { nameEn: "Duck Confit with Lentil Jus", nameAr: "بط كونفي مع صلصة العدس", kcal: 680, protein: 38 },
      { nameEn: "Miso-Glazed Black Cod", nameAr: "سمك القد الأسود بالميسو", kcal: 490, protein: 34 },
      { nameEn: "Saffron Risotto & Scallops", nameAr: "ريزوتو الزعفران مع الإسكالوب", kcal: 620, protein: 29 },
    ]
  }
] as const;

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
  const [addMode, setAddMode] = useState<"type" | "photo">("type");
  const [followedExperts, setFollowedExperts] = useState<Set<string>>(new Set());
  const [expandedExpert, setExpandedExpert] = useState<string | null>(null);
  const [generatingExpertMeal, setGeneratingExpertMeal] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoResult, setPhotoResult] = useState<NutritionResult | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
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
    setAddMode("type");
    setPhotoPreview(null);
    setPhotoData(null);
    setPhotoResult(null);
  };

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
      setPhotoData(dataUrl);
      setPhotoResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyzePhoto = async () => {
    if (!photoData) return;
    setIsAnalyzingPhoto(true);
    try {
      const res = await apiRequest("POST", "/api/meals/analyze-photo", { image: photoData });
      const result: NutritionResult = await res.json();
      setPhotoResult(result);
    } catch (err) {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "فشل تحليل الصورة" : "Failed to analyze photo", variant: "destructive" });
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleAddPhotoMeal = () => {
    if (!photoResult || !selectedSlot) return;
    const date = weekDates[selectedSlot.day as keyof typeof weekDates];
    const dayKey = formatDate(date);
    const newMeal: MealWithRecipe = {
      id: `meal_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      dayKey,
      type: selectedSlot.type,
      name: photoResult.name,
      calories: photoResult.calories,
      protein: photoResult.protein,
      recipeId: undefined,
      createdAt: new Date()
    };
    setMeals(prev => [...prev.filter(m => !(m.dayKey === dayKey && m.type === selectedSlot.type)), newMeal]);
    setSelectedSlot(null);
    setPhotoPreview(null);
    setPhotoData(null);
    setPhotoResult(null);
    toast({ title: language === "ar" ? "تمت الإضافة!" : "Meal added!", description: photoResult.name });
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
  
  const handleAddExpertMeal = async (expertId: string, mealIndex: number, mealNameEn: string, mealNameAr: string) => {
    const key = `${expertId}-${mealIndex}`;
    if (generatingExpertMeal) return;
    setGeneratingExpertMeal(key);

    const todayKey = formatDate(new Date());
    const takenTypes = new Set(meals.filter(m => m.dayKey === todayKey).map(m => m.type));
    const mealType = (["breakfast", "lunch", "dinner"] as const).find(t => !takenTypes.has(t)) ?? "lunch";
    const mealName = language === "ar" ? mealNameAr : mealNameEn;

    try {
      const res = await apiRequest("POST", "/api/recipes/generate", {
        craving: mealNameEn,
        servings: 2,
        cuisine: "any",
        cookTime: "30-60min",
        dietaryRestrictions: []
      });
      const recipe = await res.json();

      const newMeal: MealWithRecipe = {
        id: `meal_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        dayKey: todayKey,
        type: mealType,
        name: recipe.title,
        recipeId: recipe.id,
        recipe,
        createdAt: new Date()
      };
      setMeals(prev => [...prev.filter(m => !(m.dayKey === todayKey && m.type === mealType)), newMeal]);
      toast({
        title: language === "ar" ? "تمت الإضافة مع الوصفة!" : "Recipe added to your plan!",
        description: `${recipe.title} → ${mealType}`
      });
    } catch {
      toast({ title: language === "ar" ? "خطأ" : "Error", description: language === "ar" ? "فشل توليد الوصفة" : "Failed to generate recipe", variant: "destructive" });
    } finally {
      setGeneratingExpertMeal(null);
    }
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
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-plan-title">
                {tf("mp.myCustomPlan")}
              </h2>
              <p className="text-orange-100">
                {tf("mp.planDescription")}
              </p>
            </div>

            {/* Who to Follow */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-50">
                <div className="bg-purple-100 text-purple-600 p-1.5 rounded-md">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {language === "ar" ? "تابع خبراء التغذية" : "Who to Follow"}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {language === "ar" ? "خبراء منتقون لإلهامك في التخطيط" : "Curated experts to inspire your meal planning"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-50">
                {EXPERTS.map(expert => {
                  const isFollowed = followedExperts.has(expert.id);
                  const isExpanded = expandedExpert === expert.id;
                  const name = language === "ar" ? expert.nameAr : expert.nameEn;
                  const title = language === "ar" ? expert.titleAr : expert.titleEn;
                  const bio = language === "ar" ? expert.bioAr : expert.bioEn;
                  const tags = language === "ar" ? expert.tagsAr : expert.tags;

                  return (
                    <div key={expert.id} className="p-4" data-testid={`card-expert-${expert.id}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${expert.avatarBg} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                          {expert.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-gray-900 text-sm" data-testid={`text-expert-name-${expert.id}`}>{name}</h3>
                              <p className="text-xs text-gray-500">{title}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-400">{expert.followers}</span>
                              <Button
                                size="sm"
                                onClick={() => setFollowedExperts(prev => { const n = new Set(prev); n.has(expert.id) ? n.delete(expert.id) : n.add(expert.id); return n; })}
                                className={`text-xs h-7 px-3 ${isFollowed ? "bg-gray-100 hover:bg-gray-200 text-gray-700" : "bg-orange-600 hover:bg-orange-700 text-white"}`}
                                data-testid={`button-follow-${expert.id}`}
                              >
                                {isFollowed ? (language === "ar" ? "متابَع ✓" : "Following ✓") : (language === "ar" ? "تابع" : "Follow")}
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{bio}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tags.map((tag, i) => (
                              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedExpert(isExpanded ? null : expert.id)}
                        className="mt-3 w-full text-xs text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1"
                        data-testid={`button-toggle-expert-${expert.id}`}
                      >
                        {isExpanded
                          ? (language === "ar" ? "إخفاء الوجبات ▲" : "Hide meals ▲")
                          : (language === "ar" ? "عرض وجبات مقترحة ▼" : "View signature meals ▼")}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {language === "ar" ? "وجبات مقترحة" : "Signature Meals"}
                          </p>
                          {expert.meals.map((meal, i) => {
                            const mealName = language === "ar" ? meal.nameAr : meal.nameEn;
                            return (
                              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                <div>
                                  <p className="text-xs font-medium text-gray-800">{mealName}</p>
                                  <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                                    <span className="flex items-center gap-0.5"><Flame className="h-2.5 w-2.5 text-red-400" />{meal.kcal} kcal</span>
                                    <span className="flex items-center gap-0.5"><Dumbbell className="h-2.5 w-2.5 text-blue-400" />{meal.protein}g</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[11px] text-orange-600 hover:bg-orange-50 px-2 min-w-[60px]"
                                  onClick={() => handleAddExpertMeal(expert.id, i, meal.nameEn, meal.nameAr)}
                                  disabled={generatingExpertMeal === `${expert.id}-${i}`}
                                  data-testid={`button-add-signature-${expert.id}-${i}`}
                                >
                                  {generatingExpertMeal === `${expert.id}-${i}` ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <><Plus className="h-3 w-3 mr-0.5" />{language === "ar" ? "أضف" : "Add"}</>
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {isFollowed && (
                        <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-[11px] text-orange-700 flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          {language === "ar" ? `ستظهر وجبات ${name} في اقتراحاتك` : `${name}'s meals will appear in your suggestions`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
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
                    className={`bg-white rounded-lg border-2 shadow-sm transition-all ${
                      isToday ? 'border-orange-400 shadow-md' : 'border-gray-100'
                    }`}
                    data-testid={`card-${day}`}
                  >
                    <div className={`p-4 border-b rounded-t-lg ${isToday ? 'bg-orange-50' : 'bg-white'}`}>
                      <div className={`font-semibold capitalize ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
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
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 relative group">
                                <div className="pr-6">
                                  <div className="flex items-start gap-2 mb-1">
                                    <ChefHat className="h-3.5 w-3.5 text-orange-600 mt-0.5 flex-shrink-0" />
                                    {meal.recipeId ? (
                                      <Link href={`/${language}/recipe/${meal.recipeId}`}>
                                        <h4 className="font-medium text-xs text-orange-700 hover:text-orange-900 underline cursor-pointer line-clamp-2" data-testid={`text-meal-${meal.id}`}>
                                          {meal.name}
                                        </h4>
                                      </Link>
                                    ) : (
                                      <h4 className="font-medium text-xs text-gray-900 line-clamp-2" data-testid={`text-meal-${meal.id}`}>
                                        {meal.name}
                                      </h4>
                                    )}
                                  </div>
                                  {meal.calories && (
                                    <div className="flex gap-2 text-xs text-gray-500 ml-5 mt-0.5">
                                      <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-red-400" />{meal.calories}</span>
                                      {meal.protein && <span className="flex items-center gap-0.5"><Dumbbell className="h-3 w-3 text-blue-400" />{meal.protein}g</span>}
                                    </div>
                                  )}
                                  {!meal.calories && meal.recipe && (
                                    <div className="text-xs text-gray-500 ml-5">
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
                                  <Trash2 className="h-3 w-3 text-red-500" />
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
                                      className="flex-1 h-9 text-xs border-dashed hover:bg-orange-50 hover:border-orange-300"
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

                                    <div className="flex rounded-lg border border-gray-200 p-1 gap-1 bg-gray-50 mb-2">
                                      <button
                                        onClick={() => setAddMode("type")}
                                        className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${addMode === "type" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                                        data-testid="tab-add-type"
                                      >
                                        {language === "ar" ? "✏️ كتابة" : "✏️ Type"}
                                      </button>
                                      <button
                                        onClick={() => setAddMode("photo")}
                                        className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${addMode === "photo" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                                        data-testid="tab-add-photo"
                                      >
                                        {language === "ar" ? "📷 صورة" : "📷 Photo"}
                                      </button>
                                    </div>

                                    {addMode === "type" ? (
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
                                          className="w-full bg-orange-600 hover:bg-orange-700"
                                          onClick={handleGenerateMeal}
                                          disabled={!mealPrompt.trim() || isGenerating}
                                          data-testid="button-generate-meal"
                                        >
                                          {isGenerating ? t("recipe.generating") : t("mealPlanner.generateMeal")}
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        {!photoPreview ? (
                                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50">
                                            <Camera className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm text-gray-500 mb-4">
                                              {language === "ar" ? "التقط صورة للوجبة لاكتشاف السعرات الحرارية" : "Take or upload a photo of your meal to detect calories"}
                                            </p>
                                            <div className="flex gap-2 justify-center">
                                              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 gap-1.5" onClick={() => cameraInputRef.current?.click()} data-testid="button-camera-meal">
                                                <Camera className="h-4 w-4" />
                                                {language === "ar" ? "التقط" : "Camera"}
                                              </Button>
                                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-meal">
                                                <Upload className="h-4 w-4" />
                                                {language === "ar" ? "رفع" : "Upload"}
                                              </Button>
                                            </div>
                                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                                          </div>
                                        ) : (
                                          <div className="space-y-3">
                                            <div className="relative rounded-xl overflow-hidden">
                                              <img src={photoPreview} alt="meal" className="w-full max-h-44 object-cover" data-testid="img-meal-preview" />
                                              <button onClick={() => { setPhotoPreview(null); setPhotoData(null); setPhotoResult(null); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                                                <X className="h-3.5 w-3.5" />
                                              </button>
                                            </div>

                                            {!photoResult ? (
                                              <Button className="w-full bg-orange-600 hover:bg-orange-700 gap-2" onClick={handleAnalyzePhoto} disabled={isAnalyzingPhoto} data-testid="button-analyze-meal">
                                                {isAnalyzingPhoto ? (
                                                  <><RefreshCw className="h-4 w-4 animate-spin" />{language === "ar" ? "جاري التحليل..." : "Analyzing..."}</>
                                                ) : (
                                                  <><Sparkles className="h-4 w-4" />{language === "ar" ? "تحليل واكتشاف السعرات" : "Detect Calories"}</>
                                                )}
                                              </Button>
                                            ) : (
                                              <div className="space-y-3">
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <span className="font-semibold text-gray-900 text-sm" data-testid="text-detected-meal">{photoResult.name}</span>
                                                  </div>
                                                  <div className="flex gap-3 text-xs text-gray-600">
                                                    <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-red-500" />{photoResult.calories} kcal</span>
                                                    <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3 text-blue-500" />{photoResult.protein}g protein</span>
                                                    <span className="text-gray-400">{photoResult.carbs}g carbs · {photoResult.fat}g fat</span>
                                                  </div>
                                                </div>
                                                <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={handleAddPhotoMeal} data-testid="button-confirm-photo-meal">
                                                  {language === "ar" ? "إضافة هذه الوجبة" : "Add This Meal"}
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
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

          </div>

      </div>
    </div>
  );
}
