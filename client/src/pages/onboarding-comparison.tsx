import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronLeft, Globe, Store, Search, TrendingDown, ShoppingCart, Plus, Check, Percent, ArrowRight, Sparkles, Crown, Mail, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

const COMPARISON_PRIORITIES = ["lowestPrice", "bestDeals", "fastestDelivery", "organicOptions"];

const DEMO_ITEMS = [
  {
    id: "chicken",
    name: "Chicken Breast (1kg)",
    nameAr: "صدور دجاج (1 كجم)",
    prices: [
      { store: "Lulu Hypermarket", storeAr: "لولو هايبرماركت", price: 28, originalPrice: 35, logo: "🛒", color: "bg-green-500" },
      { store: "Carrefour", storeAr: "كارفور", price: 32, originalPrice: 32, logo: "🏪", color: "bg-blue-500" },
      { store: "Noon", storeAr: "نون", price: 30, originalPrice: 38, logo: "🌙", color: "bg-yellow-500" },
      { store: "Talabat", storeAr: "طلبات", price: 35, originalPrice: 35, logo: "🍽️", color: "bg-orange-500" },
    ]
  },
  {
    id: "milk",
    name: "Fresh Milk (1L)",
    nameAr: "حليب طازج (1 لتر)",
    prices: [
      { store: "Lulu Hypermarket", storeAr: "لولو هايبرماركت", price: 7, originalPrice: 7, logo: "🛒", color: "bg-green-500" },
      { store: "Carrefour", storeAr: "كارفور", price: 6.5, originalPrice: 8, logo: "🏪", color: "bg-blue-500" },
      { store: "Noon", storeAr: "نون", price: 7.5, originalPrice: 7.5, logo: "🌙", color: "bg-yellow-500" },
      { store: "Talabat", storeAr: "طلبات", price: 8, originalPrice: 8, logo: "🍽️", color: "bg-orange-500" },
    ]
  },
  {
    id: "rice",
    name: "Basmati Rice (5kg)",
    nameAr: "أرز بسمتي (5 كجم)",
    prices: [
      { store: "Lulu Hypermarket", storeAr: "لولو هايبرماركت", price: 45, originalPrice: 52, logo: "🛒", color: "bg-green-500" },
      { store: "Carrefour", storeAr: "كارفور", price: 48, originalPrice: 48, logo: "🏪", color: "bg-blue-500" },
      { store: "Noon", storeAr: "نون", price: 42, originalPrice: 55, logo: "🌙", color: "bg-yellow-500" },
      { store: "Talabat", storeAr: "طلبات", price: 50, originalPrice: 50, logo: "🍽️", color: "bg-orange-500" },
    ]
  }
];

