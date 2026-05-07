import React, { createContext, useContext, useState } from "react";

export type Language = "en" | "ar";

interface LanguageContextValue {
  language: Language;
  isRTL: boolean;
  toggleLanguage: () => void;
  t: (key: keyof typeof strings.en) => string;
  fontFamily: (weight?: "regular" | "bold") => string;
}

export const strings = {
  en: {
    appName: "Grocery Agent",
    goodDay: "Good day!",
    whatCraving: "What are you craving?",
    searchRecipes: "Search recipes...",
    aiRecipeGen: "AI Recipe Generator",
    aiRecipeGenSub: "Describe a craving, get a personalised recipe",
    generateRecipe: "Generate Recipe",
    yourRecipes: "Your Recipes",
    featuredRecipes: "Featured Recipes",
    results: "results",
    noRecipesFound: "No recipes found",
    dishMatch: "Dish Match",
    dishMatchSub: "Swipe to decide what to eat",
    mealPlanner: "Meal Planner",
    weekOf: "Week of",
    meals: "meals",
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    addMeal: "Add",
    aiPick: "AI Pick",
    generatingMeal: "Generating meal...",
    quickPicks: "Quick picks",
    weeklySummary: "Weekly Summary",
    mealsPlanned: "Meals planned",
    daysCovered: "Days covered",
    daysToPlan: "Days to plan",
    loadingMeals: "Loading meal plan...",
  },
  ar: {
    appName: "وكيل البقالة",
    goodDay: "يوم سعيد!",
    whatCraving: "ماذا تشتهي؟",
    searchRecipes: "ابحث عن وصفات...",
    aiRecipeGen: "مولّد الوصفات بالذكاء الاصطناعي",
    aiRecipeGenSub: "صف شهيتك، واحصل على وصفة مخصصة",
    generateRecipe: "توليد الوصفة",
    yourRecipes: "وصفاتك",
    featuredRecipes: "الوصفات المميزة",
    results: "نتيجة",
    noRecipesFound: "لا توجد وصفات",
    dishMatch: "مطابقة الأطباق",
    dishMatchSub: "امسح لتختار ما ستأكله",
    mealPlanner: "مخطط الوجبات",
    weekOf: "أسبوع",
    meals: "وجبات",
    breakfast: "الإفطار",
    lunch: "الغداء",
    dinner: "العشاء",
    addMeal: "إضافة",
    aiPick: "اختيار الذكاء الاصطناعي",
    generatingMeal: "جاري إنشاء الوجبة...",
    quickPicks: "الاختيارات السريعة",
    weeklySummary: "ملخص الأسبوع",
    mealsPlanned: "وجبات مخططة",
    daysCovered: "أيام مغطاة",
    daysToPlan: "أيام للتخطيط",
    loadingMeals: "جاري تحميل خطة الوجبات...",
  },
} as const;

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const toggleLanguage = () => setLanguage((l) => (l === "en" ? "ar" : "en"));

  const t = (key: keyof typeof strings.en): string => strings[language][key];

  const fontFamily = (weight: "regular" | "bold" = "regular"): string => {
    if (language === "ar") {
      return weight === "bold" ? "NotoSansArabic_700Bold" : "NotoSansArabic_400Regular";
    }
    return weight === "bold" ? "Inter_700Bold" : "Inter_400Regular";
  };

  return (
    <LanguageContext.Provider
      value={{ language, isRTL: language === "ar", toggleLanguage, t, fontFamily }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
