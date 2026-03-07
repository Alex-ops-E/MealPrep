import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronLeft, Globe, Store, Search, ShoppingCart, Plus, Check, Percent, TrendingDown, ShoppingBasket, Dumbbell, Film, Coffee, X, Sparkles, Bell, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
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

const PREASSEMBLED_BASKETS = {
  everyday: {
    id: "everyday",
    icon: Coffee,
    color: "bg-amber-500",
    items: [
      { id: "bread", name: "Fresh Bread", nameAr: "خبز طازج", quantity: "1 loaf", quantityAr: "رغيف واحد" },
      { id: "milk", name: "Fresh Milk (1L)", nameAr: "حليب طازج (1 لتر)", quantity: "2", quantityAr: "2" },
      { id: "eggs", name: "Eggs (30 pack)", nameAr: "بيض (30 حبة)", quantity: "1", quantityAr: "1" },
      { id: "cheese", name: "Cheese Slices", nameAr: "شرائح جبنة", quantity: "1 pack", quantityAr: "علبة واحدة" },
      { id: "yogurt", name: "Greek Yogurt", nameAr: "زبادي يوناني", quantity: "500g", quantityAr: "500 جم" },
      { id: "fruits", name: "Mixed Fruits", nameAr: "فواكه مشكلة", quantity: "1kg", quantityAr: "1 كجم" },
    ]
  },
  movienight: {
    id: "movienight",
    icon: Film,
    color: "bg-purple-500",
    items: [
      { id: "popcorn", name: "Popcorn Kernels", nameAr: "حبوب فشار", quantity: "500g", quantityAr: "500 جم" },
      { id: "chips", name: "Potato Chips", nameAr: "رقائق بطاطس", quantity: "3 bags", quantityAr: "3 أكياس" },
      { id: "soda", name: "Soft Drinks", nameAr: "مشروبات غازية", quantity: "6 pack", quantityAr: "6 علب" },
      { id: "candy", name: "Mixed Candy", nameAr: "حلويات مشكلة", quantity: "1 pack", quantityAr: "علبة واحدة" },
      { id: "nachos", name: "Nachos & Dip", nameAr: "ناتشوز وصلصة", quantity: "1 set", quantityAr: "طقم واحد" },
      { id: "icecream", name: "Ice Cream (1L)", nameAr: "آيس كريم (1 لتر)", quantity: "1", quantityAr: "1" },
    ]
  },
  training: {
    id: "training",
    icon: Dumbbell,
    color: "bg-green-600",
    items: [
      { id: "chicken", name: "Chicken Breast", nameAr: "صدور دجاج", quantity: "1kg", quantityAr: "1 كجم" },
      { id: "eggs_training", name: "Eggs (30 pack)", nameAr: "بيض (30 حبة)", quantity: "1", quantityAr: "1" },
      { id: "oats", name: "Oatmeal", nameAr: "شوفان", quantity: "1kg", quantityAr: "1 كجم" },
      { id: "banana", name: "Bananas", nameAr: "موز", quantity: "1kg", quantityAr: "1 كجم" },
      { id: "peanut", name: "Peanut Butter", nameAr: "زبدة فول سوداني", quantity: "500g", quantityAr: "500 جم" },
      { id: "rice", name: "Brown Rice", nameAr: "أرز بني", quantity: "2kg", quantityAr: "2 كجم" },
      { id: "broccoli", name: "Broccoli", nameAr: "بروكلي", quantity: "500g", quantityAr: "500 جم" },
      { id: "salmon", name: "Salmon Fillet", nameAr: "فيليه سلمون", quantity: "500g", quantityAr: "500 جم" },
    ]
  }
};

const SEARCH_SUGGESTIONS = [
  { id: "avocado", name: "Avocados", nameAr: "أفوكادو", quantity: "3 pcs", quantityAr: "3 حبات" },
  { id: "tomatoes", name: "Tomatoes", nameAr: "طماطم", quantity: "1kg", quantityAr: "1 كجم" },
  { id: "onions", name: "Onions", nameAr: "بصل", quantity: "1kg", quantityAr: "1 كجم" },
  { id: "garlic", name: "Garlic", nameAr: "ثوم", quantity: "500g", quantityAr: "500 جم" },
  { id: "olive_oil", name: "Olive Oil", nameAr: "زيت زيتون", quantity: "1L", quantityAr: "1 لتر" },
  { id: "pasta", name: "Pasta", nameAr: "معكرونة", quantity: "500g", quantityAr: "500 جم" },
  { id: "tuna", name: "Canned Tuna", nameAr: "تونة معلبة", quantity: "3 cans", quantityAr: "3 علب" },
  { id: "honey", name: "Honey", nameAr: "عسل", quantity: "500g", quantityAr: "500 جم" },
  { id: "almonds", name: "Almonds", nameAr: "لوز", quantity: "250g", quantityAr: "250 جم" },
  { id: "spinach", name: "Spinach", nameAr: "سبانخ", quantity: "500g", quantityAr: "500 جم" },
];

