import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronLeft, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GROCERY_GOALS = [
  "saveMoney",
  "eatHealthier",
  "tryNewRecipes",
  "trackProgress"
];

const COOKING_FREQUENCY = [
  "daily",
  "coupleTimes",
  "weekly",
  "rarely"
];

const PREFERRED_STORES = [
  "superindo",
  "alfamart",
  "indomaret",
  "lazada",
  "shopee"
];

const DIET_PREFERENCES = [
  "noPreference",
  "vegetarian",
  "vegan",
  "keto",
  "halal",
  "glutenFree",
  "dairyFree",
  "other"
];

export default function Onboarding() {
  const [location, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleLanguageChange = (newLang: "en" | "id") => {
    const currentPath = location.replace(/^\/(en|id)/, '');
    setLocation(`/${newLang}${currentPath || ''}`);
  };

  const [groceryGoal, setGroceryGoal] = useState<string>("");
  const [cookingFrequency, setCookingFrequency] = useState<string>("");
  const [preferredStores, setPreferredStores] = useState<string[]>([]);
  const [dietPreferences, setDietPreferences] = useState<string[]>([]);
  const [otherDiet, setOtherDiet] = useState("");
  const [email, setEmail] = useState("");

  const totalSteps = 5;

  const handleStoreToggle = (store: string) => {
    setPreferredStores(prev =>
      prev.includes(store)
        ? prev.filter(s => s !== store)
        : [...prev, store]
    );
  };

  const handleDietToggle = (diet: string) => {
    setDietPreferences(prev =>
      prev.includes(diet)
        ? prev.filter(d => d !== diet)
        : [...prev, diet]
    );
  };

  const handleNext = () => {
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
    if (currentStep === 1) setGroceryGoal("");
    if (currentStep === 2) setCookingFrequency("");
    if (currentStep === 3) setPreferredStores([]);
    if (currentStep === 4) {
      setDietPreferences([]);
      setOtherDiet("");
    }
    if (currentStep === 5) setEmail("");
    
    if (currentStep < totalSteps) {
      handleNext();
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const finalDietPreferences = dietPreferences.includes("other") && otherDiet
        ? [...dietPreferences.filter(d => d !== "other"), otherDiet]
        : dietPreferences;

      await apiRequest("POST", "/api/onboarding", {
        sessionId,
        groceryGoal: groceryGoal || null,
        cookingFrequency: cookingFrequency || null,
        preferredStores: preferredStores.length > 0 ? preferredStores : null,
        dietPreferences: finalDietPreferences.length > 0 ? finalDietPreferences : null,
        email: email || null,
      });

      setLocation(`/${language}`);
    } catch (error) {
      console.error("Failed to save onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-question-title">
                {t("onboarding.q1.title")}
              </h2>
              <p className="text-gray-600" data-testid="text-question-subtitle">
                {t("onboarding.q1.subtitle")}
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
                  {t(`onboarding.q1.options.${goal}`)}
                </Button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-question-title">
                {t("onboarding.q2.title")}
              </h2>
              <p className="text-gray-600" data-testid="text-question-subtitle">
                {t("onboarding.q2.subtitle")}
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
                  {t(`onboarding.q2.options.${freq}`)}
                </Button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-question-title">
                {t("onboarding.q3.title")}
              </h2>
              <p className="text-gray-600" data-testid="text-question-subtitle">
                {t("onboarding.q3.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PREFERRED_STORES.map((store) => (
                <Button
                  key={store}
                  variant={preferredStores.includes(store) ? "default" : "outline"}
                  className={`h-auto py-4 ${preferredStores.includes(store) ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                  onClick={() => handleStoreToggle(store)}
                  data-testid={`button-store-${store}`}
                >
                  {t(`onboarding.q3.options.${store}`)}
                </Button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-question-title">
                {t("onboarding.q4.title")}
              </h2>
              <p className="text-gray-600" data-testid="text-question-subtitle">
                {t("onboarding.q4.subtitle")}
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
                  {t(`onboarding.q4.options.${diet}`)}
                </Button>
              ))}
            </div>
            {dietPreferences.includes("other") && (
              <div className="mt-4">
                <Input
                  type="text"
                  placeholder={t("onboarding.q4.otherPlaceholder")}
                  value={otherDiet}
                  onChange={(e) => setOtherDiet(e.target.value)}
                  className="w-full"
                  data-testid="input-other-diet"
                />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-question-title">
                {t("onboarding.q5.title")}
              </h2>
              <p className="text-gray-600" data-testid="text-question-subtitle">
                {t("onboarding.q5.subtitle")}
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t("onboarding.q5.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-lg py-6"
                data-testid="input-email"
              />
              <p className="text-xs text-gray-500 mt-3 text-center">
                {t("onboarding.q5.privacy")}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl p-8 shadow-xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500" data-testid="text-step-counter">
              {t("onboarding.step")} {currentStep} {t("onboarding.of")} {totalSteps}
            </span>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 font-semibold" data-testid="button-language">
                    <Globe className="h-4 w-4" />
                    <span className="uppercase text-sm">{language}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleLanguageChange("en")}
                    className={language === "en" ? "bg-blue-50" : ""}
                    data-testid="language-english"
                  >
                    🇺🇸 {t("language.english")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleLanguageChange("id")}
                    className={language === "id" ? "bg-blue-50" : ""}
                    data-testid="language-indonesian"
                  >
                    🇮🇩 {t("language.indonesian")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700"
                data-testid="button-skip"
              >
                {t("onboarding.skip")}
              </Button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>

        {renderStep()}

        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t("onboarding.back")}
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-next"
            >
              {t("onboarding.next")}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-finish"
            >
              {isSubmitting ? t("onboarding.submitting") : t("onboarding.finish")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
