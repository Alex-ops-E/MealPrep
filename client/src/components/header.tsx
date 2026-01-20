import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Globe, Utensils } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Language = "en" | "ar";

interface HeaderProps {
  currentStep?: number;
}

export default function Header({ currentStep }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { language, t, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();
  
  const isActive = (path: string) => {
    return location === `/${language}${path}` || location === `/${language}${path}/`;
  };
  
  const handleLanguageChange = (newLang: Language) => {
    const currentPath = location.replace(/^\/(en|ar)/, '');
    setLocation(`/${newLang}${currentPath || ''}`);
  };

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">{t("header.title")}</span>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Link href={`/${language}`}>
              <Button
                variant={isActive("") ? "default" : "ghost"}
                className={isActive("") ? "bg-blue-600 hover:bg-blue-700" : ""}
                data-testid="link-recipe-generator"
              >
                {t("header.recipeGenerator")}
              </Button>
            </Link>
            <Link href={`/${language}/meal-planner`}>
              <Button
                variant={isActive("/meal-planner") ? "default" : "ghost"}
                className={isActive("/meal-planner") ? "bg-blue-600 hover:bg-blue-700" : ""}
                data-testid="link-meal-planner"
              >
                {t("header.mealPlanner")}
              </Button>
            </Link>
            <Link href={`/${language}/price-comparison`}>
              <Button
                variant={isActive("/price-comparison") ? "default" : "ghost"}
                className={isActive("/price-comparison") ? "bg-blue-600 hover:bg-blue-700" : ""}
                data-testid="link-price-comparison"
              >
                {t("header.priceComparison")}
              </Button>
            </Link>
            {isAuthenticated && (
              <Link href={`/${language}/meal-tracker`}>
                <Button
                  variant={isActive("/meal-tracker") ? "default" : "ghost"}
                  className={isActive("/meal-tracker") ? "bg-emerald-600 hover:bg-emerald-700" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}
                  data-testid="link-meal-tracker"
                >
                  <Utensils className="h-4 w-4 me-1" />
                  {t("header.mealTracker")}
                </Button>
              </Link>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 font-semibold" data-testid="button-language">
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
                  onClick={() => handleLanguageChange("ar")}
                  className={language === "ar" ? "bg-blue-50" : ""}
                  data-testid="language-arabic"
                >
                  🇦🇪 {t("language.arabic")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
