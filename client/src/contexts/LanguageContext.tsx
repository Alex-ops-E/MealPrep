import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    "header.title": "Grocery Agent",
    "header.recipeGenerator": "Recipe Generator",
    "header.priceComparison": "Price Comparison",
    "header.mealPlanner": "Meal Planner",
    
    // Waitlist
    "waitlist.comingSoon": "Coming Soon",
    "waitlist.title": "Mobile app is launching soon!",
    "waitlist.joinCount": "Join 1000+ people on the waitlist",
    "waitlist.beFirst": "Be the first to get early access",
    "waitlist.feature.priceAlerts": "Price Alerts",
    "waitlist.feature.smartCart": "Smart Cart",
    "waitlist.feature.pantrySync": "Pantry Sync",
    "waitlist.feature.mealPlanner": "Meal Planner",
    "waitlist.feature.photoScan": "Photo Scan and Cook",
    "waitlist.namePlaceholder": "Your name (optional)",
    "waitlist.emailPlaceholder": "Your email address",
    "waitlist.button": "Get Early Access",
    "waitlist.buttonJoining": "Joining...",
    "waitlist.successTitle": "Success!",
    "waitlist.successMessage": "You've been added to the waitlist. We'll notify you when the mobile app launches!",
    "waitlist.errorTitle": "Error",
    "waitlist.errorMessage": "Failed to join waitlist. Please try again.",
    "waitlist.disclaimer": "By submitting, I agree that my data (email) may be processed and stored securely on Replit's servers located.",
    
    // Recipe Generator
    "recipe.generate": "Generate",
    "recipe.viewRecipe": "View Recipe",
    "recipe.shop": "Shop",
    "recipe.compare": "Compare",
    "recipe.whatToCook": "What would you like to cook?",
    "recipe.craving": "Describe your craving",
    "recipe.cravingPlaceholder": "e.g., a healthy 30-minute chicken meal for dinner",
    "recipe.cravingError": "Please describe what you'd like to cook",
    "recipe.quickStarts": "Quick starts",
    "recipe.healthyQuick": "Healthy & Quick",
    "recipe.healthyQuickCraving": "a healthy 30-minute meal",
    "recipe.comfortFood": "Comfort Food",
    "recipe.comfortFoodCraving": "comfort food that's hearty and satisfying",
    "recipe.dateNight": "Date Night",
    "recipe.dateNightCraving": "an impressive romantic dinner",
    "recipe.familyDinner": "Family Dinner",
    "recipe.familyDinnerCraving": "a family-friendly dinner everyone will enjoy",
    "recipe.servings": "Servings",
    "recipe.person": "person",
    "recipe.people": "people",
    "recipe.cuisineStyle": "Cuisine Style",
    "recipe.any": "Any",
    "recipe.italian": "Italian",
    "recipe.mexican": "Mexican",
    "recipe.asian": "Asian",
    "recipe.mediterranean": "Mediterranean",
    "recipe.american": "American",
    "recipe.french": "French",
    "recipe.indian": "Indian",
    "recipe.middleEastern": "Middle Eastern",
    "recipe.cookingTime": "Cooking Time",
    "recipe.15min": "15 minutes",
    "recipe.30min": "30 minutes",
    "recipe.45min": "45 minutes",
    "recipe.1hour": "1 hour",
    "recipe.2hours": "2+ hours",
    "recipe.dietaryRestrictions": "Dietary Restrictions",
    "recipe.vegetarian": "Vegetarian",
    "recipe.vegan": "Vegan",
    "recipe.glutenFree": "Gluten-Free",
    "recipe.dairyFree": "Dairy-Free",
    "recipe.keto": "Keto",
    "recipe.generateButton": "Generate Recipe with AI",
    "recipe.generating": "Generating...",
    "recipe.ingredients": "Ingredients",
    "recipe.instructions": "Instructions",
    "recipe.generateAnother": "Generate Another Recipe",
    "recipe.generatedTitle": "Recipe generated!",
    "recipe.generatedMessage": "Your recipe is ready to view",
    "recipe.failedTitle": "Generation failed",
    "recipe.continueToShop": "Continue to Shopping List",
    "recipe.shoppingListTitle": "Shopping List",
    "recipe.shoppingListDescription": "Here are the ingredients you'll need for this recipe",
    "recipe.acquired": "Acquired",
    "recipe.continueToPriceComparison": "Continue to Price Comparison",
    "recipe.priceComparisonTitle": "Price Comparison",
    "recipe.priceComparisonDescription": "Compare ingredient prices across different stores",
    "recipe.priceComparisonResults": "Price Comparison Results",
    "recipe.bestValue": "Best Value",
    "recipe.export": "Export",
    "recipe.share": "Share",
    "recipe.totalForItems": "Total for {count} items",
    "recipe.moreExpensive": "AED {amount} more expensive",
    "recipe.shopAt": "Shop at {store}",
    "recipe.item": "ITEM",
    "recipe.quantity": "QUANTITY",
    "recipe.bestDeal": "BEST DEAL",
    "recipe.action": "ACTION",
    "recipe.search": "Search",
    "recipe.buyNow": "Buy Now",
    "recipe.store": "Store",
    "recipe.price": "Price",
    "recipe.size": "Size",
    "recipe.viewProduct": "View Product",
    "recipe.startOver": "Start Over",
    "recipe.shoppingList": "Shopping List",
    "recipe.backToRecipe": "Back to Recipe",
    "recipe.comparePrices": "Compare Prices",
    "recipe.createShoppingList": "Create Shopping List",
    
    // Price Comparison Page
    "priceComparison.title": "Price Comparison Feature",
    "priceComparison.message": "The standalone price comparison feature is currently being updated. In the meantime, you can still generate delicious recipes with our AI-powered recipe generator!",
    "priceComparison.goToGenerator": "Go to Recipe Generator",
    "priceComparison.bestValue": "Best Value",
    "priceComparison.ingredient": "Ingredient",
    "priceComparison.bestDeal": "Best Deal",
    "priceComparison.disclaimer": "Prices are approximate and may vary. Please check with stores for current pricing.",
    
    // Meal Planner
    "mealPlanner.title": "Meal Planner",
    "mealPlanner.description": "Plan your meals for the week and stay organized",
    "mealPlanner.weeklyPlan": "Weekly Meal Plan",
    "mealPlanner.weekOf": "Week of",
    "mealPlanner.generateShoppingList": "Generate Shopping List",
    "mealPlanner.mealType": "Meal Type",
    "mealPlanner.monday": "Monday",
    "mealPlanner.tuesday": "Tuesday",
    "mealPlanner.wednesday": "Wednesday",
    "mealPlanner.thursday": "Thursday",
    "mealPlanner.friday": "Friday",
    "mealPlanner.saturday": "Saturday",
    "mealPlanner.sunday": "Sunday",
    "mealPlanner.breakfast": "Breakfast",
    "mealPlanner.lunch": "Lunch",
    "mealPlanner.dinner": "Dinner",
    "mealPlanner.add": "Add",
    "mealPlanner.generate": "Generate",
    "mealPlanner.addMeal": "Add Meal",
    "mealPlanner.addMealDescription": "Create a custom {type} for {day}",
    "mealPlanner.generateMealTitle": "Generate Meal with AI",
    "mealPlanner.generateMealDescription": "Let AI create a {type} recipe for {day}",
    "mealPlanner.whatToMake": "What would you like to make?",
    "mealPlanner.promptPlaceholder": "e.g., scrambled eggs with toast",
    "mealPlanner.generateMeal": "Generate Meal",
    "mealPlanner.generateWithAI": "Generate with AI",
    "mealPlanner.successTitle": "Meal Added!",
    "mealPlanner.successMessage": "Your meal has been added to the plan",
    "mealPlanner.errorTitle": "Error",
    "mealPlanner.deletedTitle": "Meal Removed",
    "mealPlanner.deletedMessage": "The meal has been removed from your plan",
    
    // Onboarding
    "onboarding.step": "Step",
    "onboarding.of": "of",
    "onboarding.skip": "Skip this question",
    "onboarding.back": "Back",
    "onboarding.next": "Next",
    "onboarding.finish": "Get Started",
    "onboarding.submitting": "Saving...",
    "onboarding.q1.title": "What's your main grocery goal?",
    "onboarding.q1.subtitle": "Choose what matters most to you",
    "onboarding.q1.options.saveMoney": "Save money",
    "onboarding.q1.options.eatHealthier": "Eat healthier",
    "onboarding.q1.options.tryNewRecipes": "Try new recipes",
    "onboarding.q1.options.trackProgress": "Track progress",
    "onboarding.q2.title": "How often do you cook at home?",
    "onboarding.q2.subtitle": "Choose the option that best describes you",
    "onboarding.q2.options.daily": "Daily",
    "onboarding.q2.options.coupleTimes": "Couple times a week",
    "onboarding.q2.options.weekly": "Weekly",
    "onboarding.q2.options.rarely": "Rarely / I mostly order",
    "onboarding.q3.title": "Where do you usually shop or order groceries?",
    "onboarding.q3.subtitle": "Select all that apply",
    "onboarding.q3.options.lulu": "Lulu Hypermarket",
    "onboarding.q3.options.carrefour": "Carrefour",
    "onboarding.q3.options.noon": "Noon",
    "onboarding.q3.options.talabat": "Talabat",
    "onboarding.q4.title": "Any diet or food preferences?",
    "onboarding.q4.subtitle": "Select all that apply",
    "onboarding.q4.options.noPreference": "No specific preference",
    "onboarding.q4.options.vegetarian": "Vegetarian",
    "onboarding.q4.options.vegan": "Vegan",
    "onboarding.q4.options.keto": "Keto / Low-carb",
    "onboarding.q4.options.halal": "Halal",
    "onboarding.q4.options.glutenFree": "Gluten-free",
    "onboarding.q4.options.dairyFree": "Dairy-free",
    "onboarding.q4.options.other": "Other",
    "onboarding.q4.otherPlaceholder": "Please specify your preference",
    "onboarding.q5.title": "Get Lifetime Beta Access",
    "onboarding.q5.subtitle": "Enter your email to unlock exclusive lifetime beta features",
    "onboarding.q5.placeholder": "your.email@example.com",
    "onboarding.q5.privacy": "We respect your privacy. Your email will only be used for beta access and important updates.",
    
    // Footer
    "footer.rights": "All rights reserved.",
    
    // Language
    "language.english": "English",
    "language.arabic": "العربية",
  },
  ar: {
    // Header
    "header.title": "وكيل البقالة",
    "header.recipeGenerator": "مولد الوصفات",
    "header.priceComparison": "مقارنة الأسعار",
    "header.mealPlanner": "مخطط الوجبات",
    
    // Waitlist
    "waitlist.comingSoon": "قريباً",
    "waitlist.title": "تطبيق الجوال سيُطلق قريباً!",
    "waitlist.joinCount": "انضم إلى أكثر من 1000 شخص في قائمة الانتظار",
    "waitlist.beFirst": "كن أول من يحصل على وصول مبكر",
    "waitlist.feature.priceAlerts": "تنبيهات الأسعار",
    "waitlist.feature.smartCart": "سلة ذكية",
    "waitlist.feature.pantrySync": "مزامنة المخزن",
    "waitlist.feature.mealPlanner": "مخطط الوجبات",
    "waitlist.feature.photoScan": "مسح الصور والطبخ",
    "waitlist.namePlaceholder": "اسمك (اختياري)",
    "waitlist.emailPlaceholder": "عنوان بريدك الإلكتروني",
    "waitlist.button": "احصل على وصول مبكر",
    "waitlist.buttonJoining": "جاري الانضمام...",
    "waitlist.successTitle": "نجاح!",
    "waitlist.successMessage": "تمت إضافتك إلى قائمة الانتظار. سنُبلغك عند إطلاق التطبيق!",
    "waitlist.errorTitle": "خطأ",
    "waitlist.errorMessage": "فشل الانضمام إلى قائمة الانتظار. يرجى المحاولة مرة أخرى.",
    "waitlist.disclaimer": "بالإرسال، أوافق على أنه يجوز معالجة بياناتي (البريد الإلكتروني) وتخزينها بشكل آمن.",
    
    // Recipe Generator
    "recipe.generate": "إنشاء",
    "recipe.viewRecipe": "عرض الوصفة",
    "recipe.shop": "تسوق",
    "recipe.compare": "قارن",
    "recipe.whatToCook": "ماذا تريد أن تطبخ؟",
    "recipe.craving": "صف ما تشتهيه",
    "recipe.cravingPlaceholder": "مثال: وجبة دجاج صحية في 30 دقيقة للعشاء",
    "recipe.cravingError": "يرجى وصف ما تريد طبخه",
    "recipe.quickStarts": "بداية سريعة",
    "recipe.healthyQuick": "صحي وسريع",
    "recipe.healthyQuickCraving": "وجبة صحية في 30 دقيقة",
    "recipe.comfortFood": "طعام مريح",
    "recipe.comfortFoodCraving": "طعام مريح دسم ومُشبع",
    "recipe.dateNight": "ليلة رومانسية",
    "recipe.dateNightCraving": "عشاء رومانسي مميز",
    "recipe.familyDinner": "عشاء عائلي",
    "recipe.familyDinnerCraving": "عشاء عائلي يحبه الجميع",
    "recipe.servings": "الحصص",
    "recipe.person": "شخص",
    "recipe.people": "أشخاص",
    "recipe.cuisineStyle": "نوع المطبخ",
    "recipe.any": "أي نوع",
    "recipe.italian": "إيطالي",
    "recipe.mexican": "مكسيكي",
    "recipe.asian": "آسيوي",
    "recipe.mediterranean": "متوسطي",
    "recipe.american": "أمريكي",
    "recipe.french": "فرنسي",
    "recipe.indian": "هندي",
    "recipe.middleEastern": "شرق أوسطي",
    "recipe.cookingTime": "وقت الطبخ",
    "recipe.15min": "15 دقيقة",
    "recipe.30min": "30 دقيقة",
    "recipe.45min": "45 دقيقة",
    "recipe.1hour": "ساعة واحدة",
    "recipe.2hours": "ساعتان أو أكثر",
    "recipe.dietaryRestrictions": "القيود الغذائية",
    "recipe.vegetarian": "نباتي",
    "recipe.vegan": "نباتي صرف",
    "recipe.glutenFree": "خالي من الغلوتين",
    "recipe.dairyFree": "خالي من الألبان",
    "recipe.keto": "كيتو",
    "recipe.generateButton": "إنشاء وصفة بالذكاء الاصطناعي",
    "recipe.generating": "جاري الإنشاء...",
    "recipe.ingredients": "المكونات",
    "recipe.instructions": "التعليمات",
    "recipe.generateAnother": "إنشاء وصفة أخرى",
    "recipe.generatedTitle": "تم إنشاء الوصفة!",
    "recipe.generatedMessage": "وصفتك جاهزة للعرض",
    "recipe.failedTitle": "فشل الإنشاء",
    "recipe.continueToShop": "متابعة إلى قائمة التسوق",
    "recipe.shoppingListTitle": "قائمة التسوق",
    "recipe.shoppingListDescription": "إليك المكونات التي ستحتاجها لهذه الوصفة",
    "recipe.acquired": "تم الحصول عليه",
    "recipe.continueToPriceComparison": "متابعة إلى مقارنة الأسعار",
    "recipe.priceComparisonTitle": "مقارنة الأسعار",
    "recipe.priceComparisonDescription": "قارن أسعار المكونات في المتاجر المختلفة",
    "recipe.priceComparisonResults": "نتائج مقارنة الأسعار",
    "recipe.bestValue": "أفضل قيمة",
    "recipe.export": "تصدير",
    "recipe.share": "مشاركة",
    "recipe.totalForItems": "الإجمالي لـ {count} عناصر",
    "recipe.moreExpensive": "أغلى بـ {amount} درهم",
    "recipe.shopAt": "تسوق في {store}",
    "recipe.item": "العنصر",
    "recipe.quantity": "الكمية",
    "recipe.bestDeal": "أفضل سعر",
    "recipe.action": "إجراء",
    "recipe.search": "بحث",
    "recipe.buyNow": "اشتري الآن",
    "recipe.store": "المتجر",
    "recipe.price": "السعر",
    "recipe.size": "الحجم",
    "recipe.viewProduct": "عرض المنتج",
    "recipe.startOver": "البدء من جديد",
    "recipe.shoppingList": "قائمة التسوق",
    "recipe.backToRecipe": "العودة للوصفة",
    "recipe.comparePrices": "مقارنة الأسعار",
    "recipe.createShoppingList": "إنشاء قائمة التسوق",
    
    // Price Comparison Page
    "priceComparison.title": "ميزة مقارنة الأسعار",
    "priceComparison.message": "ميزة مقارنة الأسعار المستقلة قيد التحديث حالياً. في هذه الأثناء، يمكنك إنشاء وصفات لذيذة باستخدام مولد الوصفات بالذكاء الاصطناعي!",
    "priceComparison.goToGenerator": "انتقل إلى مولد الوصفات",
    "priceComparison.bestValue": "أفضل قيمة",
    "priceComparison.ingredient": "المكون",
    "priceComparison.bestDeal": "أفضل سعر",
    "priceComparison.disclaimer": "الأسعار تقريبية وقد تختلف. يرجى التحقق من المتاجر للأسعار الحالية.",
    
    // Meal Planner
    "mealPlanner.title": "مخطط الوجبات",
    "mealPlanner.description": "خطط وجباتك للأسبوع وابق منظماً",
    "mealPlanner.weeklyPlan": "خطة الوجبات الأسبوعية",
    "mealPlanner.weekOf": "أسبوع",
    "mealPlanner.generateShoppingList": "إنشاء قائمة التسوق",
    "mealPlanner.mealType": "نوع الوجبة",
    "mealPlanner.monday": "الإثنين",
    "mealPlanner.tuesday": "الثلاثاء",
    "mealPlanner.wednesday": "الأربعاء",
    "mealPlanner.thursday": "الخميس",
    "mealPlanner.friday": "الجمعة",
    "mealPlanner.saturday": "السبت",
    "mealPlanner.sunday": "الأحد",
    "mealPlanner.breakfast": "الإفطار",
    "mealPlanner.lunch": "الغداء",
    "mealPlanner.dinner": "العشاء",
    "mealPlanner.add": "إضافة",
    "mealPlanner.generate": "إنشاء",
    "mealPlanner.addMeal": "إضافة وجبة",
    "mealPlanner.addMealDescription": "إنشاء {type} مخصص لـ {day}",
    "mealPlanner.generateMealTitle": "إنشاء وجبة بالذكاء الاصطناعي",
    "mealPlanner.generateMealDescription": "دع الذكاء الاصطناعي يُنشئ وصفة {type} لـ {day}",
    "mealPlanner.whatToMake": "ماذا تريد أن تصنع؟",
    "mealPlanner.promptPlaceholder": "مثال: بيض مخفوق مع خبز محمص",
    "mealPlanner.generateMeal": "إنشاء وجبة",
    "mealPlanner.generateWithAI": "إنشاء بالذكاء الاصطناعي",
    "mealPlanner.successTitle": "تمت إضافة الوجبة!",
    "mealPlanner.successMessage": "تمت إضافة وجبتك إلى الخطة",
    "mealPlanner.errorTitle": "خطأ",
    "mealPlanner.deletedTitle": "تم حذف الوجبة",
    "mealPlanner.deletedMessage": "تم حذف الوجبة من خطتك",
    
    // Onboarding
    "onboarding.step": "الخطوة",
    "onboarding.of": "من",
    "onboarding.skip": "تخطي هذا السؤال",
    "onboarding.back": "رجوع",
    "onboarding.next": "التالي",
    "onboarding.finish": "ابدأ",
    "onboarding.submitting": "جاري الحفظ...",
    "onboarding.q1.title": "ما هو هدفك الرئيسي من التسوق؟",
    "onboarding.q1.subtitle": "اختر ما يهمك أكثر",
    "onboarding.q1.options.saveMoney": "توفير المال",
    "onboarding.q1.options.eatHealthier": "أكل صحي أكثر",
    "onboarding.q1.options.tryNewRecipes": "تجربة وصفات جديدة",
    "onboarding.q1.options.trackProgress": "تتبع التقدم",
    "onboarding.q2.title": "كم مرة تطبخ في المنزل؟",
    "onboarding.q2.subtitle": "اختر الخيار الذي يصفك أفضل",
    "onboarding.q2.options.daily": "يومياً",
    "onboarding.q2.options.coupleTimes": "عدة مرات في الأسبوع",
    "onboarding.q2.options.weekly": "أسبوعياً",
    "onboarding.q2.options.rarely": "نادراً / أطلب في الغالب",
    "onboarding.q3.title": "أين تتسوق عادة أو تطلب البقالة؟",
    "onboarding.q3.subtitle": "اختر كل ما ينطبق",
    "onboarding.q3.options.lulu": "لولو هايبرماركت",
    "onboarding.q3.options.carrefour": "كارفور",
    "onboarding.q3.options.noon": "نون",
    "onboarding.q3.options.talabat": "طلبات",
    "onboarding.q4.title": "أي نظام غذائي أو تفضيلات طعام؟",
    "onboarding.q4.subtitle": "اختر كل ما ينطبق",
    "onboarding.q4.options.noPreference": "لا تفضيل محدد",
    "onboarding.q4.options.vegetarian": "نباتي",
    "onboarding.q4.options.vegan": "نباتي صرف",
    "onboarding.q4.options.keto": "كيتو / منخفض الكربوهيدرات",
    "onboarding.q4.options.halal": "حلال",
    "onboarding.q4.options.glutenFree": "خالي من الغلوتين",
    "onboarding.q4.options.dairyFree": "خالي من الألبان",
    "onboarding.q4.options.other": "أخرى",
    "onboarding.q4.otherPlaceholder": "يرجى تحديد تفضيلك",
    "onboarding.q5.title": "احصل على وصول بيتا مدى الحياة",
    "onboarding.q5.subtitle": "أدخل بريدك الإلكتروني لفتح ميزات بيتا الحصرية مدى الحياة",
    "onboarding.q5.placeholder": "بريدك@example.com",
    "onboarding.q5.privacy": "نحن نحترم خصوصيتك. سيتم استخدام بريدك الإلكتروني فقط للوصول التجريبي والتحديثات المهمة.",
    
    // Footer
    "footer.rights": "جميع الحقوق محفوظة.",
    
    // Language
    "language.english": "English",
    "language.arabic": "العربية",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [language, setLanguageState] = useState<Language>(() => {
    const pathLang = location.split('/')[1];
    return (pathLang === 'en' || pathLang === 'ar') ? pathLang : 'ar';
  });

  useEffect(() => {
    const pathLang = location.split('/')[1];
    if (pathLang === 'en' || pathLang === 'ar') {
      setLanguageState(pathLang);
    }
  }, [location]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key];
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }
    
    return translation;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
