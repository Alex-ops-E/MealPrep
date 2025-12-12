import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Globe, Calendar, Utensils, DollarSign, Flame, Dumbbell, Plus, RefreshCw, Edit, MessageSquare, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GROCERY_GOALS = ["saveMoney", "eatHealthier", "tryNewRecipes", "trackProgress"];
const COOKING_FREQUENCY = ["daily", "coupleTimes", "weekly", "rarely"];
const DIET_PREFERENCES = ["noPreference", "vegetarian", "vegan", "keto", "halal", "glutenFree", "dairyFree", "other"];

const DAYS_OF_WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const CUISINES = ["healthy", "arabic", "indian", "asian", "mediterranean", "western"];
const PRICE_OPTIONS = ["20", "40", "90", "none"];
const CALORIE_OPTIONS = ["custom", "300-650", "600+"];
const PROTEIN_OPTIONS = ["custom", "20-40", "40+"];

const PREFERRED_STORES = [
  { id: "lulu", name: "Lulu Hypermarket", nameAr: "لولو هايبرماركت" },
  { id: "carrefour", name: "Carrefour", nameAr: "كارفور" },
  { id: "noon", name: "Noon", nameAr: "نون" },
  { id: "talabat", name: "Talabat", nameAr: "طلبات" },
];

interface MealPlan {
  id: string;
  type: "breakfast" | "lunch" | "dinner";
  restaurant: string;
  dishName: string;
  calories: number;
  protein: number;
  price: number;
}

const SAMPLE_MEALS: MealPlan[] = [
  { id: "1", type: "breakfast", restaurant: "Fresh Kitchen", dishName: "Avocado Toast with Eggs", calories: 420, protein: 18, price: 35 },
  { id: "2", type: "breakfast", restaurant: "Health Bowl", dishName: "Greek Yogurt Parfait", calories: 320, protein: 22, price: 28 },
  { id: "3", type: "breakfast", restaurant: "Morning Delight", dishName: "Protein Pancakes", calories: 450, protein: 25, price: 32 },
  { id: "4", type: "lunch", restaurant: "Green Garden", dishName: "Grilled Chicken Salad", calories: 520, protein: 42, price: 45 },
  { id: "5", type: "lunch", restaurant: "Mediterranean Grill", dishName: "Falafel Wrap", calories: 480, protein: 18, price: 38 },
  { id: "6", type: "lunch", restaurant: "Asian Fusion", dishName: "Teriyaki Salmon Bowl", calories: 580, protein: 35, price: 52 },
  { id: "7", type: "dinner", restaurant: "Protein House", dishName: "Grilled Steak & Vegetables", calories: 620, protein: 48, price: 65 },
  { id: "8", type: "dinner", restaurant: "Healthy Choice", dishName: "Baked Salmon with Quinoa", calories: 550, protein: 40, price: 58 },
  { id: "9", type: "dinner", restaurant: "Home Style", dishName: "Chicken Tikka Masala", calories: 480, protein: 32, price: 42 },
];