export default function OnboardingBasket({ params }: { params?: { step?: string } }) {
  const [location, setLocation] = useLocation();
  const { language, isRTL } = useLanguage();

  const stepParam = params?.step ? parseInt(params.step, 10) : 1;
  const currentStep = stepParam >= 1 && stepParam <= 4 ? stepParam : 1;

  const setCurrentStep = (step: number) => {
    setLocation(`/${language}/onboarding-basket/${step}`);
  };

  const handleLanguageChange = (newLang: "en" | "ar") => {
    setLocation(`/${newLang}/onboarding-basket/${currentStep}`);
  };

  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [comparisonPriority, setComparisonPriority] = useState<string>("");
  const [showAddStore, setShowAddStore] = useState(false);
  const [customStoreName, setCustomStoreName] = useState("");
  const [customStores, setCustomStores] = useState<{id: string; name: string}[]>([]);
  const [selectedBasket, setSelectedBasket] = useState<string | null>(null);
  const [basketItems, setBasketItems] = useState<typeof PREASSEMBLED_BASKETS.everyday.items>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const totalSteps = 4;

  const translations: Record<string, Record<string, string>> = {
    en: {
      "basket.step1.title": "Where do you usually shop?",
      "basket.step1.subtitle": "Select your favorite grocery stores for price comparison",
      "basket.lulu": "Lulu Hypermarket",
      "basket.carrefour": "Carrefour",
      "basket.noon": "Noon",
      "basket.talabat": "Talabat",
      "basket.addStore": "Add other store",
      "basket.enterStoreName": "Enter store name",
      "basket.add": "Add",
      
      "basket.step2.title": "What matters most to you?",
      "basket.step2.subtitle": "We'll prioritize results based on your preference",
      "basket.lowestPrice": "Lowest Price",
      "basket.lowestPriceDesc": "Always show the cheapest option first",
      "basket.bestDeals": "Best Deals & Offers",
      "basket.bestDealsDesc": "Highlight discounts and promotions",
      "basket.fastestDelivery": "Fastest Delivery",
      "basket.fastestDeliveryDesc": "Prioritize stores with quick delivery",
      "basket.organicOptions": "Organic & Healthy",
      "basket.organicOptionsDesc": "Focus on organic and health products",
      
      "basket.step3.title": "What do you want to compare prices for?",
      "basket.step3.subtitle": "Pick a basket and we'll find the best prices across stores",
      "basket.everyday": "Everyday Essentials",
      "basket.everydayDesc": "Compare prices for daily grocery staples",
      "basket.movienight": "Movie Night Snacks",
      "basket.movienightDesc": "Compare prices for snacks and treats",
      "basket.training": "Fitness & Training",
      "basket.trainingDesc": "Compare prices for high-protein essentials",
      "basket.items": "items",
      
      "basket.step4.title": "Review Items for Price Comparison",
      "basket.step4.subtitle": "Add or remove items, then compare prices across stores",
      "basket.searchPlaceholder": "Search for items to add...",
      "basket.yourItems": "Your Items",
      "basket.addMore": "Add More Items",
      "basket.remove": "Remove",
      "basket.noResults": "No items found",
      
      "basket.back": "Back",
      "basket.next": "Next",
      "basket.skip": "Skip",
      "basket.comparePrices": "Compare Prices",
      "basket.step": "Step",
      
      "waitlist.title": "We're almost ready!",
      "waitlist.subtitle": "Price comparison is launching soon. Join the waitlist to be the first to know when it's live.",
      "waitlist.emailPlaceholder": "Enter your email",
      "waitlist.join": "Join Waitlist",
      "waitlist.skip": "Skip, continue anyway",
      "waitlist.success": "You're on the list!",
      "waitlist.successMsg": "We'll notify you as soon as price comparison goes live.",
    },
    ar: {
      "basket.step1.title": "أين تتسوق عادة؟",
      "basket.step1.subtitle": "اختر متاجر البقالة المفضلة لديك لمقارنة الأسعار",
      "basket.lulu": "لولو هايبرماركت",
      "basket.carrefour": "كارفور",
      "basket.noon": "نون",
      "basket.talabat": "طلبات",
      "basket.addStore": "إضافة متجر آخر",
      "basket.enterStoreName": "أدخل اسم المتجر",
      "basket.add": "إضافة",
      
      "basket.step2.title": "ما الأهم بالنسبة لك؟",
      "basket.step2.subtitle": "سنعطي الأولوية للنتائج بناءً على تفضيلاتك",
      "basket.lowestPrice": "أقل سعر",
      "basket.lowestPriceDesc": "عرض الخيار الأرخص دائماً أولاً",
      "basket.bestDeals": "أفضل العروض والخصومات",
      "basket.bestDealsDesc": "تسليط الضوء على الخصومات والعروض الترويجية",
      "basket.fastestDelivery": "أسرع توصيل",
      "basket.fastestDeliveryDesc": "إعطاء الأولوية للمتاجر ذات التوصيل السريع",
      "basket.organicOptions": "عضوي وصحي",
      "basket.organicOptionsDesc": "التركيز على المنتجات العضوية والصحية",
      
      "basket.step3.title": "ما الذي تريد مقارنة أسعاره؟",
      "basket.step3.subtitle": "اختر سلة وسنجد لك أفضل الأسعار في المتاجر",
      "basket.everyday": "أساسيات يومية",
      "basket.everydayDesc": "قارن أسعار مستلزمات البقالة اليومية",
      "basket.movienight": "وجبات ليلة الفيلم",
      "basket.movienightDesc": "قارن أسعار الوجبات الخفيفة والحلويات",
      "basket.training": "لياقة وتدريب",
      "basket.trainingDesc": "قارن أسعار أساسيات البروتين العالي",
      "basket.items": "منتجات",
      
      "basket.step4.title": "راجع المنتجات لمقارنة الأسعار",
      "basket.step4.subtitle": "أضف أو أزل منتجات، ثم قارن الأسعار في المتاجر",
      "basket.searchPlaceholder": "ابحث عن منتجات لإضافتها...",
      "basket.yourItems": "منتجاتك",
      "basket.addMore": "أضف المزيد",
      "basket.remove": "إزالة",
      "basket.noResults": "لم يتم العثور على منتجات",
      
      "basket.back": "رجوع",
      "basket.next": "التالي",
      "basket.skip": "تخطي",
      "basket.comparePrices": "قارن الأسعار",
      "basket.step": "الخطوة",
      
      "waitlist.title": "نحن على وشك الإطلاق!",
      "waitlist.subtitle": "مقارنة الأسعار ستتوفر قريباً. انضم لقائمة الانتظار لتكون أول من يعرف.",
      "waitlist.emailPlaceholder": "أدخل بريدك الإلكتروني",
      "waitlist.join": "انضم لقائمة الانتظار",
      "waitlist.skip": "تخطي، تابع على أي حال",
      "waitlist.success": "أنت في القائمة!",
      "waitlist.successMsg": "سنبلغك فور توفر مقارنة الأسعار.",
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

  const handleSelectBasket = (basketId: string) => {
    setSelectedBasket(basketId);
    const basket = PREASSEMBLED_BASKETS[basketId as keyof typeof PREASSEMBLED_BASKETS];
    if (basket) {
      setBasketItems([...basket.items]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setBasketItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddItem = (item: typeof SEARCH_SUGGESTIONS[0]) => {
    if (!basketItems.find(i => i.id === item.id)) {
      setBasketItems(prev => [...prev, item]);
    }
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleAddCustomItem = (itemName: string) => {
    const customId = `custom_${Date.now()}`;
    const newItem = {
      id: customId,
      name: itemName,
      nameAr: itemName,
      quantity: "1",
      quantityAr: "1"
    };
    setBasketItems(prev => [...prev, newItem]);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const filteredSuggestions = SEARCH_SUGGESTIONS.filter(item => {
    const query = searchQuery.toLowerCase();
    const itemName = language === "ar" ? item.nameAr.toLowerCase() : item.name.toLowerCase();
    return itemName.includes(query) && !basketItems.find(i => i.id === item.id);
  });

  const proceedToComparison = () => {
    const itemsForComparison = basketItems.map(item => ({
      id: item.id,
      name: language === "ar" ? item.nameAr : item.name,
      quantity: language === "ar" ? item.quantityAr : item.quantity,
      unit: ""
    }));
    localStorage.setItem("onboardingBasketItems", JSON.stringify(itemsForComparison));
    localStorage.setItem("onboardingSelectedStores", JSON.stringify(selectedStores));
    setLocation(`/${language}`);
  };

  const handleWaitlistSubmit = () => {
    if (waitlistEmail.trim()) {
      setWaitlistSubmitted(true);
      setTimeout(() => {
        setShowWaitlist(false);
        proceedToComparison();
      }, 1500);
    }
  };

  const handleNext = () => {
    if (currentStep === totalSteps) {
      setShowWaitlist(true);
      return;
    }
    
    if (currentStep === 3 && selectedBasket) {
      const basket = PREASSEMBLED_BASKETS[selectedBasket as keyof typeof PREASSEMBLED_BASKETS];
      if (basket && basketItems.length === 0) {
        setBasketItems([...basket.items]);
      }
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
      case 3: return selectedBasket !== null;
      case 4: return basketItems.length > 0;
      default: return true;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <Store className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("basket.step1.title")}
        </h2>
        <p className="text-gray-600 text-sm sm:text-base" data-testid="text-step-subtitle">
          {tf("basket.step1.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {PREFERRED_STORES.map(store => (
          <button
            key={store.id}
            onClick={() => handleStoreToggle(store.id)}
            className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-start ${
              selectedStores.includes(store.id)
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            data-testid={`button-store-${store.id}`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${store.color} rounded-lg flex items-center justify-center text-xl sm:text-2xl`}>
                {store.logo}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 text-sm sm:text-base block truncate">
                  {language === "ar" ? store.nameAr : store.name}
                </span>
              </div>
              {selectedStores.includes(store.id) && (
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
              )}
            </div>
          </button>
        ))}
        
        {customStores.map(store => (
          <button
            key={store.id}
            onClick={() => handleStoreToggle(store.id)}
            className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-start ${
              selectedStores.includes(store.id)
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            data-testid={`button-store-${store.id}`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                🏬
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 text-sm sm:text-base block truncate">{store.name}</span>
              </div>
              {selectedStores.includes(store.id) && (
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
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
          {tf("basket.addStore")}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input
            value={customStoreName}
            onChange={(e) => setCustomStoreName(e.target.value)}
            placeholder={tf("basket.enterStoreName")}
            className="flex-1"
            data-testid="input-custom-store"
          />
          <Button onClick={handleAddCustomStore} className="bg-orange-600 hover:bg-orange-700" data-testid="button-add-custom-store">
            {tf("basket.add")}
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("basket.step2.title")}
        </h2>
        <p className="text-gray-600 text-sm sm:text-base" data-testid="text-step-subtitle">
          {tf("basket.step2.subtitle")}
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
              className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-start ${
                comparisonPriority === priority
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              data-testid={`button-priority-${priority}`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                  comparisonPriority === priority ? "bg-purple-200" : "bg-gray-100"
                }`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${comparisonPriority === priority ? "text-purple-600" : "text-gray-500"}`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{tf(`basket.${priority}`)}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{tf(`basket.${priority}Desc`)}</div>
                </div>
                {comparisonPriority === priority && (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
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
          <TrendingDown className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("basket.step3.title")}
        </h2>
        <p className="text-gray-600 text-sm sm:text-base" data-testid="text-step-subtitle">
          {tf("basket.step3.subtitle")}
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(PREASSEMBLED_BASKETS).map(([key, basket]) => {
          const Icon = basket.icon;
          return (
            <button
              key={key}
              onClick={() => handleSelectBasket(key)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-start ${
                selectedBasket === key
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              data-testid={`button-basket-${key}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${basket.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-base sm:text-lg">
                    {tf(`basket.${key}`)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {tf(`basket.${key}Desc`)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {basket.items.length} {tf("basket.items")}
                  </div>
                </div>
                {selectedBasket === key && (
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0" />
                )}
              </div>
              
              {selectedBasket === key && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex flex-wrap gap-2">
                    {basket.items.slice(0, 4).map(item => (
                      <span key={item.id} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                        {language === "ar" ? item.nameAr : item.name}
                      </span>
                    ))}
                    {basket.items.length > 4 && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        +{basket.items.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Search className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2" data-testid="text-step-title">
          {tf("basket.step4.title")}
        </h2>
        <p className="text-gray-600 text-sm sm:text-base" data-testid="text-step-subtitle">
          {tf("basket.step4.subtitle")}
        </p>
      </div>

      <div className="relative">
        <Search className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
        <Input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(e.target.value.length > 0);
          }}
          onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
          placeholder={tf("basket.searchPlaceholder")}
          className={`h-12 text-base ${isRTL ? 'pr-10' : 'pl-10'}`}
          data-testid="input-search-items"
        />
        
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
            {filteredSuggestions.length > 0 && filteredSuggestions.map(item => (
              <button
                key={item.id}
                onClick={() => handleAddItem(item)}
                className="w-full p-3 text-start hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                data-testid={`button-add-${item.id}`}
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {language === "ar" ? item.nameAr : item.name}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({language === "ar" ? item.quantityAr : item.quantity})
                  </span>
                </div>
                <Plus className="h-4 w-4 text-green-600" />
              </button>
            ))}
            {searchQuery.trim() && (
              <button
                onClick={() => handleAddCustomItem(searchQuery.trim())}
                className="w-full p-3 text-start hover:bg-green-50 flex items-center justify-between border-t border-gray-200 bg-green-50/50"
                data-testid="button-add-custom"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700">
                    {language === "ar" ? `أضف "${searchQuery.trim()}"` : `Add "${searchQuery.trim()}"`}
                  </span>
                </div>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  {language === "ar" ? "منتج مخصص" : "Custom item"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBasket className="h-5 w-5 text-green-600" />
            {tf("basket.yourItems")}
          </h3>
          <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
            {basketItems.length} {tf("basket.items")}
          </span>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {basketItems.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100"
              data-testid={`item-${item.id}`}
            >
              <div className="flex-1">
                <span className="font-medium text-gray-900">
                  {language === "ar" ? item.nameAr : item.name}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  ({language === "ar" ? item.quantityAr : item.quantity})
                </span>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                data-testid={`button-remove-${item.id}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-full">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {language === "ar" ? "جاهز للمقارنة!" : "Ready to compare!"}
            </p>
            <p className="text-sm text-gray-600">
              {language === "ar" 
                ? `سنقارن أسعار ${basketItems.length} منتجات في ${selectedStores.length} متاجر`
                : `We'll compare prices for ${basketItems.length} items across ${selectedStores.length} stores`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 overflow-x-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              {language === "ar" ? "العربية" : "English"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
              English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange("ar")}>
              العربية
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 sm:py-12">
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 === currentStep
                  ? "w-8 bg-orange-500"
                  : i + 1 < currentStep
                  ? "w-4 bg-orange-300"
                  : "w-4 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="text-center text-sm text-gray-500 mb-4">
          {tf("basket.step")} {currentStep} / {totalSteps}
        </div>

        <Card className="p-4 sm:p-8 bg-white/80 backdrop-blur shadow-xl border-0">
          {renderCurrentStep()}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
              data-testid="button-back"
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {tf("basket.back")}
            </Button>

            <div className="flex gap-2">
              {!canProceed() && currentStep < totalSteps && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-500"
                  data-testid="button-skip"
                >
                  {tf("basket.skip")}
                </Button>
              )}

              {currentStep === totalSteps && (
                <Button
                  variant="ghost"
                  onClick={() => setLocation(`/${language}`)}
                  className="text-gray-500"
                  data-testid="button-skip-home"
                >
                  {language === "ar" ? "تخطي" : "Skip"}
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-orange-600 hover:bg-orange-700 gap-2"
                data-testid="button-next"
              >
                {currentStep === totalSteps ? tf("basket.comparePrices") : tf("basket.next")}
                {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {showWaitlist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowWaitlist(false);
              }}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="button-close-waitlist"
            >
              <X className="h-5 w-5" />
            </button>

            {!waitlistSubmitted ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <Bell className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {tf("waitlist.title")}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-6">
                  {tf("waitlist.subtitle")}
                </p>

                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Mail className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                    <Input
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleWaitlistSubmit()}
                      placeholder={tf("waitlist.emailPlaceholder")}
                      className={`h-12 ${isRTL ? 'pr-10' : 'pl-10'}`}
                      data-testid="input-waitlist-email"
                    />
                  </div>
                  <Button
                    onClick={handleWaitlistSubmit}
                    disabled={!waitlistEmail.trim()}
                    className="h-12 bg-orange-600 hover:bg-orange-700 px-4 sm:px-6 whitespace-nowrap"
                    data-testid="button-join-waitlist"
                  >
                    {tf("waitlist.join")}
                  </Button>
                </div>

                <button
                  onClick={() => {
                    setShowWaitlist(false);
                    proceedToComparison();
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
                  data-testid="button-skip-waitlist"
                >
                  {tf("waitlist.skip")}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {tf("waitlist.success")}
                </h3>
                <p className="text-gray-600 text-sm">
                  {tf("waitlist.successMsg")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