export default function OnboardingComparison() {
  const [location, setLocation] = useLocation();
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLanguageChange = (newLang: "en" | "ar") => {
    const currentPath = location.replace(/^\/(en|ar)/, '');
    setLocation(`/${newLang}${currentPath || ''}`);
  };

  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [comparisonPriority, setComparisonPriority] = useState<string>("");
  const [showAddStore, setShowAddStore] = useState(false);
  const [customStoreName, setCustomStoreName] = useState("");
  const [customStores, setCustomStores] = useState<{id: string; name: string}[]>([]);
  const [selectedDemoItem, setSelectedDemoItem] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [betaEmail, setBetaEmail] = useState("");
  const [betaName, setBetaName] = useState("");

  const totalSteps = 5;

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
      
      "comp.step2.title": "What matters most to you?",
      "comp.step2.subtitle": "We'll prioritize results based on your preference",
      "comp.lowestPrice": "Lowest Price",
      "comp.lowestPriceDesc": "Always show the cheapest option first",
      "comp.bestDeals": "Best Deals & Offers",
      "comp.bestDealsDesc": "Highlight discounts and promotions",
      "comp.fastestDelivery": "Fastest Delivery",
      "comp.fastestDeliveryDesc": "Prioritize stores with quick delivery",
      "comp.organicOptions": "Organic & Healthy",
      "comp.organicOptionsDesc": "Focus on organic and health products",
      
      "comp.step3.title": "Let's try it! Search for an item",
      "comp.step3.subtitle": "Type a grocery item to see prices across stores",
      "comp.searchPlaceholder": "e.g. chicken, milk, rice...",
      "comp.orTry": "Or try these popular items:",
      "comp.bestPrice": "Best Price",
      "comp.savings": "Save",
      
      "comp.step4.title": "See how easy it is!",
      "comp.step4.subtitle": "Here's how we compare prices for you",
      "comp.demoTitle": "Price Comparison",
      "comp.lowestPriceLabel": "Lowest",
      "comp.addToCart": "Add to Cart",
      "comp.youSave": "You save",
      "comp.comparedTo": "compared to highest price",
      
      "comp.step5.title": "Get Lifetime Beta Access",
      "comp.step5.subtitle": "Be among the first to use our full price comparison features",
      "comp.step5.benefit1": "Free lifetime access to all premium features",
      "comp.step5.benefit2": "Early access to new stores and deals",
      "comp.step5.benefit3": "Priority customer support",
      "comp.step5.benefit4": "Exclusive member-only discounts",
      "comp.emailPlaceholder": "Enter your email",
      "comp.namePlaceholder": "Your name (optional)",
      "comp.getBetaAccess": "Get Lifetime Beta Access",
      "comp.skipForNow": "Skip for now",
      "comp.joining": "Joining...",
      "comp.successTitle": "Welcome to the Beta!",
      "comp.successMessage": "You're now a lifetime beta member.",
      
      "comp.back": "Back",
      "comp.next": "Next",
      "comp.skip": "Skip",
      "comp.startComparing": "Start Comparing Prices",
      "comp.step": "Step",
      "comp.tryAnother": "Try another item",
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
      
      "comp.step2.title": "ما الأهم بالنسبة لك؟",
      "comp.step2.subtitle": "سنعطي الأولوية للنتائج بناءً على تفضيلاتك",
      "comp.lowestPrice": "أقل سعر",
      "comp.lowestPriceDesc": "عرض الخيار الأرخص دائماً أولاً",
      "comp.bestDeals": "أفضل العروض والخصومات",
      "comp.bestDealsDesc": "تسليط الضوء على الخصومات والعروض الترويجية",
      "comp.fastestDelivery": "أسرع توصيل",
      "comp.fastestDeliveryDesc": "إعطاء الأولوية للمتاجر ذات التوصيل السريع",
      "comp.organicOptions": "عضوي وصحي",
      "comp.organicOptionsDesc": "التركيز على المنتجات العضوية والصحية",
      
      "comp.step3.title": "لنجرب! ابحث عن منتج",
      "comp.step3.subtitle": "اكتب منتج بقالة لترى الأسعار في المتاجر المختلفة",
      "comp.searchPlaceholder": "مثال: دجاج، حليب، أرز...",
      "comp.orTry": "أو جرب هذه المنتجات الشائعة:",
      "comp.bestPrice": "أفضل سعر",
      "comp.savings": "وفر",
      
      "comp.step4.title": "انظر كم هو سهل!",
      "comp.step4.subtitle": "إليك كيف نقارن الأسعار لك",
      "comp.demoTitle": "مقارنة الأسعار",
      "comp.lowestPriceLabel": "الأقل",
      "comp.addToCart": "أضف للسلة",
      "comp.youSave": "توفر",
      "comp.comparedTo": "مقارنة بأعلى سعر",
      
      "comp.step5.title": "احصل على وصول بيتا مدى الحياة",
      "comp.step5.subtitle": "كن من أوائل المستخدمين لميزات مقارنة الأسعار الكاملة",
      "comp.step5.benefit1": "وصول مجاني مدى الحياة لجميع الميزات المميزة",
      "comp.step5.benefit2": "وصول مبكر للمتاجر والعروض الجديدة",
      "comp.step5.benefit3": "دعم عملاء ذو أولوية",
      "comp.step5.benefit4": "خصومات حصرية للأعضاء فقط",
      "comp.emailPlaceholder": "أدخل بريدك الإلكتروني",
      "comp.namePlaceholder": "اسمك (اختياري)",
      "comp.getBetaAccess": "احصل على وصول بيتا مدى الحياة",
      "comp.skipForNow": "تخطي الآن",
      "comp.joining": "جاري الانضمام...",
      "comp.successTitle": "مرحباً بك في البيتا!",
      "comp.successMessage": "أنت الآن عضو بيتا مدى الحياة.",
      
      "comp.back": "رجوع",
      "comp.next": "التالي",
      "comp.skip": "تخطي",
      "comp.startComparing": "ابدأ مقارنة الأسعار",
      "comp.step": "الخطوة",
      "comp.tryAnother": "جرب منتج آخر",
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

  const saveOnboardingData = async (email?: string | null) => {
    try {
      const sessionId = `comparison_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await apiRequest("POST", "/api/onboarding", {
        sessionId,
        groceryGoal: comparisonPriority || null,
        cookingFrequency: null,
        preferredStores: selectedStores.length > 0 ? selectedStores : null,
        dietPreferences: null,
        email: email || null,
      });
    } catch (error) {
      console.error("Failed to save onboarding:", error);
    }
  };

  const handleBetaSignup = async () => {
    if (!betaEmail.trim()) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/waitlist", {
        email: betaEmail.trim(),
        name: betaName.trim() || null,
      });
      
      await saveOnboardingData(betaEmail.trim());
      
      toast({
        title: tf("comp.successTitle"),
        description: tf("comp.successMessage"),
      });
      
      setLocation(`/${language}/price-comparison`);
    } catch (error: any) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message || (language === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === totalSteps) {
      await saveOnboardingData();
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
      case 2: return comparisonPriority !== "";
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  const currentDemoItem = DEMO_ITEMS[selectedDemoItem];
  const sortedPrices = [...currentDemoItem.prices].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedPrices[0].price;
  const highestPrice = sortedPrices[sortedPrices.length - 1].price;
  const potentialSavings = highestPrice - lowestPrice;

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
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <TrendingDown className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("comp.step2.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-step-subtitle">
          {tf("comp.step2.subtitle")}
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

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Search className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("comp.step3.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-step-subtitle">
          {tf("comp.step3.subtitle")}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={tf("comp.searchPlaceholder")}
          className="pl-10 h-12 text-lg"
          data-testid="input-search"
        />
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-3">{tf("comp.orTry")}</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ITEMS.map((item, index) => (
            <Button
              key={item.id}
              variant={selectedDemoItem === index ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDemoItem(index)}
              className={selectedDemoItem === index ? "bg-blue-600" : ""}
              data-testid={`button-demo-${item.id}`}
            >
              {language === "ar" ? item.nameAr : item.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            {language === "ar" ? currentDemoItem.nameAr : currentDemoItem.name}
          </h3>
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {tf("comp.savings")} {potentialSavings} AED
          </span>
        </div>
        
        <div className="space-y-2">
          {sortedPrices.map((price, index) => (
            <div
              key={price.store}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0 ? "bg-green-100 border-2 border-green-400" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${price.color} rounded-lg flex items-center justify-center text-lg`}>
                  {price.logo}
                </div>
                <span className="font-medium text-gray-800">
                  {language === "ar" ? price.storeAr : price.store}
                </span>
                {index === 0 && (
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                    {tf("comp.bestPrice")}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className={`font-bold ${index === 0 ? "text-green-600 text-lg" : "text-gray-700"}`}>
                  {price.price} AED
                </span>
                {price.originalPrice > price.price && (
                  <span className="text-xs text-gray-400 line-through ml-2">
                    {price.originalPrice} AED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <ShoppingCart className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("comp.step4.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-step-subtitle">
          {tf("comp.step4.subtitle")}
        </p>
      </div>

      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
          <h3 className="font-bold text-lg">{tf("comp.demoTitle")}</h3>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <h4 className="font-semibold text-gray-900">
              {language === "ar" ? currentDemoItem.nameAr : currentDemoItem.name}
            </h4>
          </div>
          
          {sortedPrices.slice(0, 3).map((price, index) => (
            <div
              key={price.store}
              className={`flex items-center justify-between p-3 mb-2 rounded-lg ${
                index === 0 ? "bg-green-50 border border-green-200" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${price.color} rounded-lg flex items-center justify-center text-xl`}>
                  {price.logo}
                </div>
                <div>
                  <span className="font-medium text-gray-800 block">
                    {language === "ar" ? price.storeAr : price.store}
                  </span>
                  {index === 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      {tf("comp.lowestPriceLabel")} ✓
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold text-lg ${index === 0 ? "text-green-600" : "text-gray-700"}`}>
                  {price.price} AED
                </span>
                <Button
                  size="sm"
                  className={index === 0 ? "bg-green-600 hover:bg-green-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
                  data-testid={`button-add-cart-${price.store}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-green-50 p-4 border-t border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-green-700 font-medium">{tf("comp.youSave")} </span>
              <span className="text-green-700 font-bold text-xl">{potentialSavings} AED</span>
            </div>
            <span className="text-sm text-green-600">{tf("comp.comparedTo")}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setSelectedDemoItem((prev) => (prev + 1) % DEMO_ITEMS.length)}
          className="gap-2"
          data-testid="button-try-another"
        >
          {tf("comp.tryAnother")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("comp.step5.title")}
        </h2>
        <p className="text-gray-600" data-testid="text-step-subtitle">
          {tf("comp.step5.subtitle")}
        </p>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
        <div className="space-y-3">
          {[
            { icon: Gift, text: tf("comp.step5.benefit1") },
            { icon: Sparkles, text: tf("comp.step5.benefit2") },
            { icon: Mail, text: tf("comp.step5.benefit3") },
            { icon: Percent, text: tf("comp.step5.benefit4") },
          ].map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <benefit.icon className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-gray-700">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="email"
            value={betaEmail}
            onChange={(e) => setBetaEmail(e.target.value)}
            placeholder={tf("comp.emailPlaceholder")}
            className="pl-10 h-12"
            data-testid="input-beta-email"
          />
        </div>
        <Input
          value={betaName}
          onChange={(e) => setBetaName(e.target.value)}
          placeholder={tf("comp.namePlaceholder")}
          className="h-12"
          data-testid="input-beta-name"
        />
      </div>

      <Button
        onClick={handleBetaSignup}
        disabled={!betaEmail.trim() || isSubmitting}
        className="w-full h-12 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold"
        data-testid="button-beta-signup"
      >
        {isSubmitting ? tf("comp.joining") : tf("comp.getBetaAccess")}
        <Crown className="h-5 w-5 ml-2" />
      </Button>

      <Button
        variant="ghost"
        onClick={handleNext}
        className="w-full text-gray-500"
        data-testid="button-skip-beta"
      >
        {tf("comp.skipForNow")}
      </Button>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
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

          {currentStep !== 5 && (
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
                  {tf("comp.next")}
                  <ChevronRight className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="w-full"
                data-testid="button-back"
              >
                <ChevronLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {tf("comp.back")}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
