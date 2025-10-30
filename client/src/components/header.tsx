import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Language = "en" | "id";

interface HeaderProps {
  currentStep?: number;
}

export default function Header({ currentStep }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { language, t } = useLanguage();
  
  const isActive = (path: string) => {
    return location === `/${language}${path}` || location === `/${language}${path}/`;
  };
  
  const handleLanguageChange = (newLang: Language) => {
    const currentPath = location.replace(/^\/(en|id)/, '');
    setLocation(`/${newLang}${currentPath || ''}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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
                  onClick={() => handleLanguageChange("id")}
                  className={language === "id" ? "bg-blue-50" : ""}
                  data-testid="language-indonesian"
                >
                  🇮🇩 {t("language.indonesian")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
