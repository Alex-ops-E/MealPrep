import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronLeft, Globe, Store, Search, TrendingDown, ShoppingCart, Plus, Check, Tag, Percent } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PREFERRED_STORES = [
  { id: "lulu", name: "Lulu Hypermarket", nameAr: "لولو هايبرماركت", logo: "🛒", color: "bg-green-500" },
  { id: "carrefour", name: "Carrefour", nameAr: "كارفور", logo: "🏪", color: "bg-blue-500" },
  { id: "noon", name: "Noon", nameAr: "نون", logo: "🌙", color: "bg-yellow-500" },
  { id: "talabat", name: "Talabat", nameAr: "طلبات", logo: "🍽️", color: "bg-orange-500" },
];

const SHOPPING_FREQUENCY = ["weekly", "biweekly", "monthly", "asNeeded"];
const BUDGET_OPTIONS = ["under500", "500to1000", "1000to2000", "over2000"];
const COMPARISON_PRIORITIES = ["lowestPrice", "bestDeals", "fastestDelivery", "organicOptions"];

interface GroceryItem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
}

const SAMPLE_GROCERIES: GroceryItem[] = [
  { id: "1", name: "Chicken Breast", nameAr: "صدور الدجاج", category: "meat" },
  { id: "2", name: "Fresh Milk", nameAr: "حليب طازج", category: "dairy" },
  { id: "3", name: "Eggs (30 pack)", nameAr: "بيض (30 حبة)", category: "dairy" },
  { id: "4", name: "Rice (5kg)", nameAr: "أرز (5 كجم)", category: "grains" },
  { id: "5", name: "Olive Oil", nameAr: "زيت زيتون", category: "oils" },
  { id: "6", name: "Tomatoes", nameAr: "طماطم", category: "vegetables" },
  { id: "7", name: "Onions", nameAr: "بصل", category: "vegetables" },
  { id: "8", name: "Bananas", nameAr: "موز", category: "fruits" },
  { id: "9", name: "Apples", nameAr: "تفاح", category: "fruits" },
  { id: "10", name: "Bread", nameAr: "خبز", category: "bakery" },
];