export default function OnboardingFlow() {
  const [location, setLocation] = useLocation();
  const { t, language, isRTL } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);

  const handleLanguageChange = (newLang: "en" | "ar") => {
    const currentPath = location.replace(/^\/(en|ar)/, '');
    setLocation(`/${newLang}${currentPath || ''}`);
  };

  const [groceryGoal, setGroceryGoal] = useState<string>("");
  const [cookingFrequency, setCookingFrequency] = useState<string>("");
  const [preferredStoresOnboarding, setPreferredStoresOnboarding] = useState<string[]>([]);
  const [dietPreferences, setDietPreferences] = useState<string[]>([]);
  const [otherDiet, setOtherDiet] = useState("");

  const [mealSlots, setMealSlots] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
  });

  const [startDate, setStartDate] = useState("");
  const [numberOfWeeks, setNumberOfWeeks] = useState(1);
  const [selectedDays, setSelectedDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);

  const [pricePerMeal, setPricePerMeal] = useState<string>("");
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  const [showAddStore, setShowAddStore] = useState(false);
  const [customStoreName, setCustomStoreName] = useState("");
  const [customStores, setCustomStores] = useState<{id: string; name: string}[]>([]);

  const [calorieOption, setCalorieOption] = useState<string>("");
  const [customCalories, setCustomCalories] = useState("");
  const [proteinOption, setProteinOption] = useState<string>("");
  const [customProtein, setCustomProtein] = useState("");

  const totalSteps = 6;

  const handleOnboardingStoreToggle = (store: string) => {
    setPreferredStoresOnboarding(prev =>
      prev.includes(store) ? prev.filter(s => s !== store) : [...prev, store]
    );
  };

  const handleDietToggle = (diet: string) => {
    setDietPreferences(prev =>
      prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]
    );
  };

  const handleMealToggle = (meal: keyof typeof mealSlots) => {
    setMealSlots(prev => ({ ...prev, [meal]: !prev[meal] }));
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleCuisineToggle = (cuisine: string) => {
    setPreferredCuisines(prev =>
      prev.includes(cuisine) ? prev.filter(c => c !== cuisine) : [...prev, cuisine]
    );
  };

  const handleStoreToggle = (store: string) => {
    setFavoriteStores(prev =>
      prev.includes(store) ? prev.filter(s => s !== store) : [...prev, store]
    );
  };

  const handleAddCustomStore = () => {
    if (customStoreName.trim()) {
      const newStoreId = `custom_${Date.now()}`;
      setCustomStores(prev => [...prev, { id: newStoreId, name: customStoreName.trim() }]);
      setFavoriteStores(prev => [...prev, newStoreId]);
      setCustomStoreName("");
    }
  };

  const handleNext = async () => {
    if (currentStep === 4) {
      if (preferredStoresOnboarding.length > 0) {
        setFavoriteStores(preferredStoresOnboarding);
      }
      
      try {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const finalDietPreferences = dietPreferences.includes("other") && otherDiet
          ? [...dietPreferences.filter(d => d !== "other"), otherDiet]
          : dietPreferences;

        await apiRequest("POST", "/api/onboarding", {
          sessionId,
          groceryGoal: groceryGoal || null,
          cookingFrequency: cookingFrequency || null,
          preferredStores: preferredStoresOnboarding.length > 0 ? preferredStoresOnboarding : null,
          dietPreferences: finalDietPreferences.length > 0 ? finalDietPreferences : null,
          email: null,
        });
      } catch (error) {
        console.error("Failed to save onboarding:", error);
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await handleNext();
  };

  const handleViewMealPlan = () => {
    setLocation(`/${language}/meal-planner`);
  };

  const canProceedStep5 = startDate && selectedDays.length >= 2 && Object.values(mealSlots).some(v => v);
  const canProceedStep6 = pricePerMeal !== "";

  const getFilteredMeals = (type: "breakfast" | "lunch" | "dinner") => {
    return SAMPLE_MEALS.filter(meal => meal.type === type);
  };

  const translations: Record<string, Record<string, string>> = {
    en: {
      "onb.q1.title": "What's your main grocery goal?",
      "onb.q1.subtitle": "Choose what matters most to you",
      "onb.q1.saveMoney": "Save Money",
      "onb.q1.eatHealthier": "Eat Healthier",
      "onb.q1.tryNewRecipes": "Try New Recipes",
      "onb.q1.trackProgress": "Track Progress",
      "onb.q2.title": "How often do you cook at home?",
      "onb.q2.subtitle": "Choose the option that best describes you",
      "onb.q2.daily": "Daily",
      "onb.q2.coupleTimes": "A couple times a week",
      "onb.q2.weekly": "Weekly",
      "onb.q2.rarely": "Rarely / I mostly order",
      "onb.q3.title": "Where do you usually shop or order groceries?",
      "onb.q3.subtitle": "Select all that apply",
      "onb.q3.lulu": "Lulu Hypermarket",
      "onb.q3.carrefour": "Carrefour",
      "onb.q3.noon": "Noon",
      "onb.q3.talabat": "Talabat",
      "onb.q4.title": "Any dietary preferences or restrictions?",
      "onb.q4.subtitle": "Select all that apply",
      "onb.q4.noPreference": "No preference",
      "onb.q4.vegetarian": "Vegetarian",
      "onb.q4.vegan": "Vegan",
      "onb.q4.keto": "Keto / Low Carb",
      "onb.q4.halal": "Halal",
      "onb.q4.glutenFree": "Gluten-Free",
      "onb.q4.dairyFree": "Dairy-Free",
      "onb.q4.other": "Other",
      "onb.q4.otherPlaceholder": "Please specify your preference",
      "flow.step1Header": "Create my meal plan – Step 1 / 2",
      "flow.step2Header": "Create my meal plan – Step 2 / 2",
      "flow.basicSetup": "Basic Setup",
      "flow.whichMeals": "Which meals do you want in your plan?",
      "flow.breakfast": "Breakfast",
      "flow.lunch": "Lunch",
      "flow.dinner": "Dinner",
      "flow.schedule": "Schedule",
      "flow.selectDateDuration": "Select start date and duration",
      "flow.startDate": "Start Date",
      "flow.numberOfWeeks": "Number of Weeks",
      "flow.week": "week",
      "flow.weeks": "weeks",
      "flow.daysOfWeek": "Days of the Week",
      "flow.selectAtLeast2": "Select at least 2 days",
      "flow.next": "Next",
      "flow.back": "Back",
      "flow.skip": "Skip",
      "flow.preferences": "Preferences",
      "flow.pricePerMeal": "Price per meal",
      "flow.upTo": "Up to",
      "flow.noLimit": "No limit",
      "flow.preferredCuisines": "Preferred cuisines (optional)",
      "flow.healthy": "Healthy",
      "flow.arabic": "Arabic",
      "flow.indian": "Indian",
      "flow.asian": "Asian",
      "flow.mediterranean": "Mediterranean",
      "flow.western": "Western",
      "flow.favoriteStores": "Favorite stores",
      "flow.addOtherStore": "Add other store",
      "flow.caloriesProtein": "Calories & Protein (optional)",
      "flow.caloriesPerMeal": "Calories intake per meal",
      "flow.proteinPerMeal": "Protein intake per meal",
      "flow.custom": "Custom",
      "flow.kcal": "Kcal",
      "flow.viewMealPlan": "View Meal Plan",
      "flow.myCustomPlan": "My Custom Meal Plan",
      "flow.planDescription": "Your personalized meal plan is balanced, calorie-counted, and optimized for your preferences. Fresh ingredients from your favorite stores.",
      "flow.recommendedBreakfast": "Recommended Breakfast Meals",
      "flow.recommendedLunch": "Recommended Lunch Meals",
      "flow.recommendedDinner": "Recommended Dinner Meals",
      "flow.customize": "Customize",
      "flow.addNote": "Add a note",
      "flow.swapMeal": "Swap meal",
      "flow.viewCart": "View Cart",
      "flow.totalSavings": "Total savings: AED 45",
      "flow.mon": "Mon",
      "flow.tue": "Tue",
      "flow.wed": "Wed",
      "flow.thu": "Thu",
      "flow.fri": "Fri",
      "flow.sat": "Sat",
      "flow.sun": "Sun",
    },
    ar: {
      "onb.q1.title": "ما هو هدفك الرئيسي من التسوق؟",
      "onb.q1.subtitle": "اختر ما يهمك أكثر",
      "onb.q1.saveMoney": "توفير المال",
      "onb.q1.eatHealthier": "أكل صحي أكثر",
      "onb.q1.tryNewRecipes": "تجربة وصفات جديدة",
      "onb.q1.trackProgress": "تتبع التقدم",
      "onb.q2.title": "كم مرة تطبخ في المنزل؟",
      "onb.q2.subtitle": "اختر الخيار الذي يصفك أفضل",
      "onb.q2.daily": "يومياً",
      "onb.q2.coupleTimes": "عدة مرات في الأسبوع",
      "onb.q2.weekly": "أسبوعياً",
      "onb.q2.rarely": "نادراً / أطلب في الغالب",
      "onb.q3.title": "أين تتسوق عادة أو تطلب البقالة؟",
      "onb.q3.subtitle": "اختر كل ما ينطبق",
      "onb.q3.lulu": "لولو هايبرماركت",
      "onb.q3.carrefour": "كارفور",
      "onb.q3.noon": "نون",
      "onb.q3.talabat": "طلبات",
      "onb.q4.title": "أي نظام غذائي أو تفضيلات طعام؟",
      "onb.q4.subtitle": "اختر كل ما ينطبق",
      "onb.q4.noPreference": "لا تفضيل محدد",
      "onb.q4.vegetarian": "نباتي",
      "onb.q4.vegan": "نباتي صرف",
      "onb.q4.keto": "كيتو / منخفض الكربوهيدرات",
      "onb.q4.halal": "حلال",
      "onb.q4.glutenFree": "خالي من الغلوتين",
      "onb.q4.dairyFree": "خالي من الألبان",
      "onb.q4.other": "أخرى",
      "onb.q4.otherPlaceholder": "يرجى تحديد تفضيلك",
      "flow.step1Header": "إنشاء خطة وجباتي – الخطوة 1 / 2",
      "flow.step2Header": "إنشاء خطة وجباتي – الخطوة 2 / 2",
      "flow.basicSetup": "الإعداد الأساسي",
      "flow.whichMeals": "أي وجبات تريد في خطتك؟",
      "flow.breakfast": "الإفطار",
      "flow.lunch": "الغداء",
      "flow.dinner": "العشاء",
      "flow.schedule": "الجدول",
      "flow.selectDateDuration": "حدد تاريخ البدء والمدة",
      "flow.startDate": "تاريخ البدء",
      "flow.numberOfWeeks": "عدد الأسابيع",
      "flow.week": "أسبوع",
      "flow.weeks": "أسابيع",
      "flow.daysOfWeek": "أيام الأسبوع",
      "flow.selectAtLeast2": "اختر يومين على الأقل",
      "flow.next": "التالي",
      "flow.back": "رجوع",
      "flow.skip": "تخطي",
      "flow.preferences": "التفضيلات",
      "flow.pricePerMeal": "السعر لكل وجبة",
      "flow.upTo": "حتى",
      "flow.noLimit": "بدون حد",
      "flow.preferredCuisines": "المطابخ المفضلة (اختياري)",
      "flow.healthy": "صحي",
      "flow.arabic": "عربي",
      "flow.indian": "هندي",
      "flow.asian": "آسيوي",
      "flow.mediterranean": "متوسطي",
      "flow.western": "غربي",
      "flow.favoriteStores": "المتاجر المفضلة",
      "flow.addOtherStore": "إضافة متجر آخر",
      "flow.caloriesProtein": "السعرات والبروتين (اختياري)",
      "flow.caloriesPerMeal": "السعرات الحرارية لكل وجبة",
      "flow.proteinPerMeal": "البروتين لكل وجبة",
      "flow.custom": "مخصص",
      "flow.kcal": "سعرة",
      "flow.viewMealPlan": "عرض خطة الوجبات",
      "flow.myCustomPlan": "خطة وجباتي المخصصة",
      "flow.planDescription": "خطة وجباتك المخصصة متوازنة ومحسوبة السعرات ومُحسّنة لتفضيلاتك. مكونات طازجة من متاجرك المفضلة.",
      "flow.recommendedBreakfast": "وجبات الإفطار الموصى بها",
      "flow.recommendedLunch": "وجبات الغداء الموصى بها",
      "flow.recommendedDinner": "وجبات العشاء الموصى بها",
      "flow.customize": "تخصيص",
      "flow.addNote": "إضافة ملاحظة",
      "flow.swapMeal": "تبديل الوجبة",
      "flow.viewCart": "عرض السلة",
      "flow.totalSavings": "إجمالي التوفير: 45 درهم",
      "flow.mon": "الإثنين",
      "flow.tue": "الثلاثاء",
      "flow.wed": "الأربعاء",
      "flow.thu": "الخميس",
      "flow.fri": "الجمعة",
      "flow.sat": "السبت",
      "flow.sun": "الأحد",
    }
  };

  const tf = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const renderOnboardingStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900" data-testid="text-question-title">
          {tf("onb.q1.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-question-subtitle">
          {tf("onb.q1.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {GROCERY_GOALS.map((goal) => (
          <Button
            key={goal}
            variant={groceryGoal === goal ? "default" : "outline"}
            className={`h-auto py-4 ${groceryGoal === goal ? "bg-orange-600 hover:bg-orange-700" : ""}`}
            onClick={() => setGroceryGoal(goal)}
            data-testid={`button-goal-${goal}`}
          >
            {tf(`onb.q1.${goal}`)}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderOnboardingStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900" data-testid="text-question-title">
          {tf("onb.q2.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-question-subtitle">
          {tf("onb.q2.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {COOKING_FREQUENCY.map((freq) => (
          <Button
            key={freq}
            variant={cookingFrequency === freq ? "default" : "outline"}
            className={`h-auto py-4 ${cookingFrequency === freq ? "bg-orange-600 hover:bg-orange-700" : ""}`}
            onClick={() => setCookingFrequency(freq)}
            data-testid={`button-frequency-${freq}`}
          >
            {tf(`onb.q2.${freq}`)}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderOnboardingStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900" data-testid="text-question-title">
          {tf("onb.q3.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-question-subtitle">
          {tf("onb.q3.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PREFERRED_STORES.map((store) => (
          <Button
            key={store.id}
            variant={preferredStoresOnboarding.includes(store.id) ? "default" : "outline"}
            className={`h-auto py-4 ${preferredStoresOnboarding.includes(store.id) ? "bg-orange-600 hover:bg-orange-700" : ""}`}
            onClick={() => handleOnboardingStoreToggle(store.id)}
            data-testid={`button-store-${store.id}`}
          >
            {tf(`onb.q3.${store.id}`)}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderOnboardingStep4 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900" data-testid="text-question-title">
          {tf("onb.q4.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-question-subtitle">
          {tf("onb.q4.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DIET_PREFERENCES.map((diet) => (
          <Button
            key={diet}
            variant={dietPreferences.includes(diet) ? "default" : "outline"}
            className={`h-auto py-4 ${dietPreferences.includes(diet) ? "bg-orange-600 hover:bg-orange-700" : ""}`}
            onClick={() => handleDietToggle(diet)}
            data-testid={`button-diet-${diet}`}
          >
            {tf(`onb.q4.${diet}`)}
          </Button>
        ))}
      </div>
      {dietPreferences.includes("other") && (
        <div className="mt-4">
          <Input
            type="text"
            placeholder={tf("onb.q4.otherPlaceholder")}
            value={otherDiet}
            onChange={(e) => setOtherDiet(e.target.value)}
            className="w-full"
            data-testid="input-other-diet"
          />
        </div>
      )}
    </div>
  );

  const renderMealPlanStep1 = () => (
    <div className="space-y-8">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold text-orange-800" data-testid="text-step1-header">
          {tf("flow.step1Header")}
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-600" />
            {tf("flow.basicSetup")}
          </h3>
          <p className="text-gray-600 mb-4">{tf("flow.whichMeals")}</p>
          
          <div className="space-y-3">
            {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
              <div key={meal} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <Label htmlFor={meal} className="text-base font-medium cursor-pointer">
                  {tf(`flow.${meal}`)}
                </Label>
                <Switch
                  id={meal}
                  checked={mealSlots[meal]}
                  onCheckedChange={() => handleMealToggle(meal)}
                  data-testid={`switch-${meal}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            {tf("flow.schedule")}
          </h3>
          <p className="text-gray-600 mb-4">{tf("flow.selectDateDuration")}</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                {tf("flow.startDate")}
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
                data-testid="input-start-date"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                {tf("flow.numberOfWeeks")}
              </Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3].map((weeks) => (
                  <Button
                    key={weeks}
                    variant={numberOfWeeks === weeks ? "default" : "outline"}
                    className={`flex-1 ${numberOfWeeks === weeks ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                    onClick={() => setNumberOfWeeks(weeks)}
                    data-testid={`button-weeks-${weeks}`}
                  >
                    {weeks} {weeks === 1 ? tf("flow.week") : tf("flow.weeks")}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                {tf("flow.daysOfWeek")}
              </Label>
              <p className="text-xs text-gray-500 mb-2">{tf("flow.selectAtLeast2")}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day}
                    variant={selectedDays.includes(day) ? "default" : "outline"}
                    size="sm"
                    className={`${selectedDays.includes(day) ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                    onClick={() => handleDayToggle(day)}
                    data-testid={`button-day-${day}`}
                  >
                    {tf(`flow.${day}`)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMealPlanStep2 = () => (
    <div className="space-y-8">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold text-orange-800" data-testid="text-step2-header">
          {tf("flow.step2Header")}
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            {tf("flow.pricePerMeal")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PRICE_OPTIONS.map((price) => (
              <Button
                key={price}
                variant={pricePerMeal === price ? "default" : "outline"}
                className={`${pricePerMeal === price ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                onClick={() => setPricePerMeal(price)}
                data-testid={`button-price-${price}`}
              >
                {price === "none" ? tf("flow.noLimit") : `${tf("flow.upTo")} ${price} AED`}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {tf("flow.preferredCuisines")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((cuisine) => (
              <Button
                key={cuisine}
                variant={preferredCuisines.includes(cuisine) ? "default" : "outline"}
                size="sm"
                className={`${preferredCuisines.includes(cuisine) ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                onClick={() => handleCuisineToggle(cuisine)}
                data-testid={`button-cuisine-${cuisine}`}
              >
                {tf(`flow.${cuisine}`)}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {tf("flow.favoriteStores")}
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {PREFERRED_STORES.map((store) => (
              <Button
                key={store.id}
                variant={favoriteStores.includes(store.id) ? "default" : "outline"}
                className={`${favoriteStores.includes(store.id) ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                onClick={() => handleStoreToggle(store.id)}
                data-testid={`button-fav-store-${store.id}`}
              >
                {language === "ar" ? store.nameAr : store.name}
              </Button>
            ))}
            {customStores.map((store) => (
              <Button
                key={store.id}
                variant={favoriteStores.includes(store.id) ? "default" : "outline"}
                className={`${favoriteStores.includes(store.id) ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                onClick={() => handleStoreToggle(store.id)}
                data-testid={`button-fav-store-${store.id}`}
              >
                {store.name}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-orange-600"
            onClick={() => setShowAddStore(!showAddStore)}
            data-testid="button-add-store"
          >
            <Plus className="h-4 w-4 mr-1" />
            {tf("flow.addOtherStore")}
          </Button>
          {showAddStore && (
            <div className="flex gap-2 mt-3">
              <Input
                type="text"
                placeholder={language === "ar" ? "اسم المتجر" : "Store name"}
                value={customStoreName}
                onChange={(e) => setCustomStoreName(e.target.value)}
                className="flex-1"
                data-testid="input-custom-store"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomStore()}
              />
              <Button
                onClick={handleAddCustomStore}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={!customStoreName.trim()}
                data-testid="button-confirm-add-store"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600" />
            {tf("flow.caloriesProtein")}
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                {tf("flow.caloriesPerMeal")}
              </Label>
              <div className="flex flex-wrap gap-2">
                {CALORIE_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    variant={calorieOption === option ? "default" : "outline"}
                    size="sm"
                    className={`${calorieOption === option ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                    onClick={() => setCalorieOption(option)}
                    data-testid={`button-calories-${option}`}
                  >
                    {option === "custom" ? tf("flow.custom") : `${option} ${tf("flow.kcal")}`}
                  </Button>
                ))}
              </div>
              {calorieOption === "custom" && (
                <Input
                  type="number"
                  placeholder={`< ${tf("flow.kcal")}`}
                  value={customCalories}
                  onChange={(e) => setCustomCalories(e.target.value)}
                  className="mt-2 w-32"
                  data-testid="input-custom-calories"
                />
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                {tf("flow.proteinPerMeal")}
              </Label>
              <div className="flex flex-wrap gap-2">
                {PROTEIN_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    variant={proteinOption === option ? "default" : "outline"}
                    size="sm"
                    className={`${proteinOption === option ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                    onClick={() => setProteinOption(option)}
                    data-testid={`button-protein-${option}`}
                  >
                    {option === "custom" ? tf("flow.custom") : `${option}g`}
                  </Button>
                ))}
              </div>
              {proteinOption === "custom" && (
                <Input
                  type="number"
                  placeholder="< g"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  className="mt-2 w-32"
                  data-testid="input-custom-protein"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMealCard = (meal: MealPlan) => (
    <Card key={meal.id} className="p-4 hover:shadow-md transition-shadow" data-testid={`card-meal-${meal.id}`}>
      <div className="flex justify-between items-start mb-3">
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
          {tf("flow.customize")}
        </Button>
        <Button variant="outline" size="sm" className="text-xs" data-testid={`button-note-${meal.id}`}>
          <MessageSquare className="h-3 w-3 mr-1" />
          {tf("flow.addNote")}
        </Button>
        <Button variant="outline" size="sm" className="text-xs" data-testid={`button-swap-${meal.id}`}>
          <RefreshCw className="h-3 w-3 mr-1" />
          {tf("flow.swapMeal")}
        </Button>
      </div>
    </Card>
  );

  const renderResults = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2" data-testid="text-plan-title">
          {tf("flow.myCustomPlan")}
        </h2>
        <p className="text-orange-100">
          {tf("flow.planDescription")}
        </p>
      </div>

      {mealSlots.breakfast && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="text-breakfast-section">
            {tf("flow.recommendedBreakfast")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredMeals("breakfast").map(renderMealCard)}
          </div>
        </div>
      )}

      {mealSlots.lunch && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="text-lunch-section">
            {tf("flow.recommendedLunch")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredMeals("lunch").map(renderMealCard)}
          </div>
        </div>
      )}

      {mealSlots.dinner && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid="text-dinner-section">
            {tf("flow.recommendedDinner")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredMeals("dinner").map(renderMealCard)}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <span className="text-green-600 font-medium">{tf("flow.totalSavings")}</span>
          <Button className="bg-orange-600 hover:bg-orange-700" data-testid="button-view-cart">
            <ShoppingCart className="h-4 w-4 mr-2" />
            {tf("flow.viewCart")}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    if (showResults) return renderResults();
    switch (currentStep) {
      case 1:
        return renderOnboardingStep1();
      case 2:
        return renderOnboardingStep2();
      case 3:
        return renderOnboardingStep3();
      case 4:
        return renderOnboardingStep4();
      case 5:
        return renderMealPlanStep1();
      case 6:
        return renderMealPlanStep2();
      default:
        return null;
    }
  };

  const getStepLabel = () => {
    if (currentStep <= 4) {
      return `${language === "ar" ? "الخطوة" : "Step"} ${currentStep} / 4`;
    }
    return "";
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/${language}`)}
            className="text-gray-600"
            data-testid="button-home"
          >
            <ChevronLeft className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
            {language === "ar" ? "الرئيسية" : "Home"}
          </Button>
          
          <div className="flex items-center gap-2">
            {currentStep <= 4 && (
              <span className="text-sm text-gray-500">{getStepLabel()}</span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-language">
                  <Globe className="h-4 w-4" />
                  <span className="uppercase">{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleLanguageChange("en")} data-testid="language-english">
                  🇺🇸 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange("ar")} data-testid="language-arabic">
                  🇦🇪 العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {!showResults && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                data-testid="progress-bar"
              />
            </div>
          </div>
        )}

        <Card className="p-6 md:p-8 shadow-xl mb-24">
          {renderStep()}

          {!showResults && (
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                data-testid="button-back"
              >
                <ChevronLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {tf("flow.back")}
              </Button>

              <div className="flex gap-2">
                {currentStep <= 4 && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-gray-500"
                    data-testid="button-skip"
                  >
                    {tf("flow.skip")}
                  </Button>
                )}

                {currentStep < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    disabled={currentStep === 5 && !canProceedStep5}
                    className="bg-orange-600 hover:bg-orange-700"
                    data-testid="button-next"
                  >
                    {tf("flow.next")}
                    <ChevronRight className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                  </Button>
                ) : (
                  <Button
                    onClick={handleViewMealPlan}
                    disabled={!canProceedStep6}
                    className="bg-orange-600 hover:bg-orange-700"
                    data-testid="button-view-plan"
                  >
                    {tf("flow.viewMealPlan")}
                    <ChevronRight className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