export default function OnboardingComparison() {
  const [location, setLocation] = useLocation();
  const { language, isRTL } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);

  const handleLanguageChange = (newLang: "en" | "ar") => {
    const currentPath = location.replace(/^\/(en|ar)/, '');
    setLocation(`/${newLang}${currentPath || ''}`);
  };

  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [shoppingFrequency, setShoppingFrequency] = useState<string>("");
  const [monthlyBudget, setMonthlyBudget] = useState<string>("");
  const [comparisonPriority, setComparisonPriority] = useState<string>("");
  const [selectedGroceries, setSelectedGroceries] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState("");
  const [customItems, setCustomItems] = useState<{id: string; name: string}[]>([]);
  const [showAddStore, setShowAddStore] = useState(false);
  const [customStoreName, setCustomStoreName] = useState("");
  const [customStores, setCustomStores] = useState<{id: string; name: string}[]>([]);

  const totalSteps = 4;

  const translations: Record<string, Record<string, string>> = {
    en: {
      "comp.step1.title": "Where do you usually shop?",
      "comp.step1.subtitle": "Select your favorite grocery stores for price comparison",
      "comp.lulu": "Lulu Hypermarket",
      "comp.carrefour": "Carrefour",
      "comp.noon": "Noon",
      "comp.talabat": "Talabat",
      "comp.addStore": "Add other store",
      "comp.enterStoreName": "Enter store name",
      "comp.add": "Add",
      
      "comp.step2.title": "How often do you shop?",
      "comp.step2.subtitle": "This helps us optimize your price alerts",
      "comp.weekly": "Weekly",
      "comp.biweekly": "Every 2 weeks",
      "comp.monthly": "Monthly",
      "comp.asNeeded": "As needed",
      
      "comp.step3.title": "What's your monthly grocery budget?",
      "comp.step3.subtitle": "We'll help you find the best deals within your budget",
      "comp.under500": "Under 500 AED",
      "comp.500to1000": "500 - 1,000 AED",
      "comp.1000to2000": "1,000 - 2,000 AED",
      "comp.over2000": "Over 2,000 AED",
      
      "comp.step4.title": "What matters most to you?",
      "comp.step4.subtitle": "We'll prioritize results based on your preference",
      "comp.lowestPrice": "Lowest Price",
      "comp.lowestPriceDesc": "Always show the cheapest option first",
      "comp.bestDeals": "Best Deals & Offers",
      "comp.bestDealsDesc": "Highlight discounts and promotions",
      "comp.fastestDelivery": "Fastest Delivery",
      "comp.fastestDeliveryDesc": "Prioritize stores with quick delivery",
      "comp.organicOptions": "Organic & Healthy",
      "comp.organicOptionsDesc": "Focus on organic and health products",
      
      "comp.back": "Back",
      "comp.next": "Next",
      "comp.skip": "Skip",
      "comp.startComparing": "Start Comparing Prices",
      "comp.step": "Step",
    },
    ar: {
      "comp.step1.title": "أين تتسوق عادة؟",
      "comp.step1.subtitle": "اختر متاجر البقالة المفضلة لديك لمقارنة الأسعار",
      "comp.lulu": "لولو هايبرماركت",
      "comp.carrefour": "كارفور",
      "comp.noon": "نون",
      "comp.talabat": "طلبات",
      "comp.addStore": "إضافة متجر آخر",
      "comp.enterStoreName": "أدخل اسم المتجر",
      "comp.add": "إضافة",
      
      "comp.step2.title": "كم مرة تتسوق؟",
      "comp.step2.subtitle": "يساعدنا هذا في تحسين تنبيهات الأسعار الخاصة بك",
      "comp.weekly": "أسبوعياً",
      "comp.biweekly": "كل أسبوعين",
      "comp.monthly": "شهرياً",
      "comp.asNeeded": "حسب الحاجة",
      
      "comp.step3.title": "ما هي ميزانيتك الشهرية للبقالة؟",
      "comp.step3.subtitle": "سنساعدك في العثور على أفضل العروض ضمن ميزانيتك",
      "comp.under500": "أقل من 500 درهم",
      "comp.500to1000": "500 - 1,000 درهم",
      "comp.1000to2000": "1,000 - 2,000 درهم",
      "comp.over2000": "أكثر من 2,000 درهم",
      
      "comp.step4.title": "ما الأهم بالنسبة لك؟",
      "comp.step4.subtitle": "سنعطي الأولوية للنتائج بناءً على تفضيلاتك",
      "comp.lowestPrice": "أقل سعر",
      "comp.lowestPriceDesc": "عرض الخيار الأرخص دائماً أولاً",
      "comp.bestDeals": "أفضل العروض والخصومات",
      "comp.bestDealsDesc": "تسليط الضوء على الخصومات والعروض الترويجية",
      "comp.fastestDelivery": "أسرع توصيل",
      "comp.fastestDeliveryDesc": "إعطاء الأولوية للمتاجر ذات التوصيل السريع",
      "comp.organicOptions": "عضوي وصحي",
      "comp.organicOptionsDesc": "التركيز على المنتجات العضوية والصحية",
      
      "comp.back": "رجوع",
      "comp.next": "التالي",
      "comp.skip": "تخطي",
      "comp.startComparing": "ابدأ مقارنة الأسعار",
      "comp.step": "الخطوة",
    }
  };

  const tf = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const handleStoreToggle = (storeId: string) => {
    setSelectedStores(prev =>
      prev.includes(storeId) ? prev.filter(s => s !== storeId) : [...prev, storeId]
    );
  };

  const handleAddCustomStore = () => {
    if (customStoreName.trim()) {
      const newStoreId = `custom_${Date.now()}`;
      setCustomStores(prev => [...prev, { id: newStoreId, name: customStoreName.trim() }]);
      setSelectedStores(prev => [...prev, newStoreId]);
      setCustomStoreName("");
      setShowAddStore(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === totalSteps) {
      try {
        const sessionId = `comparison_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await apiRequest("POST", "/api/onboarding", {
          sessionId,
          groceryGoal: comparisonPriority || null,
          cookingFrequency: shoppingFrequency || null,
          preferredStores: selectedStores.length > 0 ? selectedStores : null,
          dietPreferences: monthlyBudget ? [monthlyBudget] : null,
          email: null,
        });
      } catch (error) {
        console.error("Failed to save onboarding:", error);
      }
      setLocation(`/${language}/price-comparison`);
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedStores.length > 0;
      case 2: return shoppingFrequency !== "";
      case 3: return monthlyBudget !== "";
      case 4: return comparisonPriority !== "";
      default: return true;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <Store className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("comp.step1.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-step-subtitle">
          {tf("comp.step1.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PREFERRED_STORES.map(store => (
          <button
            key={store.id}
            onClick={() => handleStoreToggle(store.id)}
            className={`p-4 rounded-xl border-2 transition-all text-start ${
              selectedStores.includes(store.id)
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            data-testid={`button-store-${store.id}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${store.color} rounded-lg flex items-center justify-center text-2xl`}>
                {store.logo}
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900">
                  {language === "ar" ? store.nameAr : store.name}
                </span>
              </div>
              {selectedStores.includes(store.id) && (
                <Check className="h-5 w-5 text-orange-600" />
              )}
            </div>
          </button>
        ))}
        
        {customStores.map(store => (
          <button
            key={store.id}
            onClick={() => handleStoreToggle(store.id)}
            className={`p-4 rounded-xl border-2 transition-all text-start ${
              selectedStores.includes(store.id)
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            data-testid={`button-store-${store.id}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center text-2xl">
                🏬
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900">{store.name}</span>
              </div>
              {selectedStores.includes(store.id) && (
                <Check className="h-5 w-5 text-orange-600" />
              )}
            </div>
          </button>
        ))}
      </div>

      {!showAddStore ? (
        <Button
          variant="outline"
          onClick={() => setShowAddStore(true)}
          className="w-full border-dashed border-2"
          data-testid="button-add-store"
        >
          <Plus className="h-4 w-4 mr-2" />
          {tf("comp.addStore")}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input
            value={customStoreName}
            onChange={(e) => setCustomStoreName(e.target.value)}
            placeholder={tf("comp.enterStoreName")}
            className="flex-1"
            data-testid="input-custom-store"
          />
          <Button onClick={handleAddCustomStore} className="bg-orange-600 hover:bg-orange-700" data-testid="button-add-custom-store">
            {tf("comp.add")}
          </Button>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <ShoppingCart className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("comp.step2.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-step-subtitle">
          {tf("comp.step2.subtitle")}
        </p>
      </div>

      <div className="space-y-3">
        {SHOPPING_FREQUENCY.map(freq => (
          <button
            key={freq}
            onClick={() => setShoppingFrequency(freq)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-start ${
              shoppingFrequency === freq
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            data-testid={`button-frequency-${freq}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{tf(`comp.${freq}`)}</span>
              {shoppingFrequency === freq && (
                <Check className="h-5 w-5 text-blue-600" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Tag className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("comp.step3.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-step-subtitle">
          {tf("comp.step3.subtitle")}
        </p>
      </div>

      <div className="space-y-3">
        {BUDGET_OPTIONS.map(budget => (
          <button
            key={budget}
            onClick={() => setMonthlyBudget(budget)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-start ${
              monthlyBudget === budget
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            data-testid={`button-budget-${budget}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{tf(`comp.${budget}`)}</span>
              {monthlyBudget === budget && (
                <Check className="h-5 w-5 text-green-600" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <TrendingDown className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("comp.step4.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-step-subtitle">
          {tf("comp.step4.subtitle")}
        </p>
      </div>

      <div className="space-y-3">
        {COMPARISON_PRIORITIES.map(priority => {
          const icons: Record<string, any> = {
            lowestPrice: TrendingDown,
            bestDeals: Percent,
            fastestDelivery: ShoppingCart,
            organicOptions: Search,
          };
          const Icon = icons[priority] || TrendingDown;
          
          return (
            <button
              key={priority}
              onClick={() => setComparisonPriority(priority)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-start ${
                comparisonPriority === priority
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              data-testid={`button-priority-${priority}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  comparisonPriority === priority ? "bg-purple-200" : "bg-gray-100"
                }`}>
                  <Icon className={`h-5 w-5 ${comparisonPriority === priority ? "text-purple-600" : "text-gray-500"}`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{tf(`comp.${priority}`)}</div>
                  <div className="text-sm text-gray-500">{tf(`comp.${priority}Desc`)}</div>
                </div>
                {comparisonPriority === priority && (
                  <Check className="h-5 w-5 text-purple-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-lg mx-auto px-4 py-8">
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
            <span className="text-sm text-gray-500">
              {tf("comp.step")} {currentStep} / {totalSteps}
            </span>
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

        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>

        <Card className="p-6 md:p-8 shadow-xl mb-24">
          {renderStep()}

          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              data-testid="button-back"
            >
              <ChevronLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {tf("comp.back")}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-gray-500"
                data-testid="button-skip"
              >
                {tf("comp.skip")}
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-orange-600 hover:bg-orange-700"
                data-testid="button-next"
              >
                {currentStep === totalSteps ? tf("comp.startComparing") : tf("comp.next")}
                <ChevronRight className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
